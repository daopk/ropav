import type {SliderState} from "./use-slider-state";
import type {CSSProperties, ComputedRef, MaybeRefOrGetter, Ref} from "vue";

import {computed, onScopeDispose, toValue} from "vue";

import {clamp} from "../utils/number";

import {setInteractionModality} from "./use-interaction-states";
import {useMove} from "./use-move";

export interface UseSliderOptions {
  state: SliderState;
  /** The track element. Its length is the distance a thumb can travel. */
  trackEl: Ref<HTMLElement | null>;
  /** The group's own id, and the stem every thumb id grows from. */
  id: MaybeRefOrGetter<string>;
  /** Id of the visible label, when one is rendered. */
  labelId?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
}

export interface SliderGroupAttrs {
  role: "group";
  id: string;
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
}

export interface SliderOutputAttrs {
  for: string;
  "aria-live": "off";
}

export interface UseSliderReturn {
  /** For the root element: the thumbs are inputs, and the group is what names them together. */
  groupProps: ComputedRef<SliderGroupAttrs>;
  /** Bind with `v-bind` on the track, which accepts clicks and drags for the nearest thumb. */
  trackHandlers: {onPointerdown: (event: PointerEvent) => void};
  /** Inline styles the track needs whatever the stylesheet says. */
  trackStyle: CSSProperties;
  outputProps: ComputedRef<SliderOutputAttrs>;
  getThumbId: (index: number) => string;
  /** Id each thumb points `aria-labelledby` at. */
  labelledBy: ComputedRef<string | undefined>;
  /** Ids each thumb points `aria-describedby` at. */
  describedBy: ComputedRef<string | undefined>;
  /** Hand focus to the first thumb, for a click on the label. */
  focusFirstThumb: () => void;
}

/**
 * Labelling, the output element, and click-and-drag on the track.
 *
 * Ported from React Aria's `useSlider`. The track is not decoration: pressing anywhere on it
 * moves the nearest thumb there and keeps dragging it, which is why the drag machinery lives
 * on the track as well as on each thumb.
 *
 * Only the pointer path is ported, in step with `useMove`.
 *
 * @example
 * ```ts
 * const slider = useSlider({id: sliderId, state, trackEl});
 * // <div v-bind="slider.groupProps.value"> … <div v-bind="slider.trackHandlers" ref="track">
 * ```
 */
