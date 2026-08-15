import type {UseAutocompleteOptions, UseAutocompleteReturn} from "@/composables/use-autocomplete";
import type {CollectionKey} from "@/composables/use-collection";

import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useAutocomplete} from "@/composables/use-autocomplete";
import {useCollection} from "@/composables/use-collection";
import {useListKeyboard} from "@/composables/use-list-keyboard";
import {useSelectionManager} from "@/composables/use-selection-manager";

const scopes: (() => void)[] = [];
const nodes: HTMLElement[] = [];

interface Harness {
  autocomplete: UseAutocompleteReturn;
  keyboard: ReturnType<typeof useListKeyboard>;
  selection: ReturnType<typeof useSelectionManager>;
  collection: ReturnType<typeof useCollection>;
  input: HTMLInputElement;
  list: HTMLElement;
  items: Map<CollectionKey, HTMLElement>;
  /** A keydown on the input, as the control renders it: statically wired, not dispatched. */
  press: (key: string, init?: KeyboardEventInit) => KeyboardEvent;
  /** An edit of the text, in the two halves the browser reports it in. */
  type: (value: string, inputType?: string) => void;
}

const setup = (
  options: {
    keys?: CollectionKey[];
    disabled?: CollectionKey[];
    autocomplete?: Partial<
      Omit<
        UseAutocompleteOptions,
        "collection" | "collectionId" | "inputElement" | "keyboard" | "selection"
      >
    >;
    selectionMode?: "single" | "multiple";
  } = {},
): Harness => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const keys = options.keys ?? ["a", "b", "c"];

  const input = document.createElement("input");
  const list = document.createElement("div");

  document.body.append(input, list);
  nodes.push(input, list);

  const items = new Map<CollectionKey, HTMLElement>();

  for (const key of keys) {
    const element = document.createElement("div");

    element.id = `list-option-${key}`;
    element.textContent = String(key);
    list.appendChild(element);
    items.set(key, element);
  }

  const harness = scope.run(() => {
    const collection = useCollection();

    for (const key of keys) {
      collection.register(key, {
        element: () => items.get(key) ?? null,
        isDisabled: () => Boolean(options.disabled?.includes(key)),
        textValue: () => String(key),
      });
    }

    const selection = useSelectionManager({
      collection,
      selectionMode: options.selectionMode ?? "single",
    });

    const keyboard = useListKeyboard({
      collection,
      element: () => list,
      listId: "list",
      selection,
      shouldUseVirtualFocus: true,
    });

    const inputElement = shallowRef<HTMLInputElement | null>(input);

    const autocomplete = useAutocomplete({
      collection,
      collectionId: "list",
      inputElement,
      keyboard,
      selection,
      ...options.autocomplete,
    });

    return {autocomplete, collection, keyboard, selection};
  })!;

  const press = (key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

    Object.defineProperty(event, "target", {value: input});
    harness.autocomplete.onKeydown(event);

    return event;
  };

  const type = (value: string, inputType = "insertText") => {
    input.dispatchEvent(new InputEvent("beforeinput", {bubbles: true, inputType}));
    input.value = value;
    harness.autocomplete.setInputValue(value);
  };

  return {...harness, input, items, list, press, type};
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  nodes.splice(0).forEach((node) => node.remove());
});

