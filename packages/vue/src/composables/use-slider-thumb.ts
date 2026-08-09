import type {SliderOrientation, SliderState} from "./use-slider-state";
import type {CSSProperties, ComputedRef, MaybeRefOrGetter, Ref} from "vue";

import {computed, nextTick, onScopeDispose, toValue, watch, watchEffect} from "vue";

import {setFormValue} from "../utils/form-value";
import {clamp} from "../utils/number";

import {useFormReset} from "./use-form-reset";
import {useMove} from "./use-move";

export interface UseSliderThumbOptions {
  state: SliderState;
  /** The track element, whose length the drag is measured against. */
  trackEl: Ref<HTMLElement | null>;
  /** The visually hidden range input this thumb stands for. */
  inputEl: Ref<HTMLInputElement | null>;
  /** Which thumb this is. @default 0 */
  index?: MaybeRefOrGetter<number | undefined>;
  /** Disables this thumb alone; the whole slider being disabled also counts. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Id of the input, which the output element points at. */
  id: MaybeRefOrGetter<string>;
  /** Ids that name the slider. */
  labelledBy?: MaybeRefOrGetter<string | undefined>;
  /** Ids that describe the slider. */
  describedBy?: MaybeRefOrGetter<string | undefined>;
  /** Name submitted with the form. */
  name?: MaybeRefOrGetter<string | undefined>;
  /** `id` of the form to submit with, for a slider rendered outside it. */
  form?: MaybeRefOrGetter<string | undefined>;
}

export interface SliderThumbInputAttrs {
  id: string;
  type: "range";
  tabindex: number | undefined;
  min: number;
  max: number;
  step: number;
  value: number;
  name: string | undefined;
  form: string | undefined;
  disabled: boolean;
  "aria-orientation": SliderOrientation;
  "aria-valuetext": string;
  "aria-labelledby": string | undefined;
  "aria-describedby": string | undefined;
}

export interface UseSliderThumbReturn {
  /** For the visually hidden range input. */
  inputProps: ComputedRef<SliderThumbInputAttrs>;
  /** Bind on the input: keyboard and pointer changes both end up here. */
  inputHandlers: {
    onBlur: () => void;
    onChange: (event: Event) => void;
    onFocus: () => void;
  };
  /**
   * The thumb element is what the pointer actually drags. Attach with `@keydown` and
   * `@pointerdown`, never through `v-bind`: a vapor render re-attaches every `on*` key that
   * arrived that way, which drops the listener when the press itself is what re-rendered it.
   */
  thumbHandlers: {
    onKeydown: (event: KeyboardEvent) => void;
    onPointerdown: (event: PointerEvent) => void;
  };
  /** Position along the track, as inline styles. */
  thumbStyle: ComputedRef<CSSProperties>;
  isDragging: ComputedRef<boolean>;
  isFocused: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
}

/**
 * One thumb of a slider: its position, its hidden input, and every way its value can move.
 *
 * Ported from React Aria's `useSliderThumb`. The thumb the user sees is a plain element, and
 * the value lives in a visually hidden `input type="range"` behind it. The input is what
 * assistive technology reads and what a form submits; the element is what the pointer drags.
 *
 * Keys are handled here rather than left to the input, so one thumb of a range cannot step
 * past its neighbour and so `shift` can mean a page.
 *
 * @example
 * ```ts
 * const thumb = useSliderThumb({id: thumbId, index: () => props.index, inputEl, state, trackEl});
 * ```
 */
