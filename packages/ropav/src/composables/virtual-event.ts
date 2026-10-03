import { isAndroid } from "../utils/platform";

/**
 * Whether a click came from something other than a pointer.
 *
 * Ported from React Aria's `isVirtualClick`. A screen reader and `element.click()` both
 * produce a click with no pointer data behind it, which is the only way to tell them apart
 * from a real one.
 */
export const isVirtualClick = (event: MouseEvent): boolean => {
  // Firefox with a screen reader reports an empty pointer type on a trusted event.
  if ((event as PointerEvent).pointerType === "" && event.isTrusted) return true;

  // TalkBack's `detail` depends on which listener the event arrived at, so it cannot be read the
  // same way twice. A pointer type says this one came from a click listener, and there the button
  // it claims is the tell; a mousedown carries no pointer type and still answers to `detail`.
  if (isAndroid() && (event as PointerEvent).pointerType) {
    return event.type === "click" && event.buttons === 1;
  }

  return event.detail === 0 && !(event as PointerEvent).pointerType;
};

/**
 * Whether a pointer event was synthesised by assistive technology.
 *
 * A screen reader activating an element reports a zero-sized pointer. Safari on iOS gives
 * such events the wrong coordinates and target, so they have to be left to the click handler.
 *
 * Android needs a shape of its own, and the zero-size test is turned off there rather than left
 * to miss: TalkBack's double tap reports a one-by-one pointer claiming to be a mouse. Every part
 * of that is load-bearing — pressure alone would catch real presses in Safari, which reports zero
 * for those too, and the mouse claim is what separates the double tap from a touch screen press.
 */
export const isVirtualPointerEvent = (event: PointerEvent): boolean =>
  (!isAndroid() && event.width === 0 && event.height === 0) ||
  (isAndroid() &&
    event.width === 1 &&
    event.height === 1 &&
    event.pressure === 0 &&
    event.detail === 0 &&
    event.pointerType === "mouse");