describe("useAutocomplete", () => {
  describe("input value", () => {
    it("starts empty and reports what it is set to", () => {
      const onInputChange = vi.fn();
      const {autocomplete} = setup({autocomplete: {onInputChange}});

      expect(autocomplete.inputValue.value).toBe("");

      autocomplete.setInputValue("cat");

      expect(autocomplete.inputValue.value).toBe("cat");
      expect(onInputChange).toHaveBeenCalledWith("cat");
    });

    it("starts on the value it was given", () => {
      const {autocomplete} = setup({autocomplete: {defaultInputValue: "dog"}});

      expect(autocomplete.inputValue.value).toBe("dog");
    });

    it("leaves a controlled value to its owner", () => {
      const onInputChange = vi.fn();
      const {autocomplete} = setup({autocomplete: {inputValue: "pinned", onInputChange}});

      autocomplete.setInputValue("typed");

      expect(autocomplete.inputValue.value).toBe("pinned");
      expect(onInputChange).toHaveBeenCalledWith("typed");
    });
  });

  describe("attributes for the input", () => {
    it("points the input at the collection", () => {
      const {autocomplete} = setup();

      expect(autocomplete.inputAttributes.value["aria-controls"]).toBe("list");
      expect(autocomplete.inputAttributes.value["aria-autocomplete"]).toBe("list");
    });

    it("turns off every suggestion the browser would add of its own", () => {
      const {autocomplete} = setup();
      const attributes = autocomplete.inputAttributes.value;

      expect(attributes.autocomplete).toBe("off");
      expect(attributes.autocorrect).toBe("off");
      expect(attributes.spellcheck).toBe("false");
      expect(attributes.enterkeyhint).toBe("go");
    });

    it("names the option virtual focus is on", () => {
      const {autocomplete, press} = setup();

      expect(autocomplete.inputAttributes.value["aria-activedescendant"]).toBeUndefined();

      press("ArrowDown");

      expect(autocomplete.inputAttributes.value["aria-activedescendant"]).toBe("list-option-a");
    });
  });

  describe("keys handed to the collection", () => {
    it.each(["ArrowDown", "ArrowUp", "Home", "End", "PageUp", "PageDown"])(
      "moves virtual focus on %s and keeps the caret still",
      (key) => {
        const {input, press, selection} = setup();

        input.focus();

        const event = press(key);

        expect(selection.focusedKey.value).not.toBeNull();
        expect(event.defaultPrevented).toBe(true);
        // Asserted alongside, because the focused key would read the same while real focus was
        // quietly moving onto the option as well — which is what this whole layer prevents.
        expect(input).toHaveFocus();
      },
    );

    it("steps through the options", () => {
      const {press, selection} = setup();

      press("ArrowDown");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("b");
    });

    it("leaves Shift+Home to the caret while nothing is focused", () => {
      const {press, selection} = setup();
      const event = press("Home", {shiftKey: true});

      expect(selection.focusedKey.value).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it("hands Shift+End to the collection once something is focused", () => {
      const {press, selection} = setup();

      press("ArrowDown");

      const event = press("End", {shiftKey: true});

      expect(selection.focusedKey.value).toBe("c");
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("keys the caret keeps", () => {
    it("leaves Space alone entirely", () => {
      const {press, selection} = setup();

      press("ArrowDown");

      const event = press(" ");

      // A space is a character in the text being typed, never an activation.
      expect(event.defaultPrevented).toBe(false);
      expect(selection.selectedKeys.value.size).toBe(0);
    });

    it.each(["Escape", "Tab"])("leaves %s to whatever encloses the field", (key) => {
      const {press} = setup();
      const event = press(key);

      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves the inline arrows to the caret while nothing is focused", () => {
      const {press, selection} = setup();
      const event = press("ArrowRight");

      expect(event.defaultPrevented).toBe(false);
      expect(selection.focusedKey.value).toBeNull();
    });

    it("clears virtual focus once an inline arrow is pressed with something focused", () => {
      const {autocomplete, press, selection} = setup();

      press("ArrowDown");
      press("ArrowLeft");

      // The focused node is dropped so a screen reader announcement is not cut off.
      expect(selection.focusedKey.value).toBeNull();
      expect(autocomplete.inputAttributes.value["aria-activedescendant"]).toBeUndefined();
    });
  });

  describe("choosing an option", () => {
    it("selects the focused option on Enter", () => {
      const {press, selection} = setup();

      press("ArrowDown");

      const event = press("Enter");

      expect([...selection.selectedKeys.value]).toEqual(["a"]);
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves Enter to the form while nothing is focused", () => {
      const {press, selection} = setup();
      const event = press("Enter");

      expect(selection.selectedKeys.value.size).toBe(0);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("typing", () => {
    it("moves virtual focus to the first option when text is typed forwards", () => {
      const {selection, type} = setup();

      type("a");

      expect(selection.focusedKey.value).toBe("a");
    });

    it.each(["insertCompositionText", "insertFromComposition"])(
      "treats %s as typing forwards, for an input method that composes",
      (inputType) => {
        const {selection, type} = setup();

        type("あ", inputType);

        expect(selection.focusedKey.value).toBe("a");
      },
    );

    it("skips the first option when asked to", () => {
      const {selection, type} = setup({autocomplete: {disableAutoFocusFirst: true}});

      type("a");

      expect(selection.focusedKey.value).toBeNull();
    });

    it("skips a disabled first option", () => {
      const {selection, type} = setup({disabled: ["a"]});

      type("a");

      expect(selection.focusedKey.value).toBe("b");
    });

    it.each(["insertFromPaste", "deleteContentBackward", "historyUndo"])(
      "clears virtual focus when the text is edited by %s",
      (inputType) => {
        const {press, selection, type} = setup();

        press("ArrowDown");
        type("x", inputType);

        // Anything but typing forwards moves the caret over text that is already there, and
        // lighting an option then would announce a choice nobody made.
        expect(selection.focusedKey.value).toBeNull();
      },
    );

    it("clears virtual focus when the focused option is filtered away", async () => {
      const {collection, press, selection} = setup();

      press("ArrowDown");
      expect(selection.focusedKey.value).toBe("a");

      // Re-registering and immediately unregistering is how an option leaves: the second call
      // returned by `register` drops the entry it made, which is what narrowing the filter does
      // to whichever options stop matching.
      const unregister = collection.register("a", {
        element: () => null,
        isDisabled: () => false,
        textValue: () => "a",
      });

      unregister();
      await nextTick();

      expect(selection.focusedKey.value).toBeNull();
    });
  });

  describe("the pointer", () => {
    it("clears virtual focus when the input itself is pressed", () => {
      const {input, press, selection} = setup();

      press("ArrowDown");
      input.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
      );

      expect(selection.focusedKey.value).toBeNull();
    });

    it("leaves virtual focus alone on a touch", () => {
      const {input, press, selection} = setup();

      press("ArrowDown");
      input.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "touch"}),
      );

      // A tap is not a request to put focus back in the text, so the option stays lit.
      expect(selection.focusedKey.value).toBe("a");
    });

    it("leaves virtual focus alone on a secondary button", () => {
      const {input, press, selection} = setup();

      press("ArrowDown");
      input.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 2, pointerType: "mouse"}),
      );

      expect(selection.focusedKey.value).toBe("a");
    });
  });

  describe("leaving the field", () => {
    it("clears virtual focus on blur", () => {
      const {autocomplete, press, selection} = setup();

      press("ArrowDown");
      autocomplete.onBlur();

      expect(selection.focusedKey.value).toBeNull();
    });
  });

  describe("without virtual focus", () => {
    it("hands no key to the collection at all", () => {
      const {press, selection} = setup({autocomplete: {disableVirtualFocus: true}});
      const event = press("ArrowDown");

      expect(selection.focusedKey.value).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves typing to the text", () => {
      const {selection, type} = setup({autocomplete: {disableVirtualFocus: true}});

      type("a");

      expect(selection.focusedKey.value).toBeNull();
    });
  });
});
