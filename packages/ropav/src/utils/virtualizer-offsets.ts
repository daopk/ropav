import type { VirtualizerKey } from "./virtualizer-layout-info";

/**
 * Where every row of a collection sits, whether or not anyone has rendered it.
 *
 * A windowed layout has to answer two questions on every scroll — which rows the window covers,
 * and how tall the whole collection is — and both have to be answerable for a row that has never
 * been in the DOM. React Aria answers them by walking: a row's offset is the total of the rows
 * above it, so the pass adds that total up from the top, and a region records how far it got. That
 * makes what is rendered a function of where the window has *been* rather than of where it is, and
 * it makes a pass cost more the further down it lands.
 *
 * This is the other way round. Every row gets a start and a size in one flat array, taking the
 * measured size where there is one and the estimate where there is not — so an index always has an
 * offset, an offset always has an index, and the window is a binary search rather than a walk.
 * There is no region, nothing to invalidate, and nothing that can disagree with the current scroll
 * offset.
 *
 * The array is rebuilt from the lowest index a measurement disturbed, because a row's start is the
 * previous row's end: everything above the change is still right, everything below it moved.
 */

export interface RowOffsetsOptions {
  /** How many rows there are. */
  count: number;
  /** The key of the row at an index. A measurement is held by key, so it survives a reorder. */
  keyAt: (index: number) => VirtualizerKey;
  /** How tall the row at an index is before anything has measured it. */
  estimate: (index: number) => number;
  /**
   * What the rows came from. Anything at all, compared by identity: two collections of the same
   * length can hold different rows, and a size held by key would then be read for the wrong index.
   */
  collection?: unknown;
  /** Where the first row starts — the padding, or whatever is stacked above the rows. */
  start?: number;
  /** The space between two rows, which sits between them and not after the last. */
  gap?: number;
}

/** The rows a window covers, as a closed range of indices. */
export interface RowRange {
  first: number;
  last: number;
}

/** Reads a start out of the flat array, which holds a `[start, size]` pair per row. */
const START = 0;

const SIZE = 1;

export class RowOffsets {
  private count = 0;

  private keyAt: (index: number) => VirtualizerKey = (index) => index;

  private estimate: (index: number) => number = () => 0;

  private start = 0;

  private gap = 0;

  /** The measured sizes, by key rather than by index so a reorder keeps them. */
  private sizes = new Map<VirtualizerKey, number>();

  /** `[start, size]` per row. Longer than `count` when the collection has shrunk. */
  private flat = new Float64Array(0);

  /** The lowest index whose start may have moved, or `count` when nothing has. */
  private dirtyFrom = 0;

  private collection: unknown = null;

  /**
   * Takes the shape of the collection.
   *
   * The measurements survive as long as the keys can still be asked for — a row that scrolled out
   * of the window and back in is the same row, and re-measuring it would place it at an estimate
   * for a frame first.
   */
  configure(options: RowOffsetsOptions): void {
    const start = options.start ?? 0;
    const gap = options.gap ?? 0;

    if (
      this.count === options.count &&
      this.start === start &&
      this.gap === gap &&
      this.collection === options.collection
    ) {
      // The callbacks close over the collection, so they are new objects on every pass even when
      // nothing about the collection moved. Only what they *answer* matters.
      this.keyAt = options.keyAt;
      this.estimate = options.estimate;

      return;
    }

    this.count = options.count;
    this.keyAt = options.keyAt;
    this.estimate = options.estimate;
    this.collection = options.collection;
    this.start = start;
    this.gap = gap;
    this.dirtyFrom = 0;
  }

  /** Forgets every measurement, which is what a resize does — a row's height follows its width. */
  reset(): void {
    this.sizes.clear();
    this.dirtyFrom = 0;
  }

  /**
   * Records a measured size.
   *
   * Returns whether anything moved, which is the caller's cue to lay out again. Measuring the same
   * height twice moves nothing, and that is what keeps measurement from looping.
   */
  measure(key: VirtualizerKey, size: number, index?: number): boolean {
    if (this.sizes.get(key) === size) return false;

    this.sizes.set(key, size);
    this.invalidateFrom(index ?? 0);

    return true;
  }

  /** Whether the row at an index has been measured, rather than placed at its estimate. */
  isMeasured(index: number): boolean {
    return this.sizes.has(this.keyAt(index));
  }

