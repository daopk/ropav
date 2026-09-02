import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import { useColorPickerState } from "@/composables/use-color-picker-state";
import { parseColor } from "@/utils/color";

import { withScope } from "../harness/scope";

const hex = (state: { color: { value: { toString: (format: "hex") => string } } }) =>
  state.color.value.toString("hex");

describe("useColorPickerState", () => {
  describe("uncontrolled", () => {
    it("starts at black when nothing says otherwise", () => {
      const [state, dispose] = withScope(() => useColorPickerState());

      expect(hex(state)).toBe("#000000");

      dispose();
    });

    it("starts at the default colour", () => {
      const [state, dispose] = withScope(() => useColorPickerState({ defaultValue: "#ff0000" }));

      expect(hex(state)).toBe("#FF0000");

      dispose();
    });

    it("parses a default given as a string", () => {
      const [state, dispose] = withScope(() =>
        useColorPickerState({ defaultValue: "hsl(120, 100%, 50%)" }),
      );

      expect(hex(state)).toBe("#00FF00");

      dispose();
    });

    it("holds a new colour and reports it", () => {
      const onChange = vi.fn();
      const [state, dispose] = withScope(() => useColorPickerState({ onChange }));
      const blue = parseColor("#0000ff");

      state.setColor(blue);

      expect(hex(state)).toBe("#0000FF");
      expect(onChange).toHaveBeenCalledWith(blue);

      dispose();
    });
  });

  describe("controlled", () => {
    it("follows the colour it is given", () => {
      const value = shallowRef("#ff0000");
      const [state, dispose] = withScope(() => useColorPickerState({ value }));

      expect(hex(state)).toBe("#FF0000");

      value.value = "#00ff00";

      expect(hex(state)).toBe("#00FF00");

      dispose();
    });

    it("reports the next colour without moving on its own", () => {
      const onChange = vi.fn();
      const [state, dispose] = withScope(() => useColorPickerState({ onChange, value: "#ff0000" }));

      state.setColor(parseColor("#0000ff"));

      expect(onChange).toHaveBeenCalledWith(parseColor("#0000ff"));
      expect(hex(state)).toBe("#FF0000");

      dispose();
    });
  });

  describe("setColor(null)", () => {
    /*
     * Upstream behaviour, and load-bearing for a swatch picker: the selection layer can report
     * "nothing in the palette matched" while a colour outside the palette is held, and dropping
     * that back to black would silently discard it.
     */
    it("keeps the colour it already holds", () => {
      const onChange = vi.fn();
      const [state, dispose] = withScope(() =>
        useColorPickerState({ defaultValue: "#123456", onChange }),
      );

      state.setColor(null);

      expect(hex(state)).toBe("#123456");
      expect(onChange).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("sharing", () => {
    /* Why the composable exists: several editors pointed at one state stay in step. */
    it("shows one colour to every reader of the same state", () => {
      const [state, dispose] = withScope(() => useColorPickerState({ defaultValue: "#000000" }));
      const area = state.color;
      const slider = state.color;

      state.setColor(parseColor("#abcdef"));

      expect(area.value.toString("hex")).toBe("#ABCDEF");
      expect(slider.value.toString("hex")).toBe("#ABCDEF");

      dispose();
    });
  });
});
