import { cdp } from "vitest/browser";
import { nextTick } from "vue";

/**
 * Tap the middle of an element with a finger the browser reports, not one the test writes.
 *
 * Browser-only, for the reason `parkPointer` is in a module of its own: a jsdom suite that
 * imported `vitest/browser` would not start.
 *
 * A dispatched sequence is the wrong shape and always has been. A finger is a pointer that does
 * not exist until it lands and stops existing where it lifts, so the browser reports the release
 * and then destroys the pointer — an `pointerout` and a `pointerleave` before the click that
 * completes the press. A hand-written `pointerdown`/`pointerup`/`click` leaves that out, and a
 * press that mistakes the leave for the finger moving off the element passes every such test
 * while doing nothing at all on a phone.
 *
 * Driven through CDP because the touchscreen is the browser's, not the page's: the events have to
 * come from outside for the pointer to be a real one.
 *
 * Deliberately without touch emulation, which is the obvious way to ask for the same thing and
 * costs far more than it gives. Emulation makes the page's primary pointer coarse, so `hover:
 * hover` stops matching and every fill keyed on it goes unpainted — and the page is shared by the
 * whole browser run, so that reaches the suites asserting those fills. The dispatch alone produces
 * the pointer this needs.
 */
export const tap = async (element: Element): Promise<void> => {
  const box = element.getBoundingClientRect();
  const session = cdp();

  await session.send("Input.dispatchTouchEvent", {
    touchPoints: [{ x: box.left + box.width / 2, y: box.top + box.height / 2 }],
    type: "touchStart",
  });
  await session.send("Input.dispatchTouchEvent", { touchPoints: [], type: "touchEnd" });

  await nextTick();
  await nextTick();
};
