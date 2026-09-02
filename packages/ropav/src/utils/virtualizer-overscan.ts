import { Rect } from "./virtualizer-geometry";

/**
 * How much beyond the viewport the virtualizer renders.
 *
 * A third of the viewport either side, so a scroll has something to land on rather than a gap.
 *
 * React Aria adds it in the direction of travel only, from a velocity it samples on every move and
 * never resets — so the rendered set depends on how an offset was arrived at rather than on the
 * offset, a collection sitting still keeps whichever side it was last moving towards, and the
 * other side has nothing to land on when the scroll reverses. Both sides here: an extra third of a
 * screen of rows is cheap, and a rendered set that is a function of where the window *is* costs
 * nothing to reason about.
 */
export const overscannedRect = (visibleRect: Rect): Rect => {
  const overscanY = visibleRect.height / 3;
  const overscanX = visibleRect.width / 3;

  return new Rect(
    visibleRect.x - overscanX,
    visibleRect.y - overscanY,
    visibleRect.width + overscanX * 2,
    visibleRect.height + overscanY * 2,
  );
};
