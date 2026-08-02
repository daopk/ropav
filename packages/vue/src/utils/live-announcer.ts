/** Shared live region, created on first use and reused for every later message. */
let liveRegion: HTMLElement | undefined;

const ensureLiveRegion = (): HTMLElement => {
  if (liveRegion?.isConnected) return liveRegion;

  liveRegion = document.createElement("div");

  liveRegion.setAttribute("aria-live", "assertive");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.setAttribute("role", "log");
  liveRegion.setAttribute("data-slot", "live-announcer");
  // Hidden visually while staying in the accessibility tree; `display: none` or
  // `visibility: hidden` would take it out and silence the announcement.
  liveRegion.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap";

  document.body.appendChild(liveRegion);

  return liveRegion;
};

/**
 * Announce a message to assistive technology, for a state change that has no text of
 * its own to read.
 *
 * A pending button is the case this exists for: it keeps its label and only changes an
 * attribute, so nothing would otherwise reach a screen reader. Passing an empty string
 * clears the region, which is how a state that has ended stops being reported.
 *
 * @example
 * ```ts
 * watch(isPending, (pending) => announce(pending ? "pending" : ""));
 * ```
 */
export const announce = (message: string): void => {
  if (typeof document === "undefined") return;

  ensureLiveRegion().textContent = message;
};
