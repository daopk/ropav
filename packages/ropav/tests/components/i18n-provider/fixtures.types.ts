import type { Locale } from "@/utils/locale";
import type { ComputedRef } from "vue";

export interface I18nProviderFixtureProps {
  /** Forwarded to the provider, so a test can drive it. */
  locale?: string | null;
  /** Handed the locale the content below resolved. */
  onReady?: (locale: ComputedRef<Locale>) => void;
}
