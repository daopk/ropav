import type {SliderState} from "@/composables/use-slider-state";

import {describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useSliderState} from "@/composables/use-slider-state";
import {useSliderThumb} from "@/composables/use-slider-thumb";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

/** jsdom lays nothing out, so the track is given a size by hand. */
const TRACK = {height: 20, left: 0, top: 0, width: 200};

const setup = (
  options: {
    defaultValue?: number | number[];
    index?: number;
    isDisabled?: boolean;
    isThumbDisabled?: boolean;
    /** Renders the slider inside a form, so a reset can reach the input. */
    withForm?: boolean;
    onChangeEnd?: (value: number | number[]) => void;
    orientation?: "horizontal" | "vertical";
    step?: number;
  } = {},
) => {
  const track = document.createElement("div");
  const thumb = document.createElement("div");
  const input = document.createElement("input");

  track.getBoundingClientRect = () =>
    ({
      bottom: TRACK.top + TRACK.height,
      height: TRACK.height,
      left: TRACK.left,
      right: TRACK.left + TRACK.width,
      top: TRACK.top,
      width: TRACK.width,
    }) as DOMRect;
  thumb.appendChild(input);
  track.appendChild(thumb);

  // The form has to own the input before the composable runs: a form is found through the
  // input's own tree, which is settled by the time the element exists.
  const form = options.withForm ? document.createElement("form") : null;

  if (form) {
    form.appendChild(track);
    document.body.appendChild(form);
  } else {
    document.body.appendChild(track);
  }

  const trackEl = shallowRef<HTMLElement | null>(track);
  const inputEl = shallowRef<HTMLInputElement | null>(input);
  let state!: SliderState;

  const [result, dispose] = withScope(() => {
    state = useSliderState({
      defaultValue: options.defaultValue ?? 50,
      isDisabled: options.isDisabled,
      numberFormatter: new Intl.NumberFormat("en-US"),
      onChangeEnd: options.onChangeEnd,
      orientation: options.orientation,
      step: options.step,
    });

    return useSliderThumb({
      id: "slider-0",
      index: options.index,
      inputEl,
      isDisabled: options.isThumbDisabled,
      labelledBy: "slider-label",
      state,
      trackEl,
    });
  });

  input.type = "range";
  input.value = String(state.getThumbValue(options.index ?? 0));
  thumb.addEventListener("keydown", (event) => result.thumbHandlers.onKeydown(event));
  thumb.addEventListener("pointerdown", (event) =>
    result.thumbHandlers.onPointerdown(event as PointerEvent),
  );
  input.addEventListener("change", (event) => result.inputHandlers.onChange(event));
  input.addEventListener("focus", () => result.inputHandlers.onFocus());
  input.addEventListener("blur", () => result.inputHandlers.onBlur());

  return {
    dispose: () => {
      dispose();
      track.remove();
      form?.remove();
    },
    form,
    input,
    state,
    thumb,
    thumbState: result,
  };
};

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: keyName,
    ...init,
  });

  element.dispatchEvent(event);

  return event;
};

const pressThumb = (thumb: HTMLElement, pointerId = 1) =>
  thumb.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId,
      pointerType: "mouse",
    }),
  );

const dragTo = (x: number, y: number, pointerId = 1) =>
  window.dispatchEvent(new PointerEvent("pointermove", {clientX: x, clientY: y, pointerId}));

const release = (pointerId = 1) => window.dispatchEvent(new PointerEvent("pointerup", {pointerId}));