export const useSlider = (options: UseSliderOptions): UseSliderReturn => {
  const {state, trackEl} = options;

  const isVertical = computed(() => state.orientation.value === "vertical");

  const getThumbId = (index: number) => `${toValue(options.id)}-${index}`;

  /**
   * The thumbs are named by the visible label when there is one, and by the group itself
   * otherwise — the group is the element carrying `aria-label` in that case.
   */
  const labelledBy = computed(() => toValue(options.labelId) ?? toValue(options.id));

  const describedBy = computed(() => toValue(options.ariaDescribedby));

  const ariaLabelledby = computed(() => {
    const ids = [toValue(options.labelId), toValue(options.ariaLabelledby)].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  /** Index of the thumb the current press on the track is dragging. */
  let draggingIndex: number | null = null;
  /** Where that thumb sits along the track, in pixels, as the drag goes on. */
  let currentPosition: number | null = null;
  let currentPointerId: number | undefined;
  let detachRelease: (() => void) | undefined;

  const trackSize = () => {
    const rect = trackEl.value?.getBoundingClientRect();

    if (!rect) return 0;

    return isVertical.value ? rect.height : rect.width;
  };

  const {handlers: moveHandlers} = useMove({
    onMove: ({deltaX, deltaY}) => {
      if (!trackEl.value || draggingIndex === null) return;

      const size = trackSize();

      // Picked up from where the thumb already is, so the drag continues from the press
      // rather than jumping.
      if (currentPosition === null) currentPosition = state.getThumbPercent(draggingIndex) * size;

      // A vertical slider grows upwards, which is the opposite of how the y axis runs.
      const delta = isVertical.value ? -deltaY : deltaX;

      currentPosition += delta;
      state.setThumbPercent(draggingIndex, clamp(currentPosition / size, 0, 1));
    },
    onMoveEnd: () => {
      if (draggingIndex === null) return;

      state.setThumbDragging(draggingIndex, false);
      draggingIndex = null;
    },
    onMoveStart: () => {
      currentPosition = null;
    },
  });

  const onRelease = (event: PointerEvent) => {
    if (event.pointerId !== currentPointerId) return;

    if (draggingIndex !== null) {
      state.setThumbDragging(draggingIndex, false);
      draggingIndex = null;
    }

    detachRelease?.();
  };

  /** The thumb closest to a value, preferring the lower one when two sit on top of each other. */
  const closestThumb = (value: number) => {
    const values = state.values.value;
    const split = values.findIndex((thumbValue) => value - thumbValue < 0);

    // Every thumb is above the press, so the first one is the closest.
    if (split === 0) return 0;
    // No thumb is above the press, so the press is past all of them.
    if (split === -1) return values.length - 1;

    const below = values[split - 1]!;
    const above = values[split]!;

    return Math.abs(below - value) < Math.abs(above - value) ? split - 1 : split;
  };

  const onPointerdown = (event: PointerEvent) => {
    // Anything but the primary button, or a modified click, belongs to the browser.
    if (
      event.pointerType === "mouse" &&
      (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey)
    ) {
      return;
    }

    // A press on the track only starts something new when nothing is being dragged already.
    if (
      !trackEl.value ||
      state.isDisabled.value ||
      state.values.value.some((_, index) => state.isThumbDragging(index))
    ) {
      return;
    }

    const rect = trackEl.value.getBoundingClientRect();
    const size = isVertical.value ? rect.height : rect.width;
    const offset = isVertical.value ? event.clientY - rect.top : event.clientX - rect.left;
    // A vertical track counts from the bottom up.
    const percent = isVertical.value ? 1 - offset / size : offset / size;
    const value = state.getPercentValue(percent);
    const index = closestThumb(value);

    if (index < 0 || !state.isThumbEditable(index)) {
      draggingIndex = null;

      return;
    }

    // Focus stays where it is: the press is about the value, not about the focus ring.
    event.preventDefault();

    draggingIndex = index;
    currentPointerId = event.pointerId;
    state.setFocusedThumb(index);
    state.setThumbDragging(index, true);
    state.setThumbValue(index, value);

    // A press that never moves still has to end, and `useMove` only reports an end after a
    // move, so the release is watched here too.
    window.addEventListener("pointerup", onRelease, false);
    window.addEventListener("pointercancel", onRelease, false);

    detachRelease = () => {
      window.removeEventListener("pointerup", onRelease, false);
      window.removeEventListener("pointercancel", onRelease, false);
      detachRelease = undefined;
    };
  };

  onScopeDispose(() => detachRelease?.(), true);

  return {
    describedBy,
    focusFirstThumb: () => {
      document.getElementById(getThumbId(0))?.focus();
      // Clicking the label is a pointer interaction, but the focus it hands over should be
      // as visible as a keyboard one — there is nothing else to show what just happened.
      setInteractionModality("keyboard");
    },
    getThumbId,
    groupProps: computed(() => ({
      "aria-label": toValue(options.ariaLabel),
      "aria-labelledby": ariaLabelledby.value,
      id: toValue(options.id),
      role: "group" as const,
    })),
    labelledBy,
    outputProps: computed(() => ({
      "aria-live": "off" as const,
      for: state.values.value.map((_, index) => getThumbId(index)).join(" "),
    })),
    trackHandlers: {
      onPointerdown: (event: PointerEvent) => {
        onPointerdown(event);
        // After the press has picked a thumb, so the first move continues from it.
        moveHandlers.onPointerdown(event);
      },
    },
    trackStyle: {position: "relative", touchAction: "none"},
  };
};
