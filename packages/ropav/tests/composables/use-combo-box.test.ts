import type {ComboBoxFixtureItem, ComboBoxHostProps} from "../fixtures/combo-box.types";
import type {UseComboBoxReturn} from "@/composables/use-combo-box";
import type {UseComboBoxStateReturn} from "@/composables/use-combo-box-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/combo-box-host.vue";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const mount = (props: ComboBoxHostProps = {}) => {
  let state!: UseComboBoxStateReturn<ComboBoxFixtureItem>;
  let comboBox!: UseComboBoxReturn;

  const result = renderVapor(Host, {
    props: {
      withListBox: true,
      ...props,
      onComboBoxReady: (next: UseComboBoxReturn) => (comboBox = next),
      onReady: (next: UseComboBoxStateReturn<ComboBoxFixtureItem>) => (state = next),
    },
  });

  cleanups.push(result.unmount);

  const query = <T extends HTMLElement>(testId: string) =>
    result.container.querySelector<T>(`[data-testid="${testId}"]`);

  return {
    comboBox,
    get input() {
      return query<HTMLInputElement>("input")!;
    },
    get label() {
      return query("label")!;
    },
    get listbox() {
      return query("listbox");
    },
    get options() {
      return [...result.container.querySelectorAll<HTMLElement>('[data-testid="option"]')];
    },
    get popover() {
      return query("popover")!;
    },
    state,
    get trigger() {
      return query<HTMLButtonElement>("trigger")!;
    },
  };
};

/** The sync watcher runs at post-flush, so every write has to be given a tick to settle. */
const settle = async () => {
  await nextTick();
  await nextTick();
};

/**
 * Typing, as a browser reports it: the edit is announced before it lands.
 *
 * `beforeinput` is the only event carrying `inputType`, which is what decides whether virtual focus
 * follows the text — so a bare `input` would exercise a path no keystroke ever takes.
 */
const type = async (input: HTMLInputElement, value: string, inputType = "insertText") => {
  input.dispatchEvent(new InputEvent("beforeinput", {bubbles: true, cancelable: true, inputType}));
  input.value = value;
  input.dispatchEvent(new InputEvent("input", {bubbles: true, inputType}));
  await settle();
};

/** A press, which is what opens a picker — a bare pointerdown is not one. */
const press = async (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
  element.dispatchEvent(new PointerEvent("pointerup", {bubbles: true, button: 0}));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  await settle();
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init});

  element.dispatchEvent(event);

  return event;
};

const focus = async (element: HTMLElement) => {
  element.focus();
  element.dispatchEvent(new FocusEvent("focus", {bubbles: false}));
  await settle();
};

const blur = async (element: HTMLElement, relatedTarget: EventTarget | null = null) => {
  element.dispatchEvent(new FocusEvent("blur", {bubbles: false, relatedTarget} as FocusEventInit));
  await settle();
};

