import { describe, expect, it } from "vitest";

import { parseCssTime } from "@/utils/css";

describe("parseCssTime", () => {
  it("reads milliseconds", () => {
    expect(parseCssTime("1500ms")).toBe(1500);
    expect(parseCssTime("0ms")).toBe(0);
  });

  it("reads seconds as milliseconds", () => {
    expect(parseCssTime("1.5s")).toBe(1500);
    expect(parseCssTime("0.2s")).toBe(200);
  });

  it("takes a bare number as milliseconds", () => {
    // A custom property holding `0` rather than `0ms` is the case this covers.
    expect(parseCssTime("0")).toBe(0);
    expect(parseCssTime("250")).toBe(250);
  });

  it("ignores surrounding whitespace", () => {
    // `getPropertyValue` returns the declaration's whitespace, so this is the shape it arrives in.
    expect(parseCssTime("  1500ms  ")).toBe(1500);
  });

  it("reports nothing for a value it cannot read", () => {
    expect(parseCssTime(undefined)).toBeUndefined();
    expect(parseCssTime("")).toBeUndefined();
    expect(parseCssTime("auto")).toBeUndefined();
  });

  it("keeps a negative value rather than clamping it", () => {
    // Nothing here decides what a negative delay means; the caller does.
    expect(parseCssTime("-100ms")).toBe(-100);
  });
});
