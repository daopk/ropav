/**
 * Resolve a `tv()` slot function into a class string, merging in a caller `className`.
 *
 * Mirrors the React implementation so both packages produce identical class output.
 * When no slot function is supplied the caller `className` passes through untouched.
 *
 * @example
 * ```ts
 * composeSlotClassName(slots?.indicator, props.class);
 * composeSlotClassName(slots?.fallback, props.class, {color});
 * ```
 */
export const composeSlotClassName = (
  slotFn: ((args?: {className?: string; [key: string]: any}) => string) | undefined,
  className?: string,
  variants?: Record<string, any>,
): string | undefined =>
  typeof slotFn === "function" ? slotFn({...(variants ?? {}), className}) : className;
