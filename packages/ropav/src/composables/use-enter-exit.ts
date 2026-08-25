import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { createAnimationSettleWaiter } from "../utils/animation-settled";

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

  /**
   * A waiter per phase rather than one shared, because entry and exit are waited for
   * independently. Sharing one meant an exit beginning while the entry was still animating
   * superseded that entry's wait for good. Nothing ever cleared the entry state after that, and
   * the element stayed at the first frame of its entry animation — scaled down and fully
   * transparent, so an overlay closed and reopened quickly became invisible until it was
   * destroyed.
   */
  const entry = createAnimationSettleWaiter(getElement);
  const exit = createAnimationSettleWaiter(getElement);

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

      entry.whenSettled(() => {
        entering.value = false;
      });
    },
    { flush: "post", immediate: true },
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
    { flush: "sync" },
  );

  watch(
    [isExiting, () => getElement()],
    ([active]) => {
      if (!active) return;

      exit.whenSettled(() => {
        if (exitState.value === "exiting") exitState.value = "closed";
      });
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    entry.cancel();
    exit.cancel();
  }, true);

  return {
    isEntering,
    isExiting,
    isPresent: computed(() => toValue(options.isOpen) || isExiting.value),
  };
};