describe("useComboBox", () => {
  describe("the field's wiring", () => {
    it("makes the input the combobox itself", () => {
      const {input} = mount();

      // The input *is* the widget, which is the whole difference from a select: there the trigger
      // is a button standing in for a hidden native control.
      expect(input).toHaveAttribute("role", "combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).not.toHaveAttribute("aria-controls");
    });

    it("points aria-controls at the listbox only while it is open", async () => {
      const {comboBox, input, state} = mount();

      state.toggle(null, "manual");
      await settle();

      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(input).toHaveAttribute("aria-controls", comboBox.listId.value);
    });

    it("turns the browser's own suggestions and corrections off", () => {
      const {input} = mount();

      // The list is the suggestion list. Safari correcting the text underneath it, and the
      // browser offering a history dropdown over it, both fight the filter.
      expect(input).toHaveAttribute("autocomplete", "off");
      expect(input).toHaveAttribute("autocorrect", "off");
      expect(input).toHaveAttribute("spellcheck", "false");
    });

    it("names the input from the label", () => {
      const {input, label} = mount();

      expect(label.id).toBeTruthy();
      expect(input).toHaveAttribute("aria-labelledby", label.id);
    });

    it("takes a name of the caller's own instead", () => {
      const {input} = mount({ariaLabel: "Animal"});

      expect(input).toHaveAttribute("aria-label", "Animal");
    });

    it("shows the chosen option's text", () => {
      const {input} = mount({defaultValue: "cat"});

      expect(input.value).toBe("Cat");
    });
  });

  describe("the chevron", () => {
    it("announces that it opens a listbox", () => {
      const {trigger} = mount();

      expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("stays out of the tab order", () => {
      const {trigger} = mount();

      // The field is the tab stop, and the arrows in it do everything the button does — so a
      // second stop would only make a keyboard user pass through a control they never need.
      expect(trigger).toHaveAttribute("tabindex", "-1");
    });

    it("carries a localized name of its own", () => {
      const {trigger} = mount();

      expect(trigger).toHaveAttribute("aria-label", "Show suggestions");
    });

    it("is disabled along with the field", () => {
      expect(mount({isDisabled: true}).trigger).toBeDisabled();
      expect(mount({isReadOnly: true}).trigger).toBeDisabled();
      expect(mount().trigger).not.toBeDisabled();
    });

    it("opens the popover and leaves the caret in the field", async () => {
      const {input, state, trigger} = mount();

      await press(trigger);

      expect(state.isOpen.value).toBe(true);
      expect(document.activeElement).toBe(input);
    });

    it("opens a field that opens on focus, rather than closing it again", async () => {
      const {state, trigger} = mount({menuTrigger: "focus"});

      await press(trigger);

      /*
       * The press focuses the field, and a field that opens on focus is open by the time the toggle
       * is asked — so a toggle running second would read that as "already open" and shut it on the
       * very press meant to open it. React never meets this because both writes are deferred.
       */
      expect(state.isOpen.value).toBe(true);
    });

    it("shows every option, whatever the field says", async () => {
      const {input, state, trigger} = mount();

      await focus(input);
      await type(input, "pa");
      expect(state.collection.size.value).toBe(1);

      // The press that closes what typing opened, then the one that opens by hand.
      await press(trigger);
      await press(trigger);

      expect(state.collection.orderedKeys()).toEqual(["cat", "dog", "panda"]);
    });
  });

  describe("the listbox", () => {
    it("carries a localized name of its own when there is no label to borrow", async () => {
      const {comboBox} = mount({ariaLabel: "Animal"});

      expect(comboBox.listLabel.value["aria-label"]).toBe("Suggestions");
    });

    it("borrows the field's label when there is one", () => {
      const {comboBox, label} = mount();

      // Its own id comes first, which is what keeps its `aria-label` part of the name: assistive
      // technology drops an `aria-label` outright when `aria-labelledby` is also present.
      expect(comboBox.listLabel.value["aria-labelledby"]).toBe(
        `${comboBox.listId.value} ${label.id}`,
      );
      expect(comboBox.listLabel.value["aria-label"]).toBe("Suggestions");
    });
  });

  describe("virtual focus", () => {
    it("names the option the arrows landed on without moving the caret", async () => {
      const {comboBox, input, state} = mount();

      state.toggle(null, "manual");
      await settle();
      await focus(input);

      keydown(input, "ArrowDown");
      await settle();

      expect(state.selection.focusedKey.value).toBe("cat");
      expect(input).toHaveAttribute("aria-activedescendant", `${comboBox.listId.value}-option-cat`);
      expect(document.activeElement).toBe(input);
    });

    it("steps through the options with the arrows", async () => {
      const {input, state} = mount();

      state.toggle(null, "manual");
      await settle();

      keydown(input, "ArrowDown");
      await settle();
      keydown(input, "ArrowDown");
      await settle();

      expect(state.selection.focusedKey.value).toBe("dog");
    });

    it("names nothing once the text moves on", async () => {
      const {input, state} = mount();

      state.toggle(null, "manual");
      await settle();
      keydown(input, "ArrowDown");
      await settle();
      expect(state.selection.focusedKey.value).toBe("cat");

      await type(input, "pa");

      // The option the arrows had landed on is usually one of the ones the filter just removed,
      // so leaving the name behind would point at an element no longer in the document.
      expect(input).not.toHaveAttribute("aria-activedescendant");
      expect(state.selection.focusedKey.value).toBeNull();
    });

    it("opens the popover on ArrowDown when it is shut", async () => {
      const {input, state} = mount();

      await focus(input);
      const event = keydown(input, "ArrowDown");

      await settle();

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("first");
      // The caret keeps the key either way: it moves nothing in a single-line field.
      expect(event.defaultPrevented).toBe(false);
    });

    it("opens it at the far end on ArrowUp", async () => {
      const {input, state} = mount();

      await focus(input);
      keydown(input, "ArrowUp");
      await settle();

      expect(state.isOpen.value).toBe(true);
      expect(state.focusStrategy.value).toBe("last");
    });

    it("hands the paging keys to the list rather than the caret", async () => {
      const {input, state} = mount();

      state.toggle(null, "manual");
      await settle();

      const event = keydown(input, "End");

      await settle();

      expect(state.selection.focusedKey.value).toBe("panda");
      // Claimed before the list sees it, or the caret would also run to the end of the text.
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves a space to the text being typed", async () => {
      const {input, state} = mount();

      state.toggle(null, "manual");
      await settle();
      keydown(input, "ArrowDown");
      await settle();

      const event = keydown(input, " ");

      expect(event.defaultPrevented).toBe(false);
      expect(state.selection.focusedKey.value).toBe("cat");
    });
  });

  describe("choosing", () => {
    it("takes the option the arrows landed on with Enter", async () => {
      const onChange = vi.fn();
      const {input, state} = mount({onChange});

      state.toggle(null, "manual");
      await settle();
      keydown(input, "ArrowDown");
      await settle();

      const event = keydown(input, "Enter");

      await settle();

      expect(onChange).toHaveBeenCalledWith("cat");
      expect(input.value).toBe("Cat");
      expect(state.isOpen.value).toBe(false);
      // Held back only while the options were showing, so a form is not submitted by the same key.
      expect(event.defaultPrevented).toBe(true);
    });

    it("lets Enter submit a form when nothing is showing", async () => {
      const {input} = mount();

      const event = keydown(input, "Enter");

      await settle();

      expect(event.defaultPrevented).toBe(false);
    });

    it("settles the field and closes on Tab, without claiming the key", async () => {
      const {input, state} = mount({defaultValue: "cat"});

      await focus(input);
      await type(input, "Ca");
      const event = keydown(input, "Tab");

      await settle();

      expect(state.isOpen.value).toBe(false);
      expect(input.value).toBe("Cat");
      expect(event.defaultPrevented).toBe(false);
    });

    it("puts the field back on Escape", async () => {
      const {input, state} = mount({defaultValue: "dog"});

      await focus(input);
      await type(input, "Do something");
      keydown(input, "Escape");
      await settle();

      expect(input.value).toBe("Dog");
      expect(state.value.value).toBe("dog");
      expect(state.isOpen.value).toBe(false);
    });
  });

  describe("focus", () => {
    it("reports focus arriving and leaving", async () => {
      const onFocusChange = vi.fn();
      const {input} = mount({onFocusChange});

      await focus(input);
      expect(onFocusChange).toHaveBeenLastCalledWith(true);

      await blur(input);
      expect(onFocusChange).toHaveBeenLastCalledWith(false);
    });

    it("does not treat a blur into the chevron as leaving", async () => {
      const onFocusChange = vi.fn();
      const {input, state, trigger} = mount({onFocusChange});

      await focus(input);
      state.toggle(null, "manual");
      await settle();

      await blur(input, trigger);

      // The chevron is part of the same widget, and pressing it moves focus through itself on the
      // way to the field — so treating that as leaving would close the popover it just opened.
      expect(state.isOpen.value).toBe(true);
      expect(onFocusChange).not.toHaveBeenCalledWith(false);
    });

    it("does not treat a blur into the popover as leaving", async () => {
      const {input, popover, state} = mount();

      await focus(input);
      state.toggle(null, "manual");
      await settle();

      await blur(input, popover);

      expect(state.isOpen.value).toBe(true);
    });

    it("closes and settles on a blur to anywhere else", async () => {
      const outside = document.createElement("button");

      document.body.append(outside);
      cleanups.push(() => outside.remove());

      const {input, state} = mount({defaultValue: "cat"});

      await focus(input);
      await type(input, "Ca");
      expect(state.isOpen.value).toBe(true);

      await blur(input, outside);

      expect(state.isOpen.value).toBe(false);
      expect(input.value).toBe("Cat");
    });
  });

  describe("read-only", () => {
    it("does not open on the arrow keys", async () => {
      const {input, state} = mount({isReadOnly: true});

      await focus(input);
      keydown(input, "ArrowDown");
      await settle();

      expect(state.isOpen.value).toBe(false);
    });

    it("does not open on focus even when asked to", async () => {
      const {input, state} = mount({isReadOnly: true, menuTrigger: "focus"});

      await focus(input);

      expect(state.isOpen.value).toBe(false);
    });

    it("still lets the caller's own keydown through", () => {
      const onKeydown = vi.fn();
      const {input} = mount({isReadOnly: true, onKeydown});

      keydown(input, "ArrowDown");

      expect(onKeydown).toHaveBeenCalled();
    });
  });

  describe("with no listbox beside it", () => {
    it("still opens on the arrow keys", async () => {
      const {input, state} = mount({withListBox: false});

      await focus(input);
      keydown(input, "ArrowDown");
      await settle();

      // Every closed combo box is in this state: the list does not exist until the popover does,
      // so the key that creates it cannot be routed through the list.
      expect(state.isOpen.value).toBe(true);
    });

    it("names no option", async () => {
      const {input, state} = mount({withListBox: false});

      state.toggle(null, "manual");
      await settle();
      keydown(input, "ArrowDown");
      await settle();

      expect(input).not.toHaveAttribute("aria-activedescendant");
    });
  });

  describe("validation", () => {
    it("reports through the combo box's own state, not a second one over the text", async () => {
      const {comboBox, input} = mount({
        defaultValue: "cat",
        validate: ({inputValue, value}) => (value === "cat" ? `${inputValue} is wrong` : undefined),
        validationBehavior: "aria",
      });

      await settle();

      // A text field validating the string would never see the key, and a combo box whose text and
      // key disagreed would then get two verdicts about one value.
      expect(comboBox.isInvalid.value).toBe(true);
      expect(comboBox.validation.value.validationErrors).toEqual(["Cat is wrong"]);
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});
