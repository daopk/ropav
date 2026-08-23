import type { UseSliderStateOptions } from "@/composables/use-slider-state";

import { describe, expect, it, vi } from "vitest";
import { effectScope, shallowRef } from "vue";

import { useSliderState } from "@/composables/use-slider-state";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const setup = (options: Partial<UseSliderStateOptions> = {}) =>
  withScope(() =>
    useSliderState({
      numberFormatter: new Intl.NumberFormat("en-US"),
      ...options,
    }),
  );

describe("useSliderState", () => {
  describe("values", () => {
    it("starts at the minimum when nothing is given", () => {
      const [state, dispose] = setup();

      expect(state.values.value).toEqual([0]);
      expect(state.step.value).toBe(1);
      expect(state.orientation.value).toBe("horizontal");

      dispose();
    });

    it("takes a single default value", () => {
      const [state, dispose] = setup({ defaultValue: 30 });

      expect(state.values.value).toEqual([30]);
      expect(state.getThumbValue(0)).toBe(30);

      dispose();
    });

    it("snaps a value that does not sit on a step", () => {
      const [state, dispose] = setup({ defaultValue: 33, step: 10 });

      expect(state.values.value).toEqual([30]);

      dispose();
    });

    it("follows a controlled value", () => {
      const value = shallowRef(20);
      const [state, dispose] = setup({ value: () => value.value });

      expect(state.values.value).toEqual([20]);

      value.value = 80;

      expect(state.values.value).toEqual([80]);

      dispose();
    });

    it("leaves a controlled value to its owner", () => {
      const onChange = vi.fn();
      const [state, dispose] = setup({ onChange, value: 20 });

      state.setThumbValue(0, 50);

      expect(onChange).toHaveBeenCalledWith(50);
      expect(state.values.value).toEqual([20]);

      dispose();
    });

    it("hands the value back in the shape it came in", () => {
      const onChange = vi.fn();
      const [single, disposeSingle] = setup({ defaultValue: 10, onChange });

      single.setThumbValue(0, 20);
      expect(onChange).toHaveBeenLastCalledWith(20);
      disposeSingle();

      const onRangeChange = vi.fn();
      const [range, disposeRange] = setup({
        defaultValue: [10, 90],
        onChange: onRangeChange,
      });

      range.setThumbValue(0, 20);
      expect(onRangeChange).toHaveBeenLastCalledWith([20, 90]);
      disposeRange();
    });
  });

  describe("thumb bounds", () => {
    it("pens each thumb in between its neighbours", () => {
      const [state, dispose] = setup({ defaultValue: [20, 60] });

      expect(state.getThumbMinValue(0)).toBe(0);
      expect(state.getThumbMaxValue(0)).toBe(60);
      expect(state.getThumbMinValue(1)).toBe(20);
      expect(state.getThumbMaxValue(1)).toBe(100);

      // Dragging the low thumb past the high one stops it at the high one.
      state.setThumbValue(0, 90);
      expect(state.values.value).toEqual([60, 60]);

      dispose();
    });

    it("restricts a default range that overlaps", () => {
      const [state, dispose] = setup({ defaultValue: [80, 20] });

      // Each value is snapped against the one before it, so the pair comes out ordered.
      expect(state.values.value[0]).toBeLessThanOrEqual(state.values.value[1]!);

      dispose();
    });
  });

  describe("percentages", () => {
    it("maps values onto the track", () => {
      const [state, dispose] = setup({ defaultValue: 25, maxValue: 200, minValue: 0 });

      expect(state.getValuePercent(50)).toBe(0.25);
      expect(state.getThumbPercent(0)).toBe(0.125);

      dispose();
    });

    it("maps a position on the track back onto a step", () => {
      const [state, dispose] = setup({ maxValue: 100, minValue: 0, step: 25 });

      expect(state.getPercentValue(0.3)).toBe(25);
      expect(state.getPercentValue(0.4)).toBe(50);
      // Past either end it stops at the end.
      expect(state.getPercentValue(1.5)).toBe(100);
      expect(state.getPercentValue(-1)).toBe(0);

      dispose();
    });

    it("sets a thumb from a position on the track", () => {
      const [state, dispose] = setup({ defaultValue: 0, step: 10 });

      state.setThumbPercent(0, 0.44);

      expect(state.values.value).toEqual([40]);

      dispose();
    });
  });

  describe("stepping", () => {
    it("steps by the step size", () => {
      const [state, dispose] = setup({ defaultValue: 50, step: 5 });

      state.incrementThumb(0);
      expect(state.values.value).toEqual([55]);

      state.decrementThumb(0);
      expect(state.values.value).toEqual([50]);

      dispose();
    });

    it("steps by a page when asked", () => {
      const [state, dispose] = setup({ defaultValue: 50 });

      // A page is a tenth of the range, so ten pages cross the whole slider.
      expect(state.pageSize.value).toBe(10);

      state.incrementThumb(0, state.pageSize.value);
      expect(state.values.value).toEqual([60]);

      dispose();
    });

    it("keeps the page size a whole number of steps, never below one step", () => {
      const [coarse, disposeCoarse] = setup({ maxValue: 10, minValue: 0, step: 3 });

      // A tenth of the range is smaller than one step here.
      expect(coarse.pageSize.value).toBe(3);
      disposeCoarse();

      const [wide, disposeWide] = setup({ maxValue: 1000, minValue: 0, step: 50 });

      expect(wide.pageSize.value).toBe(100);
      disposeWide();
    });

    it("stops at either end", () => {
      const [state, dispose] = setup({ defaultValue: 100 });

      state.incrementThumb(0, 50);
      expect(state.values.value).toEqual([100]);

      state.setThumbValue(0, 0);
      state.decrementThumb(0, 50);
      expect(state.values.value).toEqual([0]);

      dispose();
    });
  });

  describe("dragging", () => {
    it("reports the end of an interaction once", () => {
      const onChangeEnd = vi.fn();
      const [state, dispose] = setup({ defaultValue: [10, 90], onChangeEnd });

      state.setThumbDragging(0, true);
      state.setThumbDragging(1, true);
      expect(state.isThumbDragging(0)).toBe(true);

      state.setThumbDragging(0, false);
      // One thumb is still down, so the interaction is not over.
      expect(onChangeEnd).not.toHaveBeenCalled();

      state.setThumbDragging(1, false);
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenCalledWith([10, 90]);

      dispose();
    });

    it("says nothing when a thumb that was not dragging is released", () => {
      const onChangeEnd = vi.fn();
      const [state, dispose] = setup({ defaultValue: 10, onChangeEnd });

      state.setThumbDragging(0, false);

      expect(onChangeEnd).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("editability", () => {
    it("ignores writes to a thumb that is not editable", () => {
      const [state, dispose] = setup({ defaultValue: 10 });

      state.setThumbEditable(0, false);
      state.setThumbValue(0, 50);

      expect(state.values.value).toEqual([10]);
      expect(state.isThumbEditable(0)).toBe(false);

      dispose();
    });

    it("ignores every write while disabled", () => {
      const [state, dispose] = setup({ defaultValue: 10, isDisabled: true });

      state.setThumbValue(0, 50);
      state.incrementThumb(0);

      expect(state.values.value).toEqual([10]);
      expect(state.isDisabled.value).toBe(true);

      dispose();
    });
  });

  describe("formatting", () => {
    it("formats a single value", () => {
      const [state, dispose] = setup({
        defaultValue: 30,
        numberFormatter: new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }),
      });

      expect(state.getThumbValueLabel(0)).toBe("$30.00");

      dispose();
    });

    it("formats two values as a range", () => {
      const [state, dispose] = setup({ defaultValue: [100, 500], maxValue: 1000 });

      expect(state.getFormattedValue()).toBe("100–500");

      dispose();
    });

    it("formats three or more values as a list", () => {
      const [state, dispose] = setup({ defaultValue: [10, 20, 30] });

      expect(state.getFormattedValue()).toBe("10, 20, 30");

      dispose();
    });

    it("formats an explicit value", () => {
      const [state, dispose] = setup({ defaultValue: 30 });

      expect(state.getFormattedValue(1000)).toBe("1,000");

      dispose();
    });
  });

  describe("focus", () => {
    it("tracks the thumb that holds focus", () => {
      const [state, dispose] = setup({ defaultValue: [10, 90] });

      expect(state.focusedThumb.value).toBeUndefined();

      state.setFocusedThumb(1);
      expect(state.focusedThumb.value).toBe(1);

      state.setFocusedThumb(undefined);
      expect(state.focusedThumb.value).toBeUndefined();

      dispose();
    });
  });

  describe("form reset", () => {
    it("remembers the caller default", () => {
      const [state, dispose] = setup({ defaultValue: [10, 90] });

      state.setThumbValue(0, 50);

      expect(state.defaultValues.value).toEqual([10, 90]);

      dispose();
    });

    it("falls back to where the slider started", () => {
      const [state, dispose] = setup({ minValue: 5 });

      state.setThumbValue(0, 50);

      expect(state.defaultValues.value).toEqual([5]);

      dispose();
    });
  });
});
