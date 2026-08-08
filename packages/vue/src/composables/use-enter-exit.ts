import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, nextTick, onScopeDispose, shallowRef, toValue, watch} from "vue";

export interface UseEnterExitOptions {
  /** The animated element. */
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Whether the element should be present. */
  isOpen: MaybeRefOrGetter<boolean>;
  /**
   * Whether the element is ready to animate in. An overlay is not: it has to be measured and
   * positioned first, and animating from where it was laid out would be a slide from the wrong
   * place.
   *
   * @default true
   */
  isReady?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseEnterExitReturn {
  /** Whether the element should be in the DOM: open, or still animating out. */
  isPresent: ComputedRef<boolean>;
  /** Render as `data-entering`, which the stylesheet keys the entry animation on. */
  isEntering: ComputedRef<boolean>;
  /** Render as `data-exiting`. */
  isExiting: ComputedRef<boolean>;
}

/**
 * Keep an element mounted until its exit animation has finished, ported from React Aria's
 * `useEnterAnimation` and `useExitAnimation`.
 *
 * An exit animation is a contradiction on its own terms: the element has to be gone, and it has
 * to still be there to animate. This resolves it by keeping the element present through the
 * animation and reporting the state as `data-exiting` while it runs, then unmounting.
 *
 * The animations are read off the element rather than timed, so the duration lives in the
 * stylesheet — the one place that knows it — and no number here can fall out of step with it.
 *
 * jsdom implements no animations at all, so there the states resolve immediately and the exit is
 * instant. Both animations are covered in the browser suites instead.
 *
 * @example
 * ```ts
 * const {isEntering, isExiting, isPresent} = useEnterExit({
 *   elementRef: popoverElement,
 *   isOpen: () => state.isOpen.value,
 *   isReady: () => placement.value !== null,
 * });
 * ```
 */
export const useEnterExit = (options: UseEnterExitOptions): UseEnterExitReturn => {
  const entering = shallowRef(true);
  const exitState = shallowRef<"closed" | "open" | "exiting">(
    toValue(options.isOpen) ? "open" : "closed",
  );

  const getElement = () => toValue(options.elementRef) ?? null;
  const isReady = computed(() => toValue(options.isReady) ?? true);
  const isEntering = computed(() => entering.value && isReady.value);
  const isExiting = computed(() => exitState.value === "exiting");

  let cancelled = false;
  /** Identifies the latest wait, so a superseded one cannot resolve over the top of it. */
  let generation = 0;

  /**
   * Resolve once every animation running on the element has settled.
   *
   * The animations are read a tick after being asked for, not straight away: the state that
   * triggers them is rendered as an attribute, and reading before that attribute is in the DOM
   * finds no animations at all — which would clear the state again and leave the animation never
   * playing.
   */
  const whenSettled = (onEnd: () => void) => {
    const current = ++generation;

    void nextTick(() => {
      if (cancelled || current !== generation) return;

      const element = getElement();

      if (!element || typeof element.getAnimations !== "function") {
        onEnd();

        return;
      }

      const animations = element.getAnimations();

      if (animations.length === 0) {
        onEnd();

        return;
      }

      // `allSettled`, not `all`: an interrupted animation rejects, and an interrupted entry still
      // has to clear the entering state or the element would stay stuck at its start frame.
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (!cancelled && current === generation) onEnd();
      });
    });
  };

  watch(
    [isEntering, () => getElement()],
    ([active]) => {
      if (!active) return;

      const element = getElement();

      // A transition started before the element was positioned is animating from the wrong
      // place, so it is cancelled rather than allowed to play out.
      if (element && typeof element.getAnimations === "function") {
        for (const animation of element.getAnimations()) {
          if (typeof CSSTransition !== "undefined" && animation instanceof CSSTransition) {
            animation.cancel();
          }
        }
      }

      whenSettled(() => {
        entering.value = false;
      });
    },
    {flush: "post", immediate: true},
  );

  // Synchronous, because this is derived state rather than a side effect: the element has to
  // already be reported as exiting by the time the render that would otherwise remove it runs.
  // A tick later is too late — the element is gone, and what animates out is a fresh one.
  watch(
    () => toValue(options.isOpen),
    (isOpen) => {
      if (isOpen) {
        // Reopening mid-exit: the element never left, so it goes straight back to open.
        exitState.value = "open";
        entering.value = true;

        return;
      }

      if (exitState.value === "open") exitState.value = "exiting";
    },
    {flush: "sync"},
  );

  watch(
    [isExiting, () => getElement()],
    ([active]) => {
      if (!active) return;

      whenSettled(() => {
        if (exitState.value === "exiting") exitState.value = "closed";
      });
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(() => {
    cancelled = true;
  }, true);

  return {
    isEntering,
    isExiting,
    isPresent: computed(() => toValue(options.isOpen) || isExiting.value),
  };
};
