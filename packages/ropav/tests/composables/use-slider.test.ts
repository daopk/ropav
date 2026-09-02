import type { SliderState } from "@/composables/use-slider-state";

import { describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";

import { useSlider } from "@/composables/use-slider";
import { useSliderState } from "@/composables/use-slider-state";

import { withScope } from "../harness/scope";

/**
 * jsdom lays nothing out, so the track is given a size by hand — the composable reads it to
 * turn a position into a value, and everything it does depends on that number.
 */
const TRACK = { height: 20, left: 100, top: 50, width: 200 };

const setup = (
  options: {
    defaultValue?: number | number[];
    isDisabled?: boolean;
    labelId?: string;
    orientation?: "horizontal" | "vertical";
    step?: number;
  } = {},
) => {
  const track = document.createElement("div");

  document.body.appendChild(track);
  track.getBoundingClientRect = () =>
    ({
      bottom: TRACK.top + TRACK.height,
      height: TRACK.height,
      left: TRACK.left,
      right: TRACK.left + TRACK.width,
      top: TRACK.top,
      width: TRACK.width,
      x: TRACK.left,
      y: TRACK.top,
    }) as DOMRect;

  const trackEl = shallowRef<HTMLElement | null>(track);
  let state!: SliderState;

  const [slider, dispose] = withScope(() => {
    state = useSliderState({
      defaultValue: options.defaultValue ?? 0,
      isDisabled: options.isDisabled,
      numberFormatter: new Intl.NumberFormat("en-US"),
      orientation: options.orientation,
      step: options.step,
    });

    return useSlider({
      ariaLabel: "Volume",
      id: "slider",
      labelId: options.labelId,
      state,
      trackEl,
    });
  });

  track.addEventListener("pointerdown", (event) =>
    slider.trackHandlers.onPointerdown(event as PointerEvent),
  );

  return {
    dispose: () => {
      dispose();
      track.remove();
    },
    slider,
    state,
    track,
  };
};

const pressTrack = (track: HTMLElement, x: number, y: number, pointerId = 1) =>
  track.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId,
      pointerType: "mouse",
    }),
  );

const dragTo = (x: number, y: number, pointerId = 1) =>
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, pointerId }));

const release = (pointerId = 1) =>
  window.dispatchEvent(new PointerEvent("pointerup", { pointerId }));

