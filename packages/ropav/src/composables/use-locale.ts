import type { Locale } from "../utils/locale";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { createContext } from "../utils/create-context";
import { isRTL } from "../utils/locale";

import { useDefaultLocale } from "./use-default-locale";

/**
 * The locale an ancestor has chosen, or `null` when nobody has and the browser's own should win.
 *
 * Loose, because most of the tree runs without a provider and reading the browser setting is the
 * right answer there — not an error.
 */
const [useLocaleContext, provideLocaleContext] = createContext<ComputedRef<Locale> | null>({
  defaultValue: null,
  name: "LocaleContext",
  strict: false,
});

/**
 * The locale that applies here: the nearest ancestor's choice, or the browser's when there is none.
 *
 * Ported from React Aria's `packages/react-aria/src/i18n/I18nProvider.tsx` (react-aria 3.51.0).
 */
export const useLocale = (): ComputedRef<Locale> => {
  const provided = useLocaleContext();
  const fallback = useDefaultLocale();

  return computed(() => provided?.value ?? fallback.value);
};

/**
 * Apply a locale to everything below, resolving its writing direction.
 *
 * A `null` or absent locale hands the decision back to the browser, so a provider can bind a value
 * that is not chosen yet without pinning the tree to a wrong language in the meantime.
 */
export const provideLocale = (
  locale: MaybeRefOrGetter<string | null | undefined>,
): ComputedRef<Locale> => {
  const fallback = useDefaultLocale();

  const resolved = computed<Locale>(() => {
    const tag = toValue(locale);

    if (tag == null) return fallback.value;

    return { direction: isRTL(tag) ? "rtl" : "ltr", locale: tag };
  });

  provideLocaleContext(resolved);

  return resolved;
};
