/**
 * Resolve a `tv()` slot function into a class string, merging in a caller `class`.
 *
 * Feeding the caller class through `tv()` is what lets it *override* conflicting
 * utilities, since `tailwind-variants` runs `tailwind-merge` over the result. Vue's
 * own attribute fallthrough would only concatenate, which does not override anything.
 *
 * `class` rather than `className`: `tv()` accepts either, and `class` is the Vue idiom.
 *
 * @example
 * ```ts
 * composeSlotClassName(slots.indicator, props.class);
 * composeSlotClassName(slots.fallback, props.class, {color: props.color});
 * ```
 */
export const composeSlotClassName = (
  slotFn: ((args?: { class?: string; [key: string]: any }) => string) | undefined,
  className?: string,
  variants?: Record<string, any>,
): string | undefined =>
  typeof slotFn === "function" ? slotFn({ ...(variants ?? {}), class: className }) : className;