  /** Marks the row at an index, and everything below it, as sitting somewhere new. */
  invalidateFrom(index: number): void {
    this.dirtyFrom = Math.min(this.dirtyFrom, Math.max(0, index));
  }

  size(index: number): number {
    this.build();

    return index >= 0 && index < this.count ? this.flat[index * 2 + SIZE]! : 0;
  }

  /** Where the row at an index starts. Answers for a row nobody has rendered. */
  startOf(index: number): number {
    this.build();

    if (this.count === 0) return this.start;

    const clamped = Math.max(0, Math.min(index, this.count - 1));
    const start = this.flat[clamped * 2 + START]!;

    // Past the end there is no row, but there is still an offset — what a drop indicator after the
    // last row is placed at, and what the content ends on.
    return index > clamped ? start + this.flat[clamped * 2 + SIZE]! + this.gap : start;
  }

  endOf(index: number): number {
    return this.startOf(index) + this.size(index);
  }

  /** How tall every row together comes to, the gaps between them included. */
  total(): number {
    this.build();

    if (this.count === 0) return this.start;

    const last = this.count - 1;

    return this.flat[last * 2 + START]! + this.flat[last * 2 + SIZE]!;
  }

  /**
   * The row whose band contains an offset, clamped to the collection.
   *
   * A row ending exactly on the offset counts as being above it, which is the edge rule the whole
   * window turns on: a rectangle snapped to a row boundary would otherwise take in the row above.
   */
  indexAt(offset: number): number {
    this.build();

    if (this.count === 0) return 0;

    let low = 0;
    let high = this.count - 1;

    while (low <= high) {
      const middle = (low + high) >> 1;
      const start = this.flat[middle * 2 + START]!;

      if (start + this.flat[middle * 2 + SIZE]! <= offset) low = middle + 1;
      else if (start > offset) high = middle - 1;
      else return middle;
    }

    // Between two rows — in a gap, or past the last row. The one below is what a window starting
    // there covers.
    return Math.max(0, Math.min(low, this.count - 1));
  }

  /**
   * The rows a window covers, plus `overscan` of them either side.
   *
   * Closed at both ends: `last` is a row, not the one past it.
   *
   * Both ends are clamped into the collection, so a window that outran the data comes back with
   * the rows nearest to it rather than with nothing. That is the property the whole thing turns
   * on: there is no offset a scrollbar can reach that has no rows to answer with.
   *
   * An empty collection is the one range that holds nothing, and it says so with `last` below
   * `first` rather than by naming a row that is not there.
   */
  rangeFor(offset: number, length: number, overscan = 0): RowRange {
    this.build();

    if (this.count === 0) return { first: 0, last: -1 };

    // Both ends are the row the offset lands in, which makes the edge rule one rule rather than
    // two: a row ending exactly on the top edge is above the window, and a row starting exactly on
    // the bottom edge is in it. React Aria has it both ways — its list counts a shared edge as an
    // overlap and its table does not, so the same collection renders a different number of rows
    // depending on which one is asking. The row a closed bottom edge takes in shows no pixels; it
    // is one row, and it buys a single rule.
    const first = this.indexAt(offset);
    const last = this.indexAt(offset + length);

    return {
      first: Math.max(0, first - overscan),
      last: Math.min(this.count - 1, last + overscan),
    };
  }

  /**
   * Fills in the starts from the lowest one a measurement disturbed.
   *
   * Every row below a size that changed sits somewhere new, so there is no shortcut past them —
   * but this is a loop over a typed array with no allocation in it, which is why a hundred thousand
   * rows can afford to be re-added on the frame a row is measured.
   */
  private build(): void {
    if (this.dirtyFrom >= this.count) return;

    const needed = this.count * 2;

    if (this.flat.length < needed) {
      const grown = new Float64Array(needed);

      grown.set(this.flat.subarray(0, Math.min(this.flat.length, this.dirtyFrom * 2)));
      this.flat = grown;
    }

    let running =
      this.dirtyFrom === 0
        ? this.start
        : this.flat[(this.dirtyFrom - 1) * 2 + START]! +
          this.flat[(this.dirtyFrom - 1) * 2 + SIZE]! +
          this.gap;

    for (let index = this.dirtyFrom; index < this.count; index += 1) {
      const measured = this.sizes.get(this.keyAt(index));
      const size = measured ?? this.estimate(index);

      this.flat[index * 2 + START] = running;
      this.flat[index * 2 + SIZE] = size;
      running += size + this.gap;
    }

    this.dirtyFrom = this.count;
  }
}
