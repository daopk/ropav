/**
 * Read a CSS time value as a number of milliseconds.
 *
 * A bare number is taken as milliseconds, which is what a custom property holding `0` rather than
 * `0ms` means in practice.
 *
 * @example
 * ```ts
 * parseCssTime("1500ms"); // 1500
 * parseCssTime("1.5s"); // 1500
 * parseCssTime(undefined); // undefined
 * ```
 */
export const parseCssTime = (value: string | undefined): number | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();
  const parsed = Number.parseFloat(trimmed);

  if (Number.isNaN(parsed)) return undefined;
  if (trimmed.endsWith("ms")) return parsed;
  if (trimmed.endsWith("s")) return parsed * 1000;

  return parsed;
};