export const useSliderThumb = (options: UseSliderThumbOptions): UseSliderThumbReturn => {
  const {inputEl, state, trackEl} = options;

  const index = computed(() => toValue(options.index) ?? 0);
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)) || state.isDisabled.value);
  const isVertical = computed(() => state.orientation.value === "vertical");
  const isFocused = computed(() => state.focusedThumb.value === index.value);
  const isDragging = computed(() => state.isThumbDragging(index.value));

  const focusInput = () => {
    // Without `preventScroll` a thumb near the edge of a scroll container drags the page
    // sideways as it takes focus, which reads as the slider jumping.
    inputEl.value?.focus({preventScroll: true});
  };

  // Registered as the thumb is created, not after mount: a press on the track looks for an
  // editable thumb and may arrive before any effect has run.
  watchEffect(() => state.setThumbEditable(index.value, !isDisabled.value));

  // The state decides which thumb holds focus — a press on the track hands it over — so real
  // focus follows the state rather than the other way around.
  watch(isFocused, (focused) => focused && focusInput(), {immediate: true});

  /** Bracket a keyboard change in a drag, so the interaction reports an end of its own. */
  const keyboardUpdate = (update: () => void) => {
    state.setThumbDragging(index.value, true);
    update();
    state.setThumbDragging(index.value, false);
  };

  /** Where the thumb sits along the track while dragging, in pixels. */
  let currentPosition: number | null = null;

  const {handlers: moveHandlers} = useMove({
    onMove: ({deltaX, deltaY, pointerType, shiftKey}) => {
      if (!trackEl.value) return;

      const rect = trackEl.value.getBoundingClientRect();
      const size = isVertical.value ? rect.height : rect.width;

      if (currentPosition === null) {
        currentPosition = state.getThumbPercent(index.value) * size;
      }

      if (pointerType === "keyboard") {
        // Shift takes a page rather than a step, which is how a long slider stays usable
        // from the keyboard.
        const stepSize = shiftKey ? state.pageSize.value : state.step.value;

        // Down and left lower the value; up and right raise it.
        if (deltaX < 0 || deltaY > 0) state.decrementThumb(index.value, stepSize);
        else state.incrementThumb(index.value, stepSize);

        return;
      }

      // A vertical slider grows upwards, which is the opposite of how the y axis runs.
      currentPosition += isVertical.value ? -deltaY : deltaX;
      state.setThumbPercent(index.value, clamp(currentPosition / size, 0, 1));
    },
    onMoveEnd: () => state.setThumbDragging(index.value, false),
    onMoveStart: () => {
      currentPosition = null;
      state.setThumbDragging(index.value, true);
    },
  });

  let currentPointerId: number | undefined;
  let detachRelease: (() => void) | undefined;

  const onRelease = (event: PointerEvent) => {
    if (event.pointerId !== currentPointerId) return;

    // Focus goes back to the input: the pointer may have been released over something else
    // entirely, and the thumb has to stay the thing the keyboard drives.
    focusInput();
    state.setThumbDragging(index.value, false);
    detachRelease?.();
  };

  const onPointerdown = (event: PointerEvent) => {
    if (isDisabled.value) return;
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey) return;

    focusInput();
    currentPointerId = event.pointerId;
    state.setThumbDragging(index.value, true);

    // The drag itself is the move machinery's, and it has to see the press that started it.
    moveHandlers.onPointerdown(event);

    window.addEventListener("pointerup", onRelease, false);
    window.addEventListener("pointercancel", onRelease, false);

    detachRelease = () => {
      window.removeEventListener("pointerup", onRelease, false);
      window.removeEventListener("pointercancel", onRelease, false);
      detachRelease = undefined;
    };
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (isDisabled.value) return;

    switch (event.key) {
      case "PageUp":
        keyboardUpdate(() => state.incrementThumb(index.value, state.pageSize.value));
        break;
      case "PageDown":
        keyboardUpdate(() => state.decrementThumb(index.value, state.pageSize.value));
        break;
      case "Home":
        keyboardUpdate(() => state.setThumbValue(index.value, state.getThumbMinValue(index.value)));
        break;
      case "End":
        keyboardUpdate(() => state.setThumbValue(index.value, state.getThumbMaxValue(index.value)));
        break;
      default:
        // Arrows are the move machinery's business, and everything else is the browser's.
        moveHandlers.onKeydown(event);

        return;
    }

    // The hidden input steps itself on these keys as well, and by a different amount, so the
    // key is consumed once this has acted on it.
    event.preventDefault();
    event.stopPropagation();
  };

  useFormReset(
    inputEl,
    () => state.defaultValues.value[index.value] ?? 0,
    (value) => {
      state.setThumbValue(index.value, value);
      // Belt and braces alongside the attribute the thumb keeps in step below: this covers a reset
      // called from script, where the restore happens before that watcher has run.
      void nextTick(() => {
        setFormValue(inputEl.value, String(state.getThumbValue(index.value)));
      });
    },
  );

  /*
   * Keep the input's `value` attribute in step with the thumb.
   *
   * Without it the browser has nothing to restore on a form reset and puts a range input back to
   * the **midpoint of its range** — a slider defaulting to 30 reads 50. Re-asserting after the
   * event is not enough on its own: a reset the browser starts drains microtasks before it
   * restores the controls. See {@link setFormValue}.
   */
  watch(
    [inputEl, () => state.getThumbValue(index.value)],
    ([input, value]) => setFormValue(input, String(value)),
    {flush: "post", immediate: true},
  );

  onScopeDispose(() => detachRelease?.(), true);

  return {
    inputHandlers: {
      onBlur: () => state.setFocusedThumb(undefined),
      onChange: (event: Event) => {
        const input = event.target as HTMLInputElement;

        state.setThumbValue(index.value, parseFloat(input.value));

        // Re-assert the value the state actually holds: the browser has already moved the
        // input, and a change that was clamped away leaves nothing to re-render it.
        input.value = String(state.getThumbValue(index.value));
      },
      onFocus: () => state.setFocusedThumb(index.value),
    },
    inputProps: computed(() => ({
      "aria-describedby": toValue(options.describedBy),
      "aria-labelledby": toValue(options.labelledBy),
      "aria-orientation": state.orientation.value,
      "aria-valuetext": state.getThumbValueLabel(index.value),
      disabled: isDisabled.value,
      form: toValue(options.form),
      id: toValue(options.id),
      max: state.getThumbMaxValue(index.value),
      min: state.getThumbMinValue(index.value),
      name: toValue(options.name),
      step: state.step.value,
      tabindex: isDisabled.value ? undefined : 0,
      type: "range" as const,
      value: state.getThumbValue(index.value),
    })),
    isDisabled,
    isDragging,
    isFocused,
    thumbHandlers: {onKeydown, onPointerdown},
    thumbStyle: computed(() => {
      const percent = state.getThumbPercent(index.value);
      // A vertical track is measured from the top, so the value has to be turned around.
      const offset = `${(isVertical.value ? 1 - percent : percent) * 100}%`;

      return {
        position: "absolute" as const,
        touchAction: "none" as const,
        transform: "translate(-50%, -50%)",
        ...(isVertical.value ? {top: offset} : {left: offset}),
      };
    }),
  };
};
