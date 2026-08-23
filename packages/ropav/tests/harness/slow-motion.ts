/**
 * Stretch every CSS animation and transition, so a state that only exists *while* something
 * animates can be asserted without racing it.
 *
 * Browser-only. The states this is for — `data-entering`, `data-exiting`, "still in the document
 * because its animation has not finished" — are bounded by a duration the stylesheet picks, which
 * is a couple of hundred milliseconds. A test asserting one of them is running against that clock:
 * it has to get from the event that starts the animation to the assertion before the animation
 * ends. That holds comfortably on an idle machine and stops holding when a full-suite run puts 283
 * files on the same cores, which is where these tests were flaking — the attribute was already
 * gone, so the failure read `expected null to be 'true'` rather than anything about timing.
 *
 * Stretching the duration removes the clock from the test without removing the animation. Nothing
 * asserted here is about *how long* a phase lasts; the claims are that the phase is entered, that
 * the element survives it, and that it is left again once the animation finishes. Those are the
 * same claims at 10s as at 200ms — the difference is that at 10s no amount of scheduling delay can
 * close the window before the assertion reads it.
 *
 * The end of the phase is then driven rather than waited for, with {@link finishAnimations}: the
 * point was never to sit through the animation, only to be sure the state clears when it ends.
 */
const SLOW_DURATION = "10s";

/**
 * `!important` on both properties, and on the pseudo-elements too, because these durations are set
 * by the component stylesheets rather than inherited — a plain rule would lose to them.
 */
const SLOW_MOTION_CSS = `
*, *::before, *::after {
  animation-duration: ${SLOW_DURATION} !important;
  transition-duration: ${SLOW_DURATION} !important;
}
`;

let sheet: HTMLStyleElement | null = null;

/**
 * Slow every animation down until {@link stopSlowMotion} is called.
 *
 * Call it *before* the event that starts the animation under test — a CSS animation already
 * running picks the new duration up, but one that has already finished cannot be brought back.
 */
export const startSlowMotion = (): void => {
  if (sheet) return;

  sheet = document.createElement("style");
  sheet.textContent = SLOW_MOTION_CSS;
  document.head.append(sheet);
};

/** Restore the stylesheet's own durations. Safe to call when slow motion is not running. */
export const stopSlowMotion = (): void => {
  sheet?.remove();
  sheet = null;
};

/**
 * Send every animation on the element straight to its end, and report how many there were.
 *
 * `finish()` rather than a wait: the animation's `finished` promise is what the components settle
 * on, and resolving it now is what the end of a real animation would have done anyway. The count
 * is returned so a caller can assert it actually had something to finish.
 */
export const finishAnimations = (element: Element): number => {
  const animations = element.getAnimations();

  for (const animation of animations) animation.finish();

  return animations.length;
};
