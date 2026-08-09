import {Point, Rect} from "./virtualizer-geometry";

/**
 * How much beyond the viewport the virtualizer renders, ported from React Aria's
 * `OverscanManager`.
 *
 * A third of the viewport is added past the scroll direction, so a fast scroll has something to
 * land on rather than a gap. The extra is added in the direction of travel only, which is why the
 * rendered set depends on how the scroll position was arrived at and not only on where it is.
 *
 * Velocity is never reset, exactly as upstream: after a scroll upward it stays negative while the
 * list sits still, and the window keeps its extra rows above. Anything comparing rendered sets
 * has to pin the direction of arrival, not just the offset.
 */
export class OverscanManager {
  private startTime = 0;

  private velocity = new Point(0, 0);

  private visibleRect = new Rect();

  setVisibleRect(rect: Rect): void {
    const time = performance.now() - this.startTime;

    if (time < 500) {
      if (rect.x !== this.visibleRect.x && time > 0) {
        this.velocity.x = (rect.x - this.visibleRect.x) / time;
      }

      if (rect.y !== this.visibleRect.y && time > 0) {
        this.velocity.y = (rect.y - this.visibleRect.y) / time;
      }
    }

    this.startTime = performance.now();
    this.visibleRect = rect;
  }

  getOverscannedRect(): Rect {
    const overscanned = this.visibleRect.copy();
    const overscanY = this.visibleRect.height / 3;
    const overscanX = this.visibleRect.width / 3;

    overscanned.height += overscanY;
    if (this.velocity.y < 0) overscanned.y -= overscanY;

    overscanned.width += overscanX;
    if (this.velocity.x < 0) overscanned.x -= overscanX;

    return overscanned;
  }
}
