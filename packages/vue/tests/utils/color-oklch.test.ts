import {describe, expect, it} from "vitest";

import {
  GRAY_THRESHOLD,
  MAX_DARK_LIGHTNESS,
  OKLCH_HUES,
  ORANGE_LIGHTNESS_THRESHOLD,
  YELLOW_GREEN_LIGHTNESS_THRESHOLD,
  linearizeSRGB,
  rgbToOKLCH,
} from "@/utils/color-oklch";

/**
 * The conversion is pure, so it is pinned directly rather than through a colour name. Values come
 * from the same differential run as `color.test.ts` — `getColorName` output matched
 * `react-stately@3.49.0` on every input, and it reads these numbers.
 */

describe("linearizeSRGB", () => {
  it("is continuous across the knee at 0.04045", () => {
    const [below] = linearizeSRGB(0.04045, 0, 0);
    const [above] = linearizeSRGB(0.0405, 0, 0);

    expect(below).toBeCloseTo(0.0031308, 7);
    expect(above).toBeCloseTo(0.0031347, 7);
    // The two branches meet rather than stepping.
    expect(above - below).toBeLessThan(1e-5);
  });

  /**
   * Out-of-gamut negatives reflect through the origin. Without the sign carried separately, a
   * fractional power of a negative number is `NaN`, and one `NaN` poisons the whole triple.
   */
  it("reflects negatives instead of producing NaN", () => {
    const [r] = linearizeSRGB(-0.5, 0, 0);

    expect(r).toBeCloseTo(-0.2140411, 7);
    expect(Number.isNaN(r)).toBe(false);
  });
});

describe("rgbToOKLCH", () => {
  it("puts white and black at the ends of the lightness axis", () => {
    const [whiteL, whiteC] = rgbToOKLCH(255, 255, 255);
    const [blackL, blackC] = rgbToOKLCH(0, 0, 0);

    // Just over 1 from accumulated float error, which is why the name check is `> 0.999`.
    expect(whiteL).toBeCloseTo(1, 10);
    expect(whiteC).toBeLessThan(GRAY_THRESHOLD);
    expect(blackL).toBe(0);
    expect(blackC).toBe(0);
  });

  it("reads mid gray as chromaless and mid-light", () => {
    const [l, c] = rgbToOKLCH(128, 128, 128);

    expect(l).toBeCloseTo(0.5998708, 6);
    expect(c).toBeLessThan(GRAY_THRESHOLD);
  });

  /**
   * The point of OKLCH: sRGB green and blue are both "50% lightness" in HSL, and here they are
   * 0.87 and 0.45 — which is what the eye reports, and what makes one set of thresholds work
   * across every hue.
   */
  it("gives perceptually different lightness to the primaries", () => {
    const [redL, redC, redH] = rgbToOKLCH(255, 0, 0);
    const [greenL, , greenH] = rgbToOKLCH(0, 255, 0);
    const [blueL, , blueH] = rgbToOKLCH(0, 0, 255);

    expect(redL).toBeCloseTo(0.6279554, 6);
    expect(redC).toBeCloseTo(0.2576833, 6);
    expect(redH).toBeCloseTo(29.2338803, 6);

    expect(greenL).toBeCloseTo(0.8664396, 6);
    expect(greenH).toBeCloseTo(142.495345, 6);

    expect(blueL).toBeCloseTo(0.4520137, 6);
    expect(blueH).toBeCloseTo(264.0520226, 6);

    expect(greenL).toBeGreaterThan(redL);
    expect(redL).toBeGreaterThan(blueL);
  });

  it("places a hue in the bucket its name comes from", () => {
    const [, , orangeH] = rgbToOKLCH(255, 127, 0);
    const [, , accentH] = rgbToOKLCH(4, 133, 247);

    // 52.6° falls in the orange bucket [48, 94), below its midpoint, so the name stays "orange".
    expect(orangeH).toBeCloseTo(52.567783, 6);
    // 253.8° falls in the cyan bucket [175, 264) but past the midpoint, hence "cyan blue".
    expect(accentH).toBeCloseTo(253.8254393, 6);
    expect(accentH).toBeGreaterThan(175 + (264 - 175) / 2);
  });
});

describe("OKLCH_HUES", () => {
  it("starts at 0 and rises", () => {
    expect(OKLCH_HUES[0]![0]).toBe(0);

    for (let i = 1; i < OKLCH_HUES.length; i++) {
      expect(OKLCH_HUES[i]![0]).toBeGreaterThan(OKLCH_HUES[i - 1]![0]);
    }
  });

  /** The wheel wraps, so the last bucket and the first carry the same name. */
  it("wraps pink around the seam", () => {
    expect(OKLCH_HUES[0]![1]).toBe("pink");
    expect(OKLCH_HUES[OKLCH_HUES.length - 1]![1]).toBe("pink");
  });

  it("keeps the thresholds the naming rules are written against", () => {
    expect(ORANGE_LIGHTNESS_THRESHOLD).toBe(0.68);
    expect(YELLOW_GREEN_LIGHTNESS_THRESHOLD).toBe(0.85);
    expect(MAX_DARK_LIGHTNESS).toBe(0.55);
    expect(GRAY_THRESHOLD).toBe(0.001);
  });
});
