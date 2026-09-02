/** A size: pixels as a number or a `px` string, a percentage of the container, or a fraction of what is left. */
export type FlexSize = number | string;

export interface FlexSizeDefinition {
  /** A size the caller controls. Set, it outranks everything below it. */
  size?: FlexSize | null;
  /** The size the item starts at, when the caller is not controlling it. */
  defaultSize?: FlexSize | null;
  minSize?: FlexSize | null;
  maxSize?: FlexSize | null;
}

const PIXELS = /^(-?\d*\.?\d+)px$/;
const PERCENT = /^(-?\d*\.?\d+)%$/;
const NUMBER = /^-?\d*\.?\d+$/;
const FRACTION = /^(-?\d*\.?\d+)fr$/;

/**
 * Pixels and percentages are fixed; `fr` units and anything unrecognised flex.
 *
 * A bare number, a `px` string and a numeric string all count as pixels. Accepting the string
 * forms is not cosmetic: a template attribute is always a string, so `size="240px"` is the only
 * way most callers can express a pixel size at all.
 */
export const isStaticSize = (size?: FlexSize | null): boolean => {
  if (size == null) return false;
  if (typeof size === "number") return !isNaN(size);

  return PIXELS.test(size) || PERCENT.test(size) || NUMBER.test(size);
};

/** The number in front of `fr`. Anything else counts as `1fr`, as React Aria has it. */
export const parseFractionalUnit = (size?: FlexSize | null): number => {
  if (!size || typeof size === "number") return 1;

  const match = FRACTION.exec(size);

  return match ? parseFloat(match[1]!) : 1;
};

export const parseStaticSize = (size: FlexSize, availableSize: number): number => {
  if (typeof size === "number") return size;

  const percent = PERCENT.exec(size);

  if (percent) return availableSize * (parseFloat(percent[1]!) / 100);

  const pixels = PIXELS.exec(size);

  if (pixels) return parseFloat(pixels[1]!);

  if (NUMBER.test(size)) return parseFloat(size);

  throw new Error("Only percentages or numbers are supported for static sizes");
};

export const getMaxSize = (maxSize: FlexSize | null | undefined, availableSize: number): number =>
  maxSize != null ? parseStaticSize(maxSize, availableSize) : Number.MAX_SAFE_INTEGER;

/**
 * A minimum cannot be given in `fr`: knowing what a fraction comes to would need every other
 * item's size, which is the very thing being solved for.
 */
export const getMinSize = (minSize: FlexSize | null | undefined, availableSize: number): number =>
  minSize != null ? parseStaticSize(minSize, availableSize) : 0;

interface FlexItem {
  frozen: boolean;
  baseSize: number;
  hypotheticalMainSize: number;
  min: number;
  max: number;
  flex: number;
  targetMainSize: number;
  violation: number;
}

/**
 * Round an array of floats that sums to an integer, keeping the sum.
 *
 * Each item has to come out a whole number of pixels, and rounding them one by one would drift:
 * the remainder is carried forward instead, so the total is preserved.
 */
const cascadeRounding = (items: FlexItem[]): number[] => {
  let floatTotal = 0;
  let intTotal = 0;

  return items.map((item) => {
    const rounded = Math.round(item.targetMainSize + floatTotal) - intTotal;

    floatTotal += item.targetMainSize;
    intTotal += rounded;

    return rounded;
  });
};

/**
 * Sizes for one container size, ported from react-stately's `calculateColumnSizes`.
 *
 * This is the CSS flexbox layout algorithm, cut down to the shape a single track needs: one line,
 * a flex basis of zero unless the item asked for a static size, and grow and shrink both equal to
 * the item's `fr`. It is deliberately **not** plain pixel sizing — `1fr` items have to share what
 * the static and percentage items leave over, and a minimum or maximum on any one of them
 * redistributes the rest.
 *
 * Keyless on purpose: a caller with overriding sizes of its own resolves them into `size` before
 * calling, which is the same precedence a lookup here would have given and leaves the solver with
 * nothing to know about how the caller identifies its items.
 */
export const calculateFlexSizes = (
  availableSize: number,
  definitions: FlexSizeDefinition[],
  getDefaultSize?: (index: number) => FlexSize | null | undefined,
  getDefaultMinSize?: (index: number) => FlexSize | null | undefined,
): number[] => {
  const originalSize = availableSize;
  const flooredSize = Math.floor(availableSize);
  const hasFractionalSize = availableSize - flooredSize > 0;

  availableSize = flooredSize;

  let hasNonFrozenItems = false;

  const items: FlexItem[] = definitions.map((definition, index) => {
    const size = (definition.size ??
      definition.defaultSize ??
      getDefaultSize?.(index) ??
      "1fr") as FlexSize;

    let frozen = false;
    let baseSize = 0;
    let flex = 0;
    let targetMainSize = 0;

    if (isStaticSize(size)) {
      baseSize = parseStaticSize(size, availableSize);
      frozen = true;
    } else {
      flex = parseFractionalUnit(size);
      if (flex <= 0) frozen = true;
    }

    const min = getMinSize(definition.minSize ?? getDefaultMinSize?.(index) ?? 0, availableSize);
    const max = getMaxSize(definition.maxSize, availableSize);
    const hypotheticalMainSize = Math.max(min, Math.min(baseSize, max));

    if (frozen) {
      targetMainSize = hypotheticalMainSize;
    } else if (baseSize > hypotheticalMainSize) {
      frozen = true;
      targetMainSize = hypotheticalMainSize;
    }

    if (!frozen) hasNonFrozenItems = true;

    return { baseSize, flex, frozen, hypotheticalMainSize, max, min, targetMainSize, violation: 0 };
  });

  while (hasNonFrozenItems) {
    let usedSize = 0;
    let flexFactors = 0;

    for (const item of items) {
      if (item.frozen) {
        usedSize += item.targetMainSize;
      } else {
        usedSize += item.baseSize;
        flexFactors += item.flex;
      }
    }

    const remainingFreeSpace = availableSize - usedSize;

    // Grow mode only: each unfrozen item takes the share of what is left that its `fr` earns.
    if (remainingFreeSpace > 0) {
      for (const item of items) {
        if (!item.frozen) {
          item.targetMainSize = item.baseSize + (item.flex / flexFactors) * remainingFreeSpace;
        }
      }
    }

    let totalViolation = 0;

    for (const item of items) {
      item.violation = 0;
      if (item.frozen) continue;

      const unclamped = item.targetMainSize;

      item.targetMainSize = Math.max(item.min, Math.min(unclamped, item.max));
      item.violation = item.targetMainSize - unclamped;
      totalViolation += item.violation;
    }

    // Freeze whatever was clamped in the direction the total went, then share out what is left
    // again over the items still free. Nothing clamped means everything is settled.
    hasNonFrozenItems = false;
    for (const item of items) {
      if (totalViolation === 0 || Math.sign(totalViolation) === Math.sign(item.violation)) {
        item.frozen = true;
      } else if (!item.frozen) {
        hasNonFrozenItems = true;
      }
    }
  }

  const sizes = cascadeRounding(items);

  // The sub-pixel remainder goes to the last item, so the items sum to the real container size
  // rather than to the floor of it.
  if (hasFractionalSize && sizes.length > 0) {
    const fraction = originalSize.toString().split(".")[1];

    sizes[sizes.length - 1] = Number(`${sizes.at(-1)}.${fraction}`);
  }

  return sizes;
};
