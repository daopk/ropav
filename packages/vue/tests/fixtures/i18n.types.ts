import type {Filter} from "@/composables/use-filter";
import type {CalendarStringKey} from "@/i18n/calendar";
import type {DateFormatter} from "@internationalized/date";
import type {LocalizedString, LocalizedStringFormatter} from "@internationalized/string";
import type {ComputedRef} from "vue";

/** What one of the locale-aware formatters resolved to, for a test to read directly. */
export interface I18nHostReady {
  collator: ComputedRef<Intl.Collator>;
  dateFormatter: ComputedRef<DateFormatter>;
  filter: ComputedRef<Filter>;
  numberFormatter: ComputedRef<Intl.NumberFormat>;
  strings: ComputedRef<LocalizedStringFormatter<CalendarStringKey, LocalizedString>>;
}

export interface I18nHostProps {
  /** Options handed to the date formatter. */
  dateOptions?: Intl.DateTimeFormatOptions;
  /** Options handed to the collator behind the filter, e.g. `{sensitivity: "base"}`. */
  filterOptions?: Intl.CollatorOptions;
  onReady?: (ready: I18nHostReady) => void;
}

export interface I18nHarnessProps extends I18nHostProps {
  locale?: string;
}
