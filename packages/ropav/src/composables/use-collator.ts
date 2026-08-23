import type { ComputedRef } from "vue";

import { computed } from "vue";

import { useLocale } from "./use-locale";

/**
 * Collators built so far, keyed by locale and options.
 *
 * Building one is expensive enough that React Aria caches them across components, and a collator
 * is stateless once built. Unbounded, as upstream: the key space is the set of locale/option pairs
 * a build actually uses, which is small and fixed.
 */
const collators = new Map<string, Intl.Collator>();

const cacheKey = (locale: string, options?: Intl.CollatorOptions): string =>
  locale +
  (options
    ? Object.entries(options)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .join()
    : "");

/**
 * An `Intl.Collator` for the locale that applies here, ported from React Aria's
 * `packages/react-aria/src/i18n/useCollator.ts` (react-aria 3.51.0).
 */
export const useCollator = (options?: Intl.CollatorOptions): ComputedRef<Intl.Collator> => {
  const locale = useLocale();

  return computed(() => {
    const key = cacheKey(locale.value.locale, options);
    const cached = collators.get(key);

    if (cached) return cached;

    const collator = new Intl.Collator(locale.value.locale, options);

    collators.set(key, collator);

    return collator;
  });
};