describe("useSliderThumb", () => {
  describe("input", () => {
    it("describes the value as a range input", () => {
      const {dispose, thumbState} = setup({defaultValue: 30, step: 5});
      const props = thumbState.inputProps.value;

      expect(props.type).toBe("range");
      expect(props.min).toBe(0);
      expect(props.max).toBe(100);
      expect(props.step).toBe(5);
      expect(props.value).toBe(30);
      expect(props.tabindex).toBe(0);
      expect(props["aria-orientation"]).toBe("horizontal");
      expect(props["aria-valuetext"]).toBe("30");
      expect(props["aria-labelledby"]).toBe("slider-label");

      dispose();
    });

    it("bounds a range thumb by its neighbour", () => {
      const {dispose, thumbState} = setup({defaultValue: [20, 80], index: 1});

      expect(thumbState.inputProps.value.min).toBe(20);
      expect(thumbState.inputProps.value.max).toBe(100);

      dispose();
    });

    it("takes the value the input reports", () => {
      const {dispose, input, state} = setup({defaultValue: 30, step: 10});

      input.value = "70";
      input.dispatchEvent(new Event("change"));

      expect(state.values.value).toEqual([70]);

      dispose();
    });

    it("puts the input back when the value it reported was clamped away", () => {
      const {dispose, input, state} = setup({defaultValue: [20, 40], index: 0, step: 10});

      input.value = "90";
      input.dispatchEvent(new Event("change"));

      // The low thumb cannot pass the high one, so the input goes back to what the state holds.
      expect(state.values.value).toEqual([40, 40]);
      expect(input.value).toBe("40");

      dispose();
    });

    it("drops out of the tab order and reports itself disabled", () => {
      const {dispose, thumbState} = setup({isDisabled: true});

      expect(thumbState.inputProps.value.disabled).toBe(true);
      expect(thumbState.inputProps.value.tabindex).toBeUndefined();
      expect(thumbState.isDisabled.value).toBe(true);

      dispose();
    });
  });

  describe("position", () => {
    it("places the thumb along the track", () => {
      const {dispose, thumbState} = setup({defaultValue: 25});

      expect(thumbState.thumbStyle.value.left).toBe("25%");
      expect(thumbState.thumbStyle.value.top).toBeUndefined();
      expect(thumbState.thumbStyle.value.transform).toBe("translate(-50%, -50%)");

      dispose();
    });

    it("turns the position around on a vertical slider", () => {
      const {dispose, thumbState} = setup({defaultValue: 25, orientation: "vertical"});

      // A quarter of the way up is three quarters of the way down.
      expect(thumbState.thumbStyle.value.top).toBe("75%");
      expect(thumbState.thumbStyle.value.left).toBeUndefined();

      dispose();
    });
  });

  describe("keyboard", () => {
    it("steps with the arrows", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50, step: 5});

      key(thumb, "ArrowRight");
      expect(state.values.value).toEqual([55]);

      key(thumb, "ArrowLeft");
      expect(state.values.value).toEqual([50]);

      key(thumb, "ArrowUp");
      expect(state.values.value).toEqual([55]);

      key(thumb, "ArrowDown");
      expect(state.values.value).toEqual([50]);

      dispose();
    });

    it("takes a page when shift is held", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50});

      key(thumb, "ArrowRight", {shiftKey: true});

      expect(state.values.value).toEqual([60]);

      dispose();
    });

    it("pages and jumps to the ends", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50});

      key(thumb, "PageUp");
      expect(state.values.value).toEqual([60]);

      key(thumb, "PageDown");
      expect(state.values.value).toEqual([50]);

      key(thumb, "Home");
      expect(state.values.value).toEqual([0]);

      key(thumb, "End");
      expect(state.values.value).toEqual([100]);

      dispose();
    });

    it("jumps only as far as its neighbour", () => {
      const {dispose, state, thumb} = setup({defaultValue: [20, 80], index: 0});

      key(thumb, "End");

      expect(state.values.value).toEqual([80, 80]);

      dispose();
    });

    it("consumes the keys it acts on, so the input does not step twice", () => {
      const {dispose, thumb} = setup();

      expect(key(thumb, "PageUp").defaultPrevented).toBe(true);
      expect(key(thumb, "Home").defaultPrevented).toBe(true);
      expect(key(thumb, "ArrowRight").defaultPrevented).toBe(true);

      dispose();
    });

    it("leaves other keys alone", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50});

      expect(key(thumb, "Enter").defaultPrevented).toBe(false);
      expect(state.values.value).toEqual([50]);

      dispose();
    });

    it("reports the end of the interaction for each key press", () => {
      const onChangeEnd = vi.fn();
      const {dispose, thumb} = setup({defaultValue: 50, onChangeEnd});

      key(thumb, "ArrowRight");
      key(thumb, "PageUp");

      expect(onChangeEnd).toHaveBeenCalledTimes(2);
      // One step, then one page.
      expect(onChangeEnd).toHaveBeenLastCalledWith(61);

      dispose();
    });

    it("ignores keys while disabled", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50, isThumbDisabled: true});

      key(thumb, "ArrowRight");
      key(thumb, "End");

      expect(state.values.value).toEqual([50]);

      dispose();
    });
  });

  describe("dragging", () => {
    it("follows the pointer and gives focus to the input", () => {
      const {dispose, input, state, thumb, thumbState} = setup({defaultValue: 0, step: 10});

      pressThumb(thumb);

      expect(document.activeElement).toBe(input);
      expect(thumbState.isDragging.value).toBe(true);

      dragTo(40, 0);
      expect(state.values.value).toEqual([20]);

      dragTo(80, 0);
      expect(state.values.value).toEqual([40]);

      release();
      expect(thumbState.isDragging.value).toBe(false);

      dispose();
    });

    it("stops at either end of the track", () => {
      const {dispose, state, thumb} = setup({defaultValue: 50, step: 10});

      pressThumb(thumb);
      dragTo(1000, 0);
      expect(state.values.value).toEqual([100]);

      dragTo(-1000, 0);
      expect(state.values.value).toEqual([0]);

      dispose();
    });

    it("drags the other way round on a vertical slider", () => {
      const {dispose, state, thumb} = setup({
        defaultValue: 50,
        orientation: "vertical",
        step: 10,
      });

      pressThumb(thumb);
      // Downwards on the screen is a lower value.
      dragTo(0, 4);

      expect(state.values.value).toEqual([30]);

      dispose();
    });

    it("ignores a press while disabled", () => {
      const {dispose, thumb, thumbState} = setup({isDisabled: true});

      pressThumb(thumb);

      expect(thumbState.isDragging.value).toBe(false);

      dispose();
    });
  });

  describe("focus", () => {
    it("tracks which thumb the state says is focused", async () => {
      const {dispose, input, state, thumbState} = setup({defaultValue: [20, 80], index: 1});

      expect(thumbState.isFocused.value).toBe(false);

      state.setFocusedThumb(1);
      await nextTick();

      expect(thumbState.isFocused.value).toBe(true);
      // Real focus follows the state, so a press on the track lands on the right thumb.
      expect(document.activeElement).toBe(input);

      dispose();
    });

    it("hands focus back to the state when the input takes it", () => {
      const {dispose, input, state} = setup({defaultValue: [20, 80], index: 1});

      input.dispatchEvent(new FocusEvent("focus"));
      expect(state.focusedThumb.value).toBe(1);

      input.dispatchEvent(new FocusEvent("blur"));
      expect(state.focusedThumb.value).toBeUndefined();

      dispose();
    });
  });

  describe("form reset", () => {
    it("goes back to the value it started at", async () => {
      const {dispose, form, state} = setup({defaultValue: 30, step: 10, withForm: true});

      // The listener is attached once the element has been through a flush.
      await nextTick();

      state.setThumbValue(0, 80);
      expect(state.values.value).toEqual([80]);

      form!.dispatchEvent(new Event("reset"));

      expect(state.values.value).toEqual([30]);

      dispose();
    });
  });
});
