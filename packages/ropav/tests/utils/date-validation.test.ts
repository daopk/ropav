import {CalendarDate} from "@internationalized/date";
import {describe, expect, it} from "vitest";

import {getDateValidationResult, getRangeValidationResult} from "@/utils/date-validation";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** No formatting options, which is the ordinary case for a date-only field. */
const OPTIONS = {};

describe("getRangeValidationResult", () => {
  it("accepts a range with both ends inside the bounds", () => {
    const result = getRangeValidationResult(
      {end: jun(20), start: jun(10)},
      jun(1),
      jun(30),
      undefined,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(false);
    expect(result.validationErrors).toEqual([]);
    expect(result.validationDetails.valid).toBe(true);
  });

  it("accepts an empty range, which is nothing to judge yet", () => {
    const result = getRangeValidationResult(null, jun(10), jun(20), undefined, OPTIONS);

    expect(result.isInvalid).toBe(false);
  });

  it("reports a start before the minimum", () => {
    const result = getRangeValidationResult(
      {end: jun(20), start: jun(5)},
      jun(10),
      null,
      undefined,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(true);
    expect(result.validationDetails.rangeUnderflow).toBe(true);
    expect(result.validationDetails.rangeOverflow).toBe(false);
  });

  it("reports an end past the maximum", () => {
    const result = getRangeValidationResult(
      {end: jun(25), start: jun(10)},
      null,
      jun(20),
      undefined,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(true);
    expect(result.validationDetails.rangeOverflow).toBe(true);
    expect(result.validationDetails.rangeUnderflow).toBe(false);
  });

  it("says the same thing once when both ends are out of bounds the same way", () => {
    // Two ends past the same maximum is one complaint, not two identical ones.
    const result = getRangeValidationResult(
      {end: jun(26), start: jun(25)},
      null,
      jun(20),
      undefined,
      OPTIONS,
    );

    expect(result.validationErrors).toHaveLength(1);
  });

  it("collects one complaint per end when they fail differently", () => {
    const result = getRangeValidationResult(
      {end: jun(25), start: jun(5)},
      jun(10),
      jun(20),
      undefined,
      OPTIONS,
    );

    expect(result.validationErrors).toHaveLength(2);
    expect(result.validationDetails.rangeUnderflow).toBe(true);
    expect(result.validationDetails.rangeOverflow).toBe(true);
  });

  it("reports a range that runs backwards", () => {
    /*
     * Neither end alone is at fault, so it is reported as both an overflow and an underflow — which
     * is what upstream does.
     */
    const result = getRangeValidationResult(
      {end: jun(10), start: jun(20)},
      null,
      null,
      undefined,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(true);
    expect(result.validationDetails.rangeOverflow).toBe(true);
    expect(result.validationDetails.rangeUnderflow).toBe(true);
    expect(result.validationErrors).toHaveLength(1);
  });

  it("only rules on the two ends, never on the days between them", () => {
    /*
     * Whether a range may span an unavailable date is the calendar's decision, so a hole in the
     * middle is not this function's business.
     */
    const middle = jun(15);
    const result = getRangeValidationResult(
      {end: jun(20), start: jun(10)},
      null,
      null,
      (date) => date.compare(middle) === 0,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(false);
  });

  it("reports an unavailable end as bad input rather than as a range problem", () => {
    // The date is inside the range; the range simply has a hole in it.
    const start = jun(10);
    const result = getRangeValidationResult(
      {end: jun(20), start},
      null,
      null,
      (date) => date.compare(start) === 0,
      OPTIONS,
    );

    expect(result.isInvalid).toBe(true);
    expect(result.validationDetails.badInput).toBe(true);
    expect(result.validationDetails.rangeUnderflow).toBe(false);
  });

  it("judges one end exactly as a single date would be judged", () => {
    const single = getDateValidationResult(jun(5), jun(10), null, undefined, OPTIONS);
    const range = getRangeValidationResult(
      {end: null, start: jun(5)},
      jun(10),
      null,
      undefined,
      OPTIONS,
    );

    expect(range.validationErrors).toEqual(single.validationErrors);
  });
});
