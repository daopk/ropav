import type {CollectionKey, UseCollectionReturn} from "@/composables/use-collection";
import type {UseListKeyboardProps, UseListKeyboardReturn} from "@/composables/use-list-keyboard";
import type {UseSelectionManagerProps} from "@/composables/use-selection-manager";

import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick} from "vue";

import {useCollection} from "@/composables/use-collection";
import {useListKeyboard} from "@/composables/use-list-keyboard";
import {useSelectionManager} from "@/composables/use-selection-manager";

const scopes: (() => void)[] = [];
const containers: HTMLElement[] = [];

interface Harness {
  keyboard: UseListKeyboardReturn;
  selection: ReturnType<typeof useSelectionManager>;
  collection: UseCollectionReturn;
  container: HTMLElement;
  items: Map<CollectionKey, HTMLElement>;
  press: (key: string, init?: KeyboardEventInit) => KeyboardEvent;
}

const setup = (
  options: {
    keys?: CollectionKey[];
    disabled?: CollectionKey[];
    text?: Record<string, string>;
    keyboard?: Partial<Omit<UseListKeyboardProps, "collection" | "selection" | "element">>;
    selection?: Partial<Omit<UseSelectionManagerProps, "collection">>;
    dir?: "ltr" | "rtl";
  } = {},
): Harness => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  const keys = options.keys ?? ["a", "b", "c", "d"];
  const container = document.createElement("div");

  containers.push(container);
  if (options.dir) container.setAttribute("dir", options.dir);
  document.body.appendChild(container);

  const items = new Map<CollectionKey, HTMLElement>();

  for (const key of keys) {
    // A real button so it is genuinely focusable and shows up in a focusable walk.
    const element = document.createElement("button");

    element.textContent = options.text?.[String(key)] ?? String(key);
    container.appendChild(element);
    items.set(key, element);
  }

  const harness = scope.run(() => {
    const collection = useCollection();

    for (const key of keys) {
      collection.register(key, {
        element: () => items.get(key) ?? null,
        isDisabled: () => Boolean(options.disabled?.includes(key)),
        textValue: () => options.text?.[String(key)] ?? String(key),
      });
    }

    const selection = useSelectionManager({
      collection,
      selectionMode: "single",
      ...options.selection,
    });

    const keyboard = useListKeyboard({
      collection,
      element: () => container,
      selection,
      ...options.keyboard,
    });

    return {collection, keyboard, selection};
  })!;

  const press = (key: string, init: KeyboardEventInit = {}) => {
    const focused = harness.selection.focusedKey.value;
    const target = (focused != null && items.get(focused)) || container;
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      ...init,
    });

    Object.defineProperty(event, "currentTarget", {value: container});
    Object.defineProperty(event, "target", {value: target});
    harness.keyboard.onKeydown(event);

    return event;
  };

  return {...harness, container, items, press};
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  containers.splice(0).forEach((container) => container.remove());
});

