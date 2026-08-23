import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useEnterExit} from "./use-enter-exit";

export interface UseModalTransitionOptions {
  /** The backdrop, which fades. */
  backdropRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** The container the dialog sits in, which moves and scales. */
  contentRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  isOpen: MaybeRefOrGetter<boolean>;
  /** Forces the exit state, for a caller driving the animation itself. */
  isExiting?: MaybeRefOrGetter<boolean | undefined>;
  /** Forces the entry state on both elements. */
  isEntering?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseModalTransitionReturn {
  /** Whether either element should be in the DOM: open, or still animating out. */
  isPresent: ComputedRef<boolean>;
  isBackdropEntering: ComputedRef<boolean>;
  isContentEntering: ComputedRef<boolean>;
  /**
   * Whether **either** element is animating out, reported to both.
   *
   * See the note on the composable: this being a union rather than two separate answers is what
   * keeps a drawer on screen long enough to slide away.
   */
  isExiting: ComputedRef<boolean>;
}

/**
 * The presence and animation state of a modal overlay's two elements, ported from React Aria's
 * `ModalOverlay`.
 *
 * The entry states are separate — the backdrop fades while the container scales in, and each waits
 * for its own animation. The **exit** state is deliberately not: it is the union, reported to both
 * elements, and both stay mounted until every animation has finished.
 *
 * That union is load-bearing rather than tidy. An element is judged to be animating by asking it
 * for its animations, and `getAnimations()` does not look into a subtree — so a container whose
 * transition is declared on the dialog *inside* it reports nothing and would be unmounted on the
 * spot, taking the dialog's slide-away with it. What keeps it on screen is the backdrop's own fade,
 * the other half of the union. Giving each element only its own answer removes a drawer's exit
 * animation entirely, and no jsdom test can see it happen.
 *
 * @example
 * ```ts
 * const transition = useModalTransition({
 *   backdropRef: backdropElement,
 *   contentRef: containerElement,
 *   isOpen: () => state.isOpen.value,
 * });
 * ```
 */
export const useModalTransition = (
  options: UseModalTransitionOptions,
): UseModalTransitionReturn => {
  const isOpen = () => toValue(options.isOpen);

  const backdrop = useEnterExit({
    elementRef: options.backdropRef,
    isOpen,
    // An entry cannot be waited for before the element exists: the wait would end against nothing
    // and clear the state again, and the animation would never play.
    isReady: () => toValue(options.backdropRef) != null,
  });

  const content = useEnterExit({
    elementRef: options.contentRef,
    isOpen,
    isReady: () => toValue(options.contentRef) != null,
  });

  const isExiting = computed(
    () => toValue(options.isExiting) ?? (backdrop.isExiting.value || content.isExiting.value),
  );

  return {
    isBackdropEntering: computed(() => toValue(options.isEntering) ?? backdrop.isEntering.value),
    isContentEntering: computed(() => toValue(options.isEntering) ?? content.isEntering.value),
    isExiting,
    isPresent: computed(
      () =>
        isOpen() ||
        backdrop.isExiting.value ||
        content.isExiting.value ||
        toValue(options.isExiting) === true,
    ),
  };
};
