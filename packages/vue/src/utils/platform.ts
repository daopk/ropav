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

export const isChrome = (): boolean => test(/Chrome/i);

/**
 * Whether the engine is WebKit rather than a Chromium build reporting the same token.
 *
 * Every browser on iOS is WebKit whatever it calls itself, which is why the iOS check short
 * circuits the Chrome one. Ported from React Aria, and it matters here because only WebKit on iOS
 * delays the visual viewport resize event until the keyboard animation has finished.
 */
export const isWebKit = (): boolean => test(/AppleWebKit/i) && (isIOS() || !isChrome());

/** Input types that do not bring up a software keyboard. */
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/**
 * Whether focusing this element would bring up a software keyboard.
 *
 * Ported from React Aria's `willOpenKeyboard`. The viewport shrinks when the keyboard appears, so
 * anything measuring the viewport has to know which focus changes are about to move it.
 */
export const willOpenKeyboard = (target: Element): boolean =>
  (target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(target.type)) ||
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLElement && target.isContentEditable);
