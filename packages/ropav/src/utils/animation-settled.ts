import { nextTick } from "vue";

export interface AnimationSettleWaiter {
  /** Abandon the wait in flight, and every wait asked for afterwards. */
  cancel: () => void;
  /** Run `onEnd` once every animation on the element has settled. */
  whenSettled: (onEnd: () => void) => void;
}

/**
 * Wait for every animation running on an element to settle.
 *
 * The animations are read a tick after being asked for, not straight away: the state that
 * triggers them is rendered as an attribute, and reading before that attribute is in the DOM
 * finds no animations at all — which would clear the state again and leave the animation never
 * playing.
 *
 * Each waiter keeps its own generation, so a newer wait supersedes an older one and a superseded
 * wait cannot resolve over the top of it. Waits that have to survive each other independently
 * therefore need a waiter each, not one waiter asked twice.
 *
 * jsdom implements no animations at all, so there every wait resolves on the next tick.
 */
export const createAnimationSettleWaiter = (
  getElement: () => HTMLElement | null | undefined,
): AnimationSettleWaiter => {
  let cancelled = false;
  let generation = 0;

  return {
    cancel: () => {
      cancelled = true;
    },

    whenSettled: (onEnd) => {
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

        // `allSettled`, not `all`: an interrupted animation rejects, and an interruption still has
        // to clear the state or the element would stay at its first frame for good.
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
          if (!cancelled && current === generation) onEnd();
        });
      });
    },
  };
};
