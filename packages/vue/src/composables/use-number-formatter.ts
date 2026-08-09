import type {NumberFormatOptions} from "@internationalized/number";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {NumberFormatter} from "@internationalized/number";
import {computed, toValue} from "vue";

import {useLocale} from "./use-locale";

/**
 * An `Intl.NumberFormat` for the locale that applies here, ported from React Aria's
 * `packages/react-aria/src/i18n/useNumberFormatter.ts` (react-aria 3.51.0).
 *
 * `@internationalized/number`'s `NumberFormatter` rather than `Intl` directly: it carries the
 * `signDisplay` and `style: "unit"` fallbacks for engines that lack them.
 */
export const useNumberFormatter = (
  options?: MaybeRefOrGetter<NumberFormatOptions | undefined>,
): ComputedRef<Intl.NumberFormat> => {
  const locale = useLocale();

  return computed(() => new NumberFormatter(locale.value.locale, toValue(options) ?? {}));
};
