import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import { useToggleGroupState } from "@/composables/use-toggle-group-state";

import { withScope } from "../harness/scope";

const keysOf = (state: { selectedKeys: { value: Set<string | number> } }) => [
  ...state.selectedKeys.value,
];

describe("useToggleGroupState", () => {
  describe("defaults", () => {
    it("starts empty and single-select", () => {
      const [state, dispose] = withScope(() => useToggleGroupState());

      expect(keysOf(state)).toEqual([]);
      expect(state.selectionMode.value).toBe("single");
      expect(state.isDisabled.value).toBe(false);

      dispose();
    });

    it("starts at the default selected keys", () => {
      const [state, dispose] = withScope(() => useToggleGroupState({ defaultSelectedKeys: ["b"] }));

      expect(keysOf(state)).toEqual(["b"]);
      expect(state.isSelected("b")).toBe(true);
      expect(state.isSelected("a")).toBe(false);

      dispose();
    });
  });

  describe("single selection", () => {
    it("replaces the selection rather than adding to it", () => {
      const [state, dispose] = withScope(() => useToggleGroupState({ defaultSelectedKeys: ["a"] }));

      state.toggleKey("b");

      expect(keysOf(state)).toEqual(["b"]);

      dispose();
    });

    it("clears the selection when the selected key is pressed again", () => {
      const [state, dispose] = withScope(() => useToggleGroupState({ defaultSelectedKeys: ["a"] }));

      state.toggleKey("a");

      expect(keysOf(state)).toEqual([]);

      dispose();
    });

    /* What makes a single-select group behave like a radio group rather than one toggle. */
    it("keeps the selected key when emptiness is disallowed", () => {
      const [state, dispose] = withScope(() =>
        useToggleGroupState({ defaultSelectedKeys: ["a"], disallowEmptySelection: true }),
      );

      state.toggleKey("a");

      expect(keysOf(state)).toEqual(["a"]);

      dispose();
    });
  });

  describe("multiple selection", () => {
    it("adds and removes keys independently", () => {
      const [state, dispose] = withScope(() =>
        useToggleGroupState({ defaultSelectedKeys: ["a"], selectionMode: "multiple" }),
      );

      state.toggleKey("b");

      expect(keysOf(state)).toEqual(["a", "b"]);

      state.toggleKey("a");

      expect(keysOf(state)).toEqual(["b"]);

      dispose();
    });

    it("keeps the last remaining key when emptiness is disallowed", () => {
      const [state, dispose] = withScope(() =>
        useToggleGroupState({
          defaultSelectedKeys: ["a", "b"],
          disallowEmptySelection: true,
          selectionMode: "multiple",
        }),
      );

      state.toggleKey("a");

      expect(keysOf(state)).toEqual(["b"]);

      state.toggleKey("b");

      expect(keysOf(state)).toEqual(["b"]);

      dispose();
    });
  });

  describe("disabled", () => {
    /*
     * Guarded in the state rather than left to the `disabled` attribute, which only swallows a
     * press on a native button — not on an `aria-disabled` control, and not for a caller reaching
     * the state directly.
     */
    it("ignores a toggle", () => {
      const onSelectionChange = vi.fn();
      const [state, dispose] = withScope(() =>
        useToggleGroupState({ isDisabled: true, onSelectionChange }),
      );

      state.toggleKey("a");

      expect(keysOf(state)).toEqual([]);
      expect(onSelectionChange).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("controlled", () => {
    it("follows the keys it is given", () => {
      const selectedKeys = shallowRef<string[]>(["a"]);
      const [state, dispose] = withScope(() => useToggleGroupState({ selectedKeys }));

      expect(keysOf(state)).toEqual(["a"]);

      selectedKeys.value = ["b"];

      expect(keysOf(state)).toEqual(["b"]);

      dispose();
    });

    it("reports the next keys without moving on its own", () => {
      const onSelectionChange = vi.fn();
      const [state, dispose] = withScope(() =>
        useToggleGroupState({ onSelectionChange, selectedKeys: ["a"] }),
      );

      state.toggleKey("b");

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(["b"]));
      expect(keysOf(state)).toEqual(["a"]);

      dispose();
    });
  });

  describe("setSelected", () => {
    it("drives a key to an explicit state", () => {
      const [state, dispose] = withScope(() => useToggleGroupState({ selectionMode: "multiple" }));

      state.setSelected("a", true);

      expect(keysOf(state)).toEqual(["a"]);

      state.setSelected("a", false);

      expect(keysOf(state)).toEqual([]);

      dispose();
    });

    it("does nothing when the key already holds that state", () => {
      const onSelectionChange = vi.fn();
      const [state, dispose] = withScope(() =>
        useToggleGroupState({ defaultSelectedKeys: ["a"], onSelectionChange }),
      );

      state.setSelected("a", true);

      expect(onSelectionChange).not.toHaveBeenCalled();

      dispose();
    });
  });
});
