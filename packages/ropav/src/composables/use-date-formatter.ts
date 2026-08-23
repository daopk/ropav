import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { DateFormatter } from "@internationalized/date";
import { computed, toValue } from "vue";

import { useLocale } from "./use-locale";

export interface DateFormatterOptions extends Intl.DateTimeFormatOptions {
  /** The calendar system to format in, when it should not follow the locale's own. */
  calendar?: string;
}

/**
 * An `Intl.DateTimeFormat` for the locale that applies here, ported from React Aria's
 * `packages/react-aria/src/i18n/useDateFormatter.ts` (react-aria 3.51.0).
 *
 * `@internationalized/date`'s `DateFormatter` rather than `Intl` directly, because it carries the
 * `formatToParts` and calendar handling the date components read.
 *
 * React Aria memoises the options object here, so that re-rendering with an equal-but-new literal
 * does not rebuild the formatter. That guard is not carried over, because two separate things
 * already do its job: a `computed` only re-runs when something it read actually changed, and Vapor
 * hands a prop on only when its value differs — an equal replacement never reaches this code.
 * `DateFormatter` also caches the underlying `Intl.DateTimeFormat` per locale and options, so the
 * expensive half is shared even when the wrapper is rebuilt.
 */
export const useDateFormatter = (
  options?: MaybeRefOrGetter<DateFormatterOptions | undefined>,
): ComputedRef<DateFormatter> => {
  const locale = useLocale();

  return computed(() => new DateFormatter(locale.value.locale, toValue(options) ?? {}));
};
