import type { Locale } from "@/utils/locale";
import type { ComputedRef } from "vue";

export interface LocaleHostProps {
  /** Handed the consumed locale so a test can read it without a rendered representation. */
  onReady?: (locale: ComputedRef<Locale>) => void;
}

export interface LocaleHarnessProps extends LocaleHostProps {
  /** The tag to apply to the host below. Absent means no provider at all. */
  locale?: string | null;
  /** Whether to provide anything, so the unprovided path is reachable through the same harness. */
  withProvider?: boolean;
}
