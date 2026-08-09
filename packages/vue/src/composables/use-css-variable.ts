import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

/**
 * Values already read off the document, so a page full of tooltips asks once.
 *
 * Kept at module scope on purpose: a custom property on the root is a theme constant, and a
 * `getComputedStyle` call is a layout read. Ported from `@heroui/react`, which caches the same way.
 */
const cache = new Map<string, string | undefined>();

export interface UseCssVariableOptions {
  /** Takes precedence over the property, for a caller passing the value in as a prop. */
  override?: MaybeRefOrGetter<string | undefined>;
  /** @default true */
  cache?: boolean;
}

/**
 * Read a CSS custom property off the document root, ported from `@heroui/react`'s
 * `useCSSVariable`.
 *
 * Read where it is declared rather than passed down as a default in code, so a theme can move a
 * timing without the component knowing. Absent on the server, where there is nothing to read from
 * and the caller falls back to its own default.
 *
 * @example
 * ```ts
 * const delay = computed(() => parseCssTime(useCssVariable("--tooltip-delay").value));
 * ```
 */
export const useCssVariable = (
  name: MaybeRefOrGetter<string>,
  options: UseCssVariableOptions = {},
): ComputedRef<string | undefined> => {
  const shouldCache = options.cache ?? true;

  return computed(() => {
    const override = toValue(options.override);

    if (override !== undefined) return override;

    if (typeof document === "undefined") return undefined;

    const property = toValue(name);

    if (shouldCache && cache.has(property)) return cache.get(property);

    // A stylesheet that has not loaded yet reads as the empty string, which is not a value —
    // reported as absent so the caller's own default applies rather than a blank.
    const value =
      getComputedStyle(document.documentElement).getPropertyValue(property).trim() || undefined;

    if (shouldCache) cache.set(property, value);

    return value;
  });
};

/** Forget everything read so far. For a test that changes a property between cases. */
export const clearCssVariableCache = (): void => {
  cache.clear();
};
