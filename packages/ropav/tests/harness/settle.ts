import { nextTick } from "vue";

/**
 * Wait until every animation and transition on the element has finished.
 *
 * For reading a computed style that the stylesheet transitions to. A test that hovers something and
 * samples a colour on the next tick is not reading the colour the stylesheet paints — it is reading
 * whatever frame of a 250ms transition it happened to arrive on. Usually that is far enough along to
 * differ from the colour it started at, which is all such a test asserts, so it passes. When the
 * machine is loaded the sample can land before the transition has advanced at all, and then the two
 * values are byte-identical and the assertion reads
 * `expected 'oklab(…)' not to be 'oklab(…)'`.
 *
 * Waiting for the end removes the frame the sample lands on from the question. It also sharpens
 * what is being asserted: the value the stylesheet settles on, rather than any value that is not
 * the one before it.
 *
 * Three details, each of which is a way to get this wrong:
 *
 * 1. **The frame first.** A transition does not exist until the style recalc that follows the
 *    change creates it, so `getAnimations()` called in the same tick as the change finds nothing,
 *    resolves immediately, and hands back the value the transition started from — the exact failure
 *    this is here to remove.
 * 2. **`subtree`.** Plenty of these states are painted on a pseudo-element (a checkbox's tick lives
 *    on `::before`) or on a descendant, and an element's own animation list contains neither.
 * 3. **Skipping what cannot finish.** An animation set to repeat for ever has no `finished` to
 *    await — the blinking caret of a one-time-code field is one — so waiting on it would hang the
 *    test rather than settle it.
 */
export const settled = async (element: Element): Promise<void> => {
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const ending = element
    .getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);

  await Promise.allSettled(ending.map((animation) => animation.finished));
  await nextTick();
};
