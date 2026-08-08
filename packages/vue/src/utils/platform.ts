/**
 * Platform checks, ported from React Aria's `packages/react-aria/src/utils/platform.ts`.
 *
 * Only the ones a number field needs are here. Two things depend on them and neither has a
 * feature-detectable alternative: which software keyboard a touch device offers, and whether a
 * role description can be announced without swallowing the required state.
 *
 * Read at call time rather than cached, so a test can stand in a different agent.
 */
const test = (pattern: RegExp): boolean =>
  typeof navigator !== "undefined" && pattern.test(navigator.userAgent);

const testPlatform = (pattern: RegExp): boolean => {
  if (typeof navigator === "undefined") return false;

  // `userAgentData` is the modern spelling and the only one Chrome keeps accurate; the legacy
  // `platform` is still the only thing Safari and Firefox report.
  const data = (navigator as Navigator & {userAgentData?: {platform?: string}}).userAgentData;

  return pattern.test(data?.platform ?? navigator.platform);
};

export const isMac = (): boolean => testPlatform(/^Mac/i);

export const isIPhone = (): boolean => testPlatform(/^iPhone/i);

/** An iPad reports itself as a Mac, so it is told apart by the touch points it claims. */
export const isIPad = (): boolean =>
  testPlatform(/^iPad/i) || (isMac() && navigator.maxTouchPoints > 1);

export const isIOS = (): boolean => isIPhone() || isIPad();

export const isAndroid = (): boolean => test(/Android/i);
