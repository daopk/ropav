import {describe, expect, it} from "vitest";

import {clamp, roundToStepPrecision, snapValueToStep, toFixedNumber} from "@/utils/number";

describe("clamp", () => {
  it("keeps a value inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("leaves an open end alone", () => {
    expect(clamp(-1000)).toBe(-1000);
    expect(clamp(-1, 0)).toBe(0);
  });
});

describe("roundToStepPrecision", () => {
  it("rounds to the decimals the step carries", () => {
    expect(roundToStepPrecision(0.30000000000000004, 0.1)).toBe(0.3);
    expect(roundToStepPrecision(1.005, 0.01)).toBe(1.005);
  });

  it("leaves a whole step untouched", () => {
    expect(roundToStepPrecision(1.5, 1)).toBe(1.5);
  });

  it("reads the precision of a step written in exponential notation", () => {
    // `1e-7` carries eight decimals once the exponent is read, which `indexOf(".")` alone
    // would report as none.
    expect(roundToStepPrecision(1.00000012345, 1e-7)).toBe(1.00000012);
  });
});

describe("snapValueToStep", () => {
  it("snaps to the nearest step", () => {
    expect(snapValueToStep(23, 0, 100, 10)).toBe(20);
    expect(snapValueToStep(25, 0, 100, 10)).toBe(30);
    expect(snapValueToStep(-3, -10, 10, 5)).toBe(-5);
  });

  it("counts steps from the minimum rather than from zero", () => {
    expect(snapValueToStep(7, 2, 100, 5)).toBe(7);
    expect(snapValueToStep(8, 2, 100, 5)).toBe(7);
  });

  it("clamps to the range", () => {
    expect(snapValueToStep(-5, 0, 100, 10)).toBe(0);
    expect(snapValueToStep(1000, 0, 100, 10)).toBe(100);
  });

  it("stops at the last step that fits when the maximum is not a multiple", () => {
    expect(snapValueToStep(1000, 0, 95, 10)).toBe(90);
    expect(snapValueToStep(1000, undefined, 95, 10)).toBe(90);
  });

  it("keeps a fractional step free of floating point noise", () => {
    expect(snapValueToStep(0.30000000000000004, 0, 1, 0.1)).toBe(0.3);
    expect(snapValueToStep(0.25, 0, 1, 0.1)).toBe(0.2);
    // A half-step tie is decided by the binary remainder rather than by the decimal one, so
    // `0.35` rounds down — the same value React Stately reports.
    expect(snapValueToStep(0.35, 0, 1, 0.1)).toBe(0.3);
    expect(snapValueToStep(1.00000012345, 0, 2, 1e-7)).toBe(1.0000001);
  });

  it("snaps to a coarse step", () => {
    expect(snapValueToStep(137, 0, 1000, 50)).toBe(150);
    expect(snapValueToStep(50, 0, 1000, 50)).toBe(50);
  });
});

describe("toFixedNumber", () => {
  it("rounds to the given number of digits and stays a number", () => {
    // These three are the exact roundings the colour conversions depend on.
    expect(toFixedNumber(33.333333, 2)).toBe(33.33);
    expect(toFixedNumber(66.666666, 2)).toBe(66.67);
    expect(toFixedNumber(29.87999, 2)).toBe(29.88);
  });

  it("leaves a value that already fits alone", () => {
    expect(toFixedNumber(100, 2)).toBe(100);
    expect(toFixedNumber(0, 2)).toBe(0);
  });

  it("rounds in another base when asked", () => {
    expect(toFixedNumber(1.5, 0, 2)).toBe(2);
    expect(toFixedNumber(1.5, 1, 2)).toBe(1.5);
  });
});