describe("useListKeyboard", () => {
  describe("vertical navigation", () => {
    it("enters at the first item on ArrowDown", () => {
      const {press, selection} = setup();

      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("a");
    });

    it("enters at the last item on ArrowUp", () => {
      const {press, selection} = setup();

      press("ArrowUp");

      expect(selection.focusedKey.value).toBe("d");
    });

    it("steps down and up", () => {
      const {press, selection} = setup();

      press("ArrowDown");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("b");

      press("ArrowUp");

      expect(selection.focusedKey.value).toBe("a");
    });

    it("stops at the ends rather than wrapping", () => {
      const {press, selection} = setup();

      press("ArrowUp");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("d");
    });

    it("wraps when asked to", () => {
      const {press, selection} = setup({keyboard: {shouldFocusWrap: true}});

      press("ArrowUp");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("a");
    });

    it("skips a disabled item", () => {
      const {press, selection} = setup({disabled: ["b"]});

      press("ArrowDown");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("c");
    });

    it("does not select while moving", () => {
      // `selectOnFocus` is only true for replace behaviour, which a listbox never uses.
      const {press, selection} = setup();

      press("ArrowDown");
      press("ArrowDown");

      expect(selection.isEmpty.value).toBe(true);
    });

    it("leaves the horizontal arrows to the page", () => {
      // React Aria removes these methods outright on a vertical stack so horizontal scrolling
      // still works.
      const {press, selection} = setup();

      press("ArrowDown");

      const event = press("ArrowRight");

      expect(selection.focusedKey.value).toBe("a");
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("horizontal navigation", () => {
    it("steps with the inline arrows", () => {
      const {press, selection} = setup({keyboard: {orientation: "horizontal"}});

      press("ArrowRight");

      expect(selection.focusedKey.value).toBe("a");

      press("ArrowRight");

      expect(selection.focusedKey.value).toBe("b");

      press("ArrowLeft");

      expect(selection.focusedKey.value).toBe("a");
    });

    it("still answers the block arrows", () => {
      const {press, selection} = setup({keyboard: {orientation: "horizontal"}});

      press("ArrowDown");
      press("ArrowDown");

      expect(selection.focusedKey.value).toBe("b");
    });
  });

  describe("home and end", () => {
    it("jumps to the ends", () => {
      const {press, selection} = setup();

      press("End");

      expect(selection.focusedKey.value).toBe("d");

      press("Home");

      expect(selection.focusedKey.value).toBe("a");
    });

    it("skips a disabled item at the edge", () => {
      const {press, selection} = setup({disabled: ["a", "d"]});

      press("Home");

      expect(selection.focusedKey.value).toBe("b");

      press("End");

      expect(selection.focusedKey.value).toBe("c");
    });

    it("ignores a shifted jump from nowhere", () => {
      // There is no anchor to extend a selection from yet.
      const {press, selection} = setup();

      press("Home", {shiftKey: true});

      expect(selection.focusedKey.value).toBeNull();
    });
  });

  describe("paging", () => {
    it("collapses to the ends when the list does not scroll", () => {
      // With no scroll there is no page to move by, which is also what makes this measurable
      // where layout is not.
      const {press, selection} = setup();

      press("PageDown");

      expect(selection.focusedKey.value).toBe("d");

      press("PageUp");

      expect(selection.focusedKey.value).toBe("a");
    });
  });

  describe("select all", () => {
    it("selects everything on the modifier chord in multiple mode", () => {
      const {press, selection} = setup({selection: {selectionMode: "multiple"}});

      press("a", {ctrlKey: true});

      expect(selection.isSelectAll.value).toBe(true);
    });

    it("is ignored in single mode", () => {
      const {press, selection} = setup();

      press("a", {metaKey: true});

      expect(selection.isEmpty.value).toBe(true);
    });

    it("is ignored when disallowed", () => {
      const {press, selection} = setup({
        keyboard: {disallowSelectAll: true},
        selection: {selectionMode: "multiple"},
      });

      press("a", {ctrlKey: true});

      expect(selection.isEmpty.value).toBe(true);
    });

    it("leaves a bare letter to typeahead", () => {
      const {press, selection} = setup({selection: {selectionMode: "multiple"}});
      const event = press("a");

      expect(selection.isEmpty.value).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("escape", () => {
    it("clears the selection and claims the key", () => {
      const {press, selection} = setup();

      selection.setSelectedKeys(["a"]);

      const event = press("Escape");

      expect(selection.isEmpty.value).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    });

    it("lets the key through when there was nothing to clear", () => {
      // This is what will let a listbox inside a popover still close on Escape.
      const {press} = setup();
      const event = press("Escape");

      expect(event.defaultPrevented).toBe(false);
    });

    it("lets the key through when clearing is turned off", () => {
      const {press, selection} = setup({keyboard: {escapeKeyBehavior: "none"}});

      selection.setSelectedKeys(["a"]);

      const event = press("Escape");

      expect(selection.isEmpty.value).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("tab", () => {
    it("parks focus at the end and hands back to the browser", () => {
      // One Tab has to leave the whole collection, not walk through every item.
      const {items, press} = setup();
      const event = press("Tab");

      expect(document.activeElement).toBe(items.get("d"));
      expect(event.defaultPrevented).toBe(false);
    });

    it("parks focus on the collection itself when shifted", () => {
      const {container, press} = setup();

      container.tabIndex = -1;
      press("Tab", {shiftKey: true});

      expect(document.activeElement).toBe(container);
    });
  });

  describe("activation", () => {
    it("calls onAction on Enter", () => {
      const onAction = vi.fn();
      const {press} = setup({keyboard: {onAction}});

      press("ArrowDown");
      press("Enter");

      expect(onAction).toHaveBeenCalledWith("a");
    });

    it("selects on Space when a mode is set", () => {
      const {press, selection} = setup();

      press("ArrowDown");
      press(" ");

      expect([...selection.selectedKeys.value]).toEqual(["a"]);
    });

    it("acts rather than selects on Space when there is no selection", () => {
      const onAction = vi.fn();
      const {press} = setup({keyboard: {onAction}, selection: {selectionMode: "none"}});

      press("ArrowDown");
      press(" ");

      expect(onAction).toHaveBeenCalledWith("a");
    });
  });

  describe("tabindex", () => {
    it("makes the collection the tab stop until something inside is focused", () => {
      const {keyboard, press} = setup();

      expect(keyboard.collectionTabIndex.value).toBe(0);

      press("ArrowDown");

      expect(keyboard.collectionTabIndex.value).toBe(-1);
    });

    it("gives exactly one item a tab stop", () => {
      const {keyboard, press} = setup();

      press("ArrowDown");
      press("ArrowDown");

      expect(keyboard.itemTabIndex("a")).toBe(-1);
      expect(keyboard.itemTabIndex("b")).toBe(0);
    });

    it("leaves a disabled item out of the tab order entirely", () => {
      // React Aria omits the attribute rather than setting it to -1.
      const {keyboard} = setup({disabled: ["b"]});

      expect(keyboard.itemTabIndex("b")).toBeUndefined();
    });
  });

  describe("focus entry", () => {
    it("prefers the first selected key over the first item", () => {
      const {collection, keyboard, selection} = setup();

      selection.setSelectedKeys(["c"]);
      keyboard.onFocusin(new FocusEvent("focusin"));

      expect(selection.focusedKey.value).toBe("c");
      expect(collection.getElement("c")).toBeTruthy();
    });

    it("enters at the end when focus arrives from later in the document", () => {
      // That is Shift+Tab, and landing on the first item would send the user backwards.
      const {container, keyboard, selection} = setup();
      const after = document.createElement("button");

      document.body.appendChild(after);
      containers.push(after);

      const event = new FocusEvent("focusin");

      Object.defineProperty(event, "relatedTarget", {value: after});
      Object.defineProperty(event, "target", {value: container});
      keyboard.onFocusin(event);
      after.remove();

      expect(selection.focusedKey.value).toBe("d");
    });

    it("reports focus leaving the collection", () => {
      const {keyboard, selection} = setup();

      keyboard.onFocusin(new FocusEvent("focusin"));

      expect(selection.isFocused.value).toBe(true);

      keyboard.onFocusout(new FocusEvent("focusout"));

      expect(selection.isFocused.value).toBe(false);
    });

    it("does not report a departure for focus moving between items", () => {
      const {items, keyboard, selection} = setup();

      keyboard.onFocusin(new FocusEvent("focusin"));

      const event = new FocusEvent("focusout");

      Object.defineProperty(event, "relatedTarget", {value: items.get("b")});
      keyboard.onFocusout(event);

      expect(selection.isFocused.value).toBe(true);
    });
  });

  describe("real focus", () => {
    it("moves DOM focus onto the item a key press landed on", () => {
      const {items, press} = setup();

      press("ArrowDown");

      expect(document.activeElement).toBe(items.get("a"));
    });

    it("follows a key set programmatically once the collection has focus", async () => {
      const {items, keyboard, selection} = setup();

      keyboard.onFocusin(new FocusEvent("focusin"));
      selection.setFocusedKey("c");
      await nextTick();

      expect(document.activeElement).toBe(items.get("c"));
    });
  });

  describe("search", () => {
    it("finds an item by prefix", () => {
      const {keyboard} = setup({
        keys: ["bob", "brenda", "martha"],
        text: {bob: "Bob", brenda: "Brenda", martha: "Martha"},
      });

      expect(keyboard.getKeyForSearch("mar")).toBe("martha");
    });

    it("starts at the key it is given, not after it", () => {
      // A search that has grown by one character has to keep matching the item it is on.
      const {keyboard} = setup({
        keys: ["bob", "brenda"],
        text: {bob: "Bob", brenda: "Brenda"},
      });

      expect(keyboard.getKeyForSearch("b", "bob")).toBe("bob");
    });

    it("matches without regard to case or diacritics", () => {
      const {keyboard} = setup({keys: ["ecole"], text: {ecole: "École"}});

      expect(keyboard.getKeyForSearch("ec")).toBe("ecole");
    });

    it("returns null when nothing matches", () => {
      const {keyboard} = setup();

      expect(keyboard.getKeyForSearch("zz")).toBeNull();
    });

    it("skips a disabled item", () => {
      const {keyboard} = setup({
        disabled: ["brenda"],
        keys: ["bob", "brenda"],
        text: {bob: "Bob", brenda: "Brenda"},
      });

      expect(keyboard.getKeyForSearch("br")).toBeNull();
    });
  });

  describe("keys from outside", () => {
    it("ignores a key event from outside the collection", () => {
      const {container, keyboard, selection} = setup();
      const outside = document.createElement("div");
      const event = new KeyboardEvent("keydown", {cancelable: true, key: "ArrowDown"});

      document.body.appendChild(outside);
      containers.push(outside);
      Object.defineProperty(event, "currentTarget", {value: container});
      Object.defineProperty(event, "target", {value: outside});
      keyboard.onKeydown(event);
      outside.remove();

      expect(selection.focusedKey.value).toBeNull();
    });
  });
});
