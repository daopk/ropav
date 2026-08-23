import type {ComboBoxFixtureItem, ComboBoxStateHostProps} from "../fixtures/combo-box.types";
import type {UseComboBoxStateReturn} from "@/composables/use-combo-box-state";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/combo-box-state-host.vue";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const mount = (props: ComboBoxStateHostProps = {}) => {
  let state!: UseComboBoxStateReturn<ComboBoxFixtureItem>;

  const {unmount} = renderVapor(Host, {
    props: {
      ...props,
      onReady: (next: UseComboBoxStateReturn<ComboBoxFixtureItem>) => (state = next),
    },
  });

  cleanups.push(unmount);

  return state;
};

/** The sync watcher runs at post-flush, so every write has to be given a tick to settle. */
const settle = async () => {
  await nextTick();
  await nextTick();
};

/** Typing, which is a value write plus the focus the field would have had. */
const type = async (state: UseComboBoxStateReturn<ComboBoxFixtureItem>, text: string) => {
  state.setInputValue(text);
  await settle();
};

describe("useComboBoxState", () => {
  describe("the collection", () => {
    it("knows every option from the data, with nothing rendered", () => {
      const state = mount();

      expect(state.collection.size.value).toBe(3);
      expect(state.collection.getFirstKey()).toBe("cat");
      expect(state.collection.getItem("panda")?.textValue()).toBe("Panda");
    });

    it("narrows to what the text matches", async () => {
      const state = mount();

      await type(state, "pa");

      expect(state.collection.orderedKeys()).toEqual(["panda"]);
    });

    it("matches without regard to case or accent", async () => {
      const state = mount({
        items: [
          {id: "cafe", name: "Café"},
          {id: "dog", name: "Dog"},
        ],
      });

      await type(state, "CAFE");

      expect(state.collection.orderedKeys()).toEqual(["cafe"]);
    });

    it("leaves the options alone when the caller narrows them", async () => {
      // `null` is the seam an asynchronous search needs: the caller has already filtered, so
      // filtering again over stale text would hide the results it just fetched.
      const state = mount({defaultFilter: null});

      await type(state, "nothing matches this");

      expect(state.collection.orderedKeys()).toEqual(["cat", "dog", "panda"]);
    });

    it("takes a filter of the caller's own", async () => {
      const state = mount({defaultFilter: (text, input) => text.endsWith(input)});

      await type(state, "og");

      expect(state.collection.orderedKeys()).toEqual(["dog"]);
    });
  });

  describe("opening", () => {
    it("opens on the first keystroke", async () => {
      const onOpenChange = vi.fn();
      const state = mount({onOpenChange});

      state.setFocused(true);
      await type(state, "d");

      expect(state.isOpen.value).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true, "input");
    });

    it("stays shut while typing when the caller asked for manual only", async () => {
      const state = mount({menuTrigger: "manual"});

      state.setFocused(true);
      await type(state, "d");

      expect(state.isOpen.value).toBe(false);
    });

    it("opens on focus when the caller asked it to", () => {
      const onOpenChange = vi.fn();
      const state = mount({menuTrigger: "focus", onOpenChange});

      state.setFocused(true);

      expect(state.isOpen.value).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true, "focus");
    });

    it("does not open on focus for a read-only field", () => {
      const state = mount({isReadOnly: true, menuTrigger: "focus"});

      state.setFocused(true);

      expect(state.isOpen.value).toBe(false);
    });

    it("refuses to open with nothing to show", async () => {
      const state = mount();

      state.setFocused(true);
      await type(state, "zzz");

      expect(state.collection.size.value).toBe(0);
      expect(state.isOpen.value).toBe(false);
    });

    it("does not open on focus with no options at all", () => {
      const state = mount({items: [], menuTrigger: "focus"});

      state.setFocused(true);

      expect(state.isOpen.value).toBe(false);
    });

    it("does not open by hand with no options at all", async () => {
      const state = mount({items: []});

      state.toggle(null, "manual");
      await settle();

      // Pressing the button means "show me every option", and there are none to show.
      expect(state.isOpen.value).toBe(false);
    });

    it("opens on nothing when the caller allows an empty collection", async () => {
      const state = mount({allowsEmptyCollection: true});

      state.setFocused(true);
      await type(state, "zzz");

      expect(state.isOpen.value).toBe(true);
    });

    it("closes itself once the text matches nothing", async () => {
      const state = mount();

      state.setFocused(true);
      await type(state, "d");
      expect(state.isOpen.value).toBe(true);

      await type(state, "dzz");

      expect(state.isOpen.value).toBe(false);
    });

    it("shows every option when opened by hand, whatever the text says", async () => {
      const state = mount();

      state.setFocused(true);
      await type(state, "pa");
      expect(state.collection.size.value).toBe(1);

      // The first press closes what typing opened; the second is the one that opens by hand.
      state.toggle(null, "manual");
      await settle();
      state.toggle(null, "manual");
      await settle();

      // The button means "show me the list", not "show me the matches" — which is the whole
      // difference between `showAllItems` and the filtered collection.
      expect(state.isOpen.value).toBe(true);
      expect(state.collection.orderedKeys()).toEqual(["cat", "dog", "panda"]);
    });

    it("keeps the reason and the focus strategy of whatever opened it", async () => {
      const onOpenChange = vi.fn();
      const state = mount({menuTrigger: "focus", onOpenChange});

      state.toggle("first", "manual");
      await settle();
      /*
       * Focus arriving on an already-open field has nothing left to open. Reaching for it again
       * would rewrite both answers with a later, weaker cause — the strategy back to `null`, so the
       * option the keyboard asked to land on is lost. React never meets this: both writes are
       * deferred there, so only one of them ever sees a shut popover.
       */
      state.setFocused(true);
      await settle();

      expect(state.focusStrategy.value).toBe("first");
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true, "manual");
    });

    it("drops back to the matches as soon as anything is typed again", async () => {
      const state = mount();

      state.toggle(null, "manual");
      await settle();
      expect(state.collection.size.value).toBe(3);

      await type(state, "pa");

      expect(state.collection.orderedKeys()).toEqual(["panda"]);
    });

    it("freezes the options while it closes", async () => {
      const state = mount({defaultValue: "cat"});

      state.setFocused(true);
      await type(state, "pa");
      expect(state.collection.orderedKeys()).toEqual(["panda"]);

      state.setFocused(false);
      await settle();

      /*
       * Leaving settles the text back to "Cat", which re-runs the filter over an entirely
       * different word. Without the frozen copy the one option on screen would swap itself for
       * another one as the popover fades — so this asserts the *stale* list on purpose.
       */
      expect(state.isOpen.value).toBe(false);
      expect(state.inputValue.value).toBe("Cat");
      expect(state.collection.orderedKeys()).toEqual(["panda"]);
    });
  });

  describe("the text and the value together", () => {
    it("starts with the chosen option's own text", () => {
      const state = mount({defaultValue: "cat"});

      expect(state.inputValue.value).toBe("Cat");
      expect(state.defaultInputValue.value).toBe("Cat");
    });

    it("prefers text the caller gave over the chosen option's", () => {
      const state = mount({defaultInputValue: "typed", defaultValue: "cat"});

      expect(state.inputValue.value).toBe("typed");
    });

    it("writes the chosen option's text into the field", async () => {
      const state = mount();

      state.setFocused(true);
      await type(state, "pa");
      state.selection.select("panda");
      await settle();

      expect(state.value.value).toBe("panda");
      expect(state.inputValue.value).toBe("Panda");
    });

    it("lets go of the value when the field is emptied", async () => {
      const onChange = vi.fn();
      const state = mount({defaultValue: "cat", onChange});

      await type(state, "");

      expect(state.value.value).toBeNull();
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("keeps the value while the text is narrowed past the option it names", async () => {
      const state = mount({defaultValue: "cat"});

      await type(state, "Ca");

      expect(state.value.value).toBe("cat");
    });

    it("picks up the chosen option's text once the options arrive", async () => {
      const state = mount({defaultValue: "cat", items: []});

      expect(state.inputValue.value).toBe("");

      const late = mount({defaultValue: "cat", items: [{id: "cat", name: "Cat"}]});

      await settle();

      // An asynchronous list is the ordinary case for a combo box, and a field left blank over a
      // value it holds is the bug this guards.
      expect(late.inputValue.value).toBe("Cat");
      expect(state.inputValue.value).toBe("");
    });
  });

  describe("committing and reverting", () => {
    it("chooses whatever the arrows have landed on", async () => {
      const onChange = vi.fn();
      const state = mount({onChange});

      state.toggle(null, "manual");
      await settle();
      state.selection.setFocusedKey("dog");

      state.commit();
      await settle();

      expect(state.value.value).toBe("dog");
      expect(state.inputValue.value).toBe("Dog");
      expect(state.isOpen.value).toBe(false);
      expect(onChange).toHaveBeenCalledWith("dog");
    });

    it("settles the text back when the arrows have landed nowhere", async () => {
      const state = mount({defaultValue: "cat"});

      state.toggle(null, "manual");
      await settle();
      await type(state, "Ca");

      state.commit();
      await settle();

      expect(state.inputValue.value).toBe("Cat");
      expect(state.isOpen.value).toBe(false);
    });

    it("keeps text matching no option when custom values are allowed", async () => {
      const state = mount({allowsCustomValue: true});

      state.setFocused(true);
      await type(state, "Aardvark");

      state.commit();
      await settle();

      expect(state.inputValue.value).toBe("Aardvark");
      expect(state.value.value).toBeNull();
    });

    it("throws text matching no option away when they are not", async () => {
      const state = mount();

      state.setFocused(true);
      await type(state, "Ca");

      state.commit();
      await settle();

      // Nothing was ever chosen, so there is no text to go back to.
      expect(state.inputValue.value).toBe("");
    });

    it("puts the text back to the chosen option on revert", async () => {
      const state = mount({defaultValue: "dog"});

      state.setFocused(true);
      await type(state, "Do something else");

      state.revert();
      await settle();

      expect(state.inputValue.value).toBe("Dog");
      expect(state.value.value).toBe("dog");
      expect(state.isOpen.value).toBe(false);
    });

    it("settles the field when focus leaves", async () => {
      const state = mount({defaultValue: "cat"});

      state.setFocused(true);
      await type(state, "Ca");
      state.setFocused(false);
      await settle();

      expect(state.inputValue.value).toBe("Cat");
      expect(state.isOpen.value).toBe(false);
    });

    it("leaves the field alone on blur when the caller turned that off", async () => {
      const state = mount({defaultValue: "cat", shouldCloseOnBlur: false});

      state.setFocused(true);
      await type(state, "Ca");
      state.setFocused(false);
      await settle();

      expect(state.inputValue.value).toBe("Ca");
    });

    it("closes and settles when the option already chosen is pressed again", async () => {
      const onChange = vi.fn();
      const state = mount({defaultValue: "cat", onChange});

      state.toggle(null, "manual");
      await settle();
      await type(state, "Ca");

      state.selection.select("cat");
      await settle();

      expect(onChange).toHaveBeenCalledWith("cat");
      expect(state.inputValue.value).toBe("Cat");
      expect(state.isOpen.value).toBe(false);
    });
  });

  describe("several options at once", () => {
    it("adds to the selection rather than replacing it", async () => {
      const state = mount({defaultValue: ["cat"], selectionMode: "multiple"});

      state.toggle(null, "manual");
      await settle();
      state.selection.select("dog");
      await settle();

      expect(state.value.value).toEqual(["cat", "dog"]);
    });

    it("keeps the popover open while more are chosen", async () => {
      const state = mount({selectionMode: "multiple"});

      state.toggle(null, "manual");
      await settle();
      state.selection.select("dog");
      await settle();

      expect(state.isOpen.value).toBe(true);
    });

    it("empties the search once an option is taken from it", async () => {
      const state = mount({selectionMode: "multiple"});

      state.setFocused(true);
      await type(state, "do");
      state.selection.select("dog");
      await settle();

      // There is no single name to write back here, so the field goes blank rather than to a
      // value — which is what makes the next option searchable without clearing by hand. What
      // was chosen shows beside the field instead.
      expect(state.inputValue.value).toBe("");
      expect(state.value.value).toEqual(["dog"]);
    });

    it("keeps what is chosen when the field is closed with a search still in it", async () => {
      const state = mount({allowsCustomValue: true, selectionMode: "multiple"});

      state.toggle(null, "manual");
      await settle();
      state.selection.select("dog");
      await settle();
      await type(state, "leftover");

      state.setFocused(false);
      await settle();

      // Custom values in single mode mean "the text is the value", so closing over unmatched text
      // clears the key. In multiple mode the text is a search, and clearing what was chosen
      // because a search was left behind would throw away the answer.
      expect(state.value.value).toEqual(["dog"]);
    });
  });

  describe("validation", () => {
    it("hands the text and the value to a custom rule together", async () => {
      const validate = vi.fn(() => undefined);
      const state = mount({defaultValue: "cat", validate, validationBehavior: "aria"});

      await settle();

      expect(state.displayValidation.value.isInvalid).toBe(false);
      expect(validate).toHaveBeenCalledWith({inputValue: "Cat", value: "cat"});
    });

    it("reports what a custom rule rejects", async () => {
      const state = mount({
        defaultValue: "cat",
        validate: () => "Pick something else",
        validationBehavior: "aria",
      });

      await settle();

      expect(state.displayValidation.value.isInvalid).toBe(true);
      expect(state.displayValidation.value.validationErrors).toEqual(["Pick something else"]);
    });

    it("skips a custom rule when nothing is chosen at all", async () => {
      const validate = vi.fn(() => "never");
      const state = mount({selectionMode: "multiple", validate, validationBehavior: "aria"});

      await settle();

      expect(validate).not.toHaveBeenCalled();
      expect(state.displayValidation.value.isInvalid).toBe(false);
    });

    it("reveals validation when focus leaves after a change", async () => {
      const state = mount({validate: () => "Required", validationBehavior: "native"});

      state.setFocused(true);
      await type(state, "Ca");
      state.setFocused(false);
      await settle();

      expect(state.displayValidation.value.isInvalid).toBe(true);
    });

    it("says nothing when focus leaves and nothing changed", async () => {
      const state = mount({validate: () => "Required", validationBehavior: "native"});

      state.setFocused(true);
      state.setFocused(false);
      await settle();

      expect(state.displayValidation.value.isInvalid).toBe(false);
    });
  });

  describe("a controlled combo box", () => {
    it("never writes its own value", async () => {
      const onChange = vi.fn();
      const state = mount({onChange, value: "cat"});

      state.toggle(null, "manual");
      await settle();
      state.selection.select("dog");
      await settle();

      expect(onChange).toHaveBeenCalledWith("dog");
      expect(state.value.value).toBe("cat");
    });

    it("never writes its own text", async () => {
      const onInputChange = vi.fn();
      const state = mount({inputValue: "held", onInputChange});

      await type(state, "typed");

      expect(onInputChange).toHaveBeenCalledWith("typed");
      expect(state.inputValue.value).toBe("held");
    });

    it("leaves both halves to the caller when both are controlled", async () => {
      const onChange = vi.fn();
      const state = mount({inputValue: "Ca", onChange, value: "cat"});

      state.setFocused(true);
      state.setFocused(false);
      await settle();

      // Neither half can be written here, so the only thing left is to say the two disagree.
      expect(onChange).toHaveBeenCalledWith("cat");
      expect(state.inputValue.value).toBe("Ca");
    });
  });
});
