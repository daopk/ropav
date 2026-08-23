/**
 * Keep a value inside a range.
 *
 * Ported from React Stately's `clamp`.
 */
export const clamp = (value: number, min = -Infinity, max = Infinity): number =>
  Math.min(Math.max(value, min), max);

/**
 * Round a value to the number of decimals the step itself carries.
 *
 * Ported from React Stately's `roundToStepPrecision`. Stepping by a fraction accumulates
 * binary floating point error — `0.1 + 0.2` is famously not `0.3` — and a slider that
 * reports `0.30000000000000004` formats it that way too. Exponential notation is read
 * separately because `1e-7` says nothing about its precision through `indexOf(".")`.
 */
export const roundToStepPrecision = (value: number, step: number): number => {
  let precision = 0;
  const stepString = step.toString();
  const exponentIndex = stepString.toLowerCase().indexOf("e-");

  if (exponentIndex > 0) {
    precision = Math.abs(Math.floor(Math.log10(Math.abs(step)))) + exponentIndex;
  } else {
    const pointIndex = stepString.indexOf(".");

    if (pointIndex >= 0) precision = stepString.length - pointIndex;
  }

  if (precision <= 0) return value;

  const pow = Math.pow(10, precision);

  return Math.round(value * pow) / pow;
};

/**
 * Snap a value to the nearest step within a range.
 *
 * Ported from React Stately's `snapValueToStep`. Steps are counted from `min` rather than
 * from zero, so a range starting at an offset still lands on values the caller asked for.
 * A value past `max` snaps down to the last step that fits rather than to `max` itself,
 * which may not be a multiple of the step.
 */
export const snapValueToStep = (
  value: number,
  min: number | undefined,
  max: number | undefined,
  step: number,
): number => {
  const minValue = Number(min);
  const maxValue = Number(max);
  const remainder = (value - (isNaN(minValue) ? 0 : minValue)) % step;

  let snappedValue = roundToStepPrecision(
    Math.abs(remainder) * 2 >= step
      ? value + Math.sign(remainder) * (step - Math.abs(remainder))
      : value - remainder,
    step,
  );

  if (!isNaN(minValue)) {
    if (snappedValue < minValue) {
      snappedValue = minValue;
    } else if (!isNaN(maxValue) && snappedValue > maxValue) {
      snappedValue =
        minValue + Math.floor(roundToStepPrecision((maxValue - minValue) / step, step)) * step;
    }
  } else if (!isNaN(maxValue) && snappedValue > maxValue) {
    snappedValue = Math.floor(roundToStepPrecision(maxValue / step, step)) * step;
  }

  return roundToStepPrecision(snappedValue, step);
};

/**
 * Round a value to a fixed number of digits.
 *
 * Ported from React Stately's `toFixedNumber`. Unlike `Number.prototype.toFixed` this keeps
 * the result a number, and `base` lets a caller round in something other than base 10.
 */
export const toFixedNumber = (value: number, digits: number, base = 10): number => {
  const pow = Math.pow(base, digits);

  return Math.round(value * pow) / pow;
};