describe("useSlider", () => {
  describe("labelling", () => {
    it("groups the thumbs and names them by the visible label", () => {
      const { dispose, slider } = setup({ labelId: "volume-label" });

      expect(slider.groupProps.value.role).toBe("group");
      expect(slider.groupProps.value["aria-labelledby"]).toBe("volume-label");
      // Each thumb points at the label as well, so it is announced with its own name.
      expect(slider.labelledBy.value).toBe("volume-label");

      dispose();
    });

    it("falls back to the group itself when there is no visible label", () => {
      const { dispose, slider } = setup();

      expect(slider.groupProps.value["aria-labelledby"]).toBeUndefined();
      expect(slider.groupProps.value["aria-label"]).toBe("Volume");
      // With no label element, the group is what carries the name, so the thumbs point there.
      expect(slider.labelledBy.value).toBe("slider");

      dispose();
    });

    it("points the output at every thumb", () => {
      const { dispose, slider } = setup({ defaultValue: [10, 90] });

      expect(slider.outputProps.value.for).toBe("slider-0 slider-1");
      expect(slider.outputProps.value["aria-live"]).toBe("off");
      expect(slider.getThumbId(1)).toBe("slider-1");

      dispose();
    });
  });

  describe("pressing the track", () => {
    it("moves the only thumb to where the track was pressed", () => {
      const { dispose, state, track } = setup({ step: 10 });

      // Half way along a 200px track that starts at x=100.
      pressTrack(track, TRACK.left + 100, TRACK.top);

      expect(state.values.value).toEqual([50]);
      expect(state.isThumbDragging(0)).toBe(true);
      expect(state.focusedThumb.value).toBe(0);

      dispose();
    });

    it("moves the nearest thumb of a range", () => {
      const { dispose, state, track } = setup({ defaultValue: [20, 80], step: 10 });

      pressTrack(track, TRACK.left + 60, TRACK.top);

      // 30 is nearer 20 than 80, so the low thumb is the one that moves.
      expect(state.values.value).toEqual([30, 80]);
      expect(state.isThumbDragging(0)).toBe(true);
      expect(state.isThumbDragging(1)).toBe(false);

      dispose();
    });

    it("picks the higher thumb when the press is past both", () => {
      const { dispose, state, track } = setup({ defaultValue: [20, 40], step: 10 });

      pressTrack(track, TRACK.left + 180, TRACK.top);

      expect(state.values.value).toEqual([20, 90]);

      dispose();
    });

    it("counts a vertical track from the bottom up", () => {
      const { dispose, state, track } = setup({ orientation: "vertical", step: 10 });

      // A quarter of the way down a 20px tall track is three quarters of the value.
      pressTrack(track, TRACK.left, TRACK.top + 5);

      expect(state.values.value).toEqual([80]);

      dispose();
    });

    it("keeps focus where it is", () => {
      const { dispose, track } = setup();
      const event = new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX: TRACK.left + 100,
        clientY: TRACK.top,
        pointerId: 1,
        pointerType: "mouse",
      });

      track.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);

      dispose();
    });

    it("ignores a press while disabled", () => {
      const { dispose, state, track } = setup({ defaultValue: 10, isDisabled: true });

      pressTrack(track, TRACK.left + 100, TRACK.top);

      expect(state.values.value).toEqual([10]);
      expect(state.isThumbDragging(0)).toBe(false);

      dispose();
    });

    it("ignores a right click and a modified click", () => {
      const { dispose, state, track } = setup({ defaultValue: 10 });

      track.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 2,
          clientX: TRACK.left + 100,
          pointerId: 2,
          pointerType: "mouse",
        }),
      );
      track.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: TRACK.left + 100,
          metaKey: true,
          pointerId: 3,
          pointerType: "mouse",
        }),
      );

      expect(state.values.value).toEqual([10]);

      dispose();
    });

    it("ignores a press on a thumb that cannot be edited", () => {
      const { dispose, state, track } = setup({ defaultValue: 10 });

      state.setThumbEditable(0, false);
      pressTrack(track, TRACK.left + 100, TRACK.top);

      expect(state.values.value).toEqual([10]);

      dispose();
    });
  });

  describe("dragging the track", () => {
    it("keeps moving the thumb the press picked", () => {
      const { dispose, state, track } = setup({ step: 10 });

      pressTrack(track, TRACK.left, TRACK.top);
      expect(state.values.value).toEqual([0]);

      // 40px along a 200px track is a fifth of the range.
      dragTo(TRACK.left + 40, TRACK.top);
      expect(state.values.value).toEqual([20]);

      dragTo(TRACK.left + 80, TRACK.top);
      expect(state.values.value).toEqual([40]);

      dispose();
    });

    it("stops at either end of the track", () => {
      const { dispose, state, track } = setup({ step: 10 });

      pressTrack(track, TRACK.left + 100, TRACK.top);
      dragTo(TRACK.left + 1000, TRACK.top);

      expect(state.values.value).toEqual([100]);

      dragTo(TRACK.left - 1000, TRACK.top);
      expect(state.values.value).toEqual([0]);

      dispose();
    });

    it("reports the end of the interaction once the pointer is released", () => {
      const onChangeEnd = vi.fn();
      const track = document.createElement("div");

      document.body.appendChild(track);

      const trackEl = shallowRef<HTMLElement | null>(track);
      let state!: SliderState;

      const [slider, dispose] = withScope(() => {
        state = useSliderState({
          defaultValue: 0,
          numberFormatter: new Intl.NumberFormat("en-US"),
          onChangeEnd,
          step: 10,
        });

        return useSlider({ id: "slider", state, trackEl });
      });

      track.getBoundingClientRect = () => ({ height: 20, left: 0, top: 0, width: 200 }) as DOMRect;
      track.addEventListener("pointerdown", (event) =>
        slider.trackHandlers.onPointerdown(event as PointerEvent),
      );

      pressTrack(track, 100, 0);
      expect(state.isThumbDragging(0)).toBe(true);

      release();

      expect(state.isThumbDragging(0)).toBe(false);
      expect(onChangeEnd).toHaveBeenCalledWith(50);

      dispose();
      track.remove();
    });

    it("ends a press that never moved", () => {
      const { dispose, state, track } = setup({ step: 10 });

      pressTrack(track, TRACK.left + 100, TRACK.top);
      release();

      expect(state.isThumbDragging(0)).toBe(false);

      dispose();
    });
  });
});
