/** How insistently a message interrupts whatever assistive technology is currently saying. */
export type Announcement = "assertive" | "polite";

/**
 * One shared region per politeness, created on first use and reused afterwards.
 *
 * Two regions rather than one mutable region: changing `aria-live` on a live region already in
 * the document is not reliably picked up, and a polite message written into the assertive region
 * would interrupt anyway, which is the whole thing politeness exists to avoid.
 */
const liveRegions = new Map<Announcement, HTMLElement>();

const ensureLiveRegion = (politeness: Announcement): HTMLElement => {
  const existing = liveRegions.get(politeness);

  if (existing?.isConnected) return existing;

  const liveRegion = document.createElement("div");

  liveRegion.setAttribute("aria-live", politeness);
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.setAttribute("role", "log");
  liveRegion.setAttribute("data-slot", "live-announcer");
  liveRegion.setAttribute("data-politeness", politeness);
  // Hidden visually while staying in the accessibility tree; `display: none` or
  // `visibility: hidden` would take it out and silence the announcement.
  liveRegion.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap";

  document.body.appendChild(liveRegion);
  liveRegions.set(politeness, liveRegion);

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
 * Assertive by default, because most callers are reporting a change the user just caused and
 * needs to hear now. Pass `"polite"` for a message that must wait its turn — a drag session
 * announces its first drop target politely so the assertive "started dragging" message it just
 * made is allowed to finish.
 *
 * @example
 * ```ts
 * watch(isPending, (pending) => announce(pending ? "pending" : ""));
 * ```
 */
export const announce = (message: string, politeness: Announcement = "assertive"): void => {
  if (typeof document === "undefined") return;

  ensureLiveRegion(politeness).textContent = message;
};
