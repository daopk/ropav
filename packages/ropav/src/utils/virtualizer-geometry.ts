/**
 * Geometry primitives for the virtualizer, ported from React Aria's `Point`, `Size` and `Rect`.
 *
 * Pure arithmetic with no DOM and no framework in it, kept as its own unit rather than reached
 * for through a windowing library: HeroUI's Vue and React builds are verified against each other
 * by comparing the geometry a layout produces, and different arithmetic would make every
 * difference between them unattributable.
 *
 * One deliberate omission. React Aria's `Rect.intersects` widens itself under
 * `NODE_ENV === "test"`, dropping the `area > 0` guard so a collection with no measured size
 * still reports every item as visible. That branch exists because jsdom has no layout; it makes
 * the test environment disagree with the browser about what is on screen. Here the guard always
 * applies, and a test that needs a window mocks the container's size instead.
 */

/** A corner of a rectangle, named from top to bottom and left to right. */
export type RectCorner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export class Point {
  /** The x-coordinate of the point. */
  x: number;

  /** The y-coordinate of the point. */
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy(): Point {
    return new Point(this.x, this.y);
  }

  equals(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  isOrigin(): boolean {
    return this.x === 0 && this.y === 0;
  }
}

export class Size {
  width: number;

  height: number;

  /** Negative dimensions are clamped to zero, as React Aria has it. */
  constructor(width = 0, height = 0) {
    this.width = Math.max(width, 0);
    this.height = Math.max(height, 0);
  }

  get area(): number {
    return this.width * this.height;
  }

  copy(): Size {
    return new Size(this.width, this.height);
  }

  equals(other: Size): boolean {
    return this.width === other.width && this.height === other.height;
  }
}

export class Rect {
  x: number;

  y: number;

  width: number;

  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get area(): number {
    return this.width * this.height;
  }

  get bottomLeft(): Point {
    return new Point(this.x, this.maxY);
  }

  get bottomRight(): Point {
    return new Point(this.maxX, this.maxY);
  }

  get maxX(): number {
    return this.x + this.width;
  }

  get maxY(): number {
    return this.y + this.height;
  }

  get topLeft(): Point {
    return new Point(this.x, this.y);
  }

  get topRight(): Point {
    return new Point(this.maxX, this.y);
  }

  containsPoint(point: Point): boolean {
    return this.x <= point.x && this.y <= point.y && this.maxX >= point.x && this.maxY >= point.y;
  }

  containsRect(rect: Rect): boolean {
    return this.x <= rect.x && this.y <= rect.y && this.maxX >= rect.maxX && this.maxY >= rect.maxY;
  }

  copy(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  equals(rect: Rect): boolean {
    return (
      rect.x === this.x &&
      rect.y === this.y &&
      rect.width === this.width &&
      rect.height === this.height
    );
  }

  /**
   * The first corner of this rectangle, top to bottom and left to right, that sits inside the
   * given rectangle — or `null` when none does.
   */
  getCornerInRect(rect: Rect): RectCorner | null {
    const corners: RectCorner[] = ["topLeft", "topRight", "bottomLeft", "bottomRight"];

    for (const corner of corners) {
      if (rect.containsPoint(this[corner])) return corner;
    }

    return null;
  }

  /** The intersection with another rectangle, or an all-zero rectangle when there is none. */
  intersection(other: Rect): Rect {
    if (!this.intersects(other)) return new Rect(0, 0, 0, 0);

    const x = Math.max(this.x, other.x);
    const y = Math.max(this.y, other.y);

    return new Rect(x, y, Math.min(this.maxX, other.maxX) - x, Math.min(this.maxY, other.maxY) - y);
  }

  /**
   * Whether this rectangle intersects another.
   *
   * An empty rectangle intersects nothing, which is what keeps a collection that has not been
   * measured yet from reporting every one of its items as visible.
   */
  intersects(rect: Rect): boolean {
    return (
      this.area > 0 &&
      rect.area > 0 &&
      this.x <= rect.x + rect.width &&
      rect.x <= this.x + this.width &&
      this.y <= rect.y + rect.height &&
      rect.y <= this.y + this.height
    );
  }

  pointEquals(point: Point | Rect): boolean {
    return this.x === point.x && this.y === point.y;
  }

  sizeEquals(size: Size | Rect): boolean {
    return this.width === size.width && this.height === size.height;
  }

  union(other: Rect): Rect {
    const x = Math.min(this.x, other.x);
    const y = Math.min(this.y, other.y);

    return new Rect(x, y, Math.max(this.maxX, other.maxX) - x, Math.max(this.maxY, other.maxY) - y);
  }
}
