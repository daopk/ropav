import { nextTick } from "vue";

/**
 * Wait until every animation and transition on the element has finished.
 *
 * For reading a computed style that the stylesheet transitions to. A test that hovers something and
 * samples a colour on the next tick is not reading the colour the stylesheet paints — it is reading
 * whatever frame of a 250ms transition it happened to arrive on. Usually that is far enough along to
 * differ from the colour it started at, which is all such a test asserts, so it passes. When the
 * machine is loaded the sample can land before the transition has advanced at all, and then the two
 * colours are byte-identical and the assertion reads
 * `expected 'oklab(…)' not to be 'oklab(…)'`.
 *
 * Waiting for the end removes the frame the sample lands on from the question. It also sharpens
 * what is being asserted: the colour the stylesheet settles on, rather than any colour that is not
 * the one before it.
 *
 * The frame at the top is load-bearing. A transition does not exist until the style recalc that
 * follows the change creates it, so `getAnimations()` called in the same tick as the change finds
 * nothing, resolves immediately, and hands back the value the transition started from — the exact
 * failure this is here to remove.
 */
export const settled = async (element: Element): Promise<void> => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};
