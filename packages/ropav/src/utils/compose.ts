/**
 * Resolve a `tv()` slot function into a class string, appending a caller `class`.
 *
 * The slot function owns the slot's own classes, so a caller class goes through it rather
 * than around it. Declaring `class` as a prop is what takes it out of Vue's attribute
 * fallthrough in the first place, leaving each part to place it.
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
