import type {SelectFixtureItem, SelectStateHostProps} from "../fixtures/select.types";
import type {UseSelectStateReturn} from "@/composables/use-select-state";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/select-state-host.vue";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

const mount = (props: SelectStateHostProps = {}) => {
  let state!: UseSelectStateReturn<SelectFixtureItem>;

  const {unmount} = renderVapor(Host, {
    props: {...props, onReady: (next: UseSelectStateReturn<SelectFixtureItem>) => (state = next)},
  });

  cleanups.push(unmount);

  return state;
};

describe("useSelectState", () => {
  describe("collection", () => {
    it("knows every option from the data, with nothing rendered", () => {
      const state = mount();

      // Nothing rendered an option — which is the state a closed select is always in. A
      // registry built from the DOM would answer zero here.
      expect(state.collection.size.value).toBe(3);
      expect(state.collection.getFirstKey()).toBe("florida");
      expect(state.collection.getLastKey()).toBe("texas");
      expect(state.collection.getItem("texas")?.textValue()).toBe("Texas");
    });

    it("follows the data when it changes", async () => {
      const state = mount({items: [{id: "one", name: "One"}]});

      expect(state.collection.size.value).toBe(1);

      const state2 = mount({
        items: [
          {id: "one", name: "One"},
          {id: "two", name: "Two"},
        ],
      });

      await nextTick();

      expect(state2.collection.size.value).toBe(2);
    });

    it("marks an option the data calls disabled", () => {
      const state = mount({
        items: [
          {id: "one", name: "One"},
          {id: "two", isDisabled: true, name: "Two"},
        ],
      });

      expect(state.selection.isDisabled("two")).toBe(true);
      expect(state.selection.isDisabled("one")).toBe(false);
    });
  });

  describe("value", () => {
    it("starts on the default value", () => {
      const state = mount({defaultValue: "texas"});

      expect(state.value.value).toBe("texas");
      expect(state.selectedKey.value).toBe("texas");
      expect(state.selectedItems.value).toEqual([
        {key: "texas", textValue: "Texas", value: {id: "texas", name: "Texas"}},
      ]);
    });

    it("reports the datum behind the chosen key", () => {
      const state = mount({defaultValue: "california"});

      expect(state.selectedItems.value[0]?.value.name).toBe("California");
    });

    it("reports a controlled value without owning it", () => {
      const onChange = vi.fn();
      const state = mount({onChange, value: "florida"});

      expect(state.value.value).toBe("florida");

      state.setValue("texas");

      expect(onChange).toHaveBeenCalledWith("texas");
      // Controlled: the caller decides, so the state itself has not moved.
      expect(state.value.value).toBe("florida");
    });

    it("keeps only the first key when single mode is handed a list", () => {
      const state = mount({value: ["texas", "florida"]});

      expect(state.value.value).toBe("texas");
    });

    it("holds a list in multiple mode", () => {
      const state = mount({defaultValue: ["texas", "florida"], selectionMode: "multiple"});

      expect(state.value.value).toEqual(["texas", "florida"]);
      expect(state.selectedItems.value.map((item) => item.key)).toEqual(["texas", "florida"]);
    });

    it("defaults to nothing chosen, shaped by the mode", () => {
      expect(mount().value.value).toBeNull();
      expect(mount({selectionMode: "multiple"}).value.value).toEqual([]);
    });

    it("ignores a key the data does not know", () => {
      const state = mount({defaultValue: "nowhere"});

      expect(state.selectedItems.value).toEqual([]);
    });
  });

  describe("selecting", () => {
    it("writes the chosen key and closes, in single mode", () => {
      const onChange = vi.fn();
      const state = mount({defaultOpen: true, onChange});

      state.selection.replaceSelection("california");

      expect(onChange).toHaveBeenCalledWith("california");
      expect(state.isOpen.value).toBe(false);
    });

    it("stays open in multiple mode", () => {
      const onChange = vi.fn();
      const state = mount({defaultOpen: true, onChange, selectionMode: "multiple"});

      state.selection.toggleSelection("california");

      expect(onChange).toHaveBeenCalledWith(["california"]);
      expect(state.isOpen.value).toBe(true);
    });

    it("honours shouldCloseOnSelect against the mode's default", () => {
      const single = mount({defaultOpen: true, shouldCloseOnSelect: false});

      single.selection.replaceSelection("texas");
      expect(single.isOpen.value).toBe(true);

      const multiple = mount({
        defaultOpen: true,
        selectionMode: "multiple",
        shouldCloseOnSelect: true,
      });

      multiple.selection.toggleSelection("texas");
      expect(multiple.isOpen.value).toBe(false);
    });

    it("never lets go of the last choice in single mode", () => {
      const state = mount({defaultValue: "texas"});

      state.selection.toggleSelection("texas");

      expect(state.value.value).toBe("texas");
    });

    it("lets multiple mode empty out", () => {
      const state = mount({defaultValue: ["texas"], selectionMode: "multiple"});

      state.selection.toggleSelection("texas");

      expect(state.value.value).toEqual([]);
    });
  });

  describe("open state", () => {
    it("refuses to open on an empty collection", () => {
      const state = mount({items: []});

      state.open();
      expect(state.isOpen.value).toBe(false);

      state.toggle();
      expect(state.isOpen.value).toBe(false);

      state.setOpen(true);
      expect(state.isOpen.value).toBe(false);
    });

    it("opens an empty collection when told it may", () => {
      const state = mount({allowsEmptyCollection: true, items: []});

      state.open();

      expect(state.isOpen.value).toBe(true);
    });

    it("still closes an empty collection that is open", () => {
      const state = mount({allowsEmptyCollection: true, defaultOpen: true, items: []});

      state.toggle();

      expect(state.isOpen.value).toBe(false);
    });

    it("carries the focus strategy it was opened with", () => {
      const state = mount();

      state.open("last");

      expect(state.focusStrategy.value).toBe("last");
    });
  });

  describe("validation", () => {
    it("runs validate against the chosen value", () => {
      const state = mount({
        validate: (value) => (value === "texas" ? "Not Texas" : null),
        validationBehavior: "aria",
        value: "texas",
      });

      expect(state.displayValidation.value.isInvalid).toBe(true);
      expect(state.displayValidation.value.validationErrors).toEqual(["Not Texas"]);
    });

    it("treats an empty multiple selection as nothing chosen", () => {
      const validate = vi.fn(() => null);

      mount({selectionMode: "multiple", validate, validationBehavior: "aria"});

      // A value of `null` skips custom validation entirely, and an empty list means the same
      // thing as nothing chosen — so `validate` must not be asked about `[]`.
      expect(validate).not.toHaveBeenCalled();
    });

    it("reveals validation when an option is chosen", async () => {
      const state = mount({
        defaultOpen: true,
        validate: () => "Always wrong",
        validationBehavior: "native",
      });

      expect(state.displayValidation.value.isInvalid).toBe(false);

      state.selection.replaceSelection("texas");

      // The commit is queued a tick out, so the verdict read is the one the choice produced
      // rather than the one that was current while the popover was still open.
      await nextTick();

      expect(state.displayValidation.value.isInvalid).toBe(true);
    });
  });

  describe("focus", () => {
    it("tracks whether focus is inside", () => {
      const state = mount();

      expect(state.isFocused.value).toBe(false);

      state.setFocused(true);

      expect(state.isFocused.value).toBe(true);
    });
  });
});
