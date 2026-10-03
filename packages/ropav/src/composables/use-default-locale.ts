import type { Locale } from "../utils/locale";
import type { ComputedRef } from "vue";

import { computed, onScopeDispose, shallowRef } from "vue";

import { getDefaultLocale } from "../utils/locale";

/**
 * The browser's locale, shared by every consumer and updated when the user changes it.
 *
 * Module-level rather than per-component: `languagechange` is a window event and the answer is the
 * same for the whole page, so one listener serves all of them. Held behind a reference count so a
 * page with no locale-aware component on it carries no listener.
 */
const browserLocale = shallowRef<Locale>(getDefaultLocale());

let consumerCount = 0;

const onLanguageChange = () => {
  browserLocale.value = getDefaultLocale();
};

/** Attach the shared `languagechange` listener, returning the release for this consumer. */
const retainBrowserLocale = (): (() => void) => {
  /* c8 ignore next */
  if (typeof window === "undefined") return () => {};

  if (++consumerCount === 1) {
    // Re-read on the way in as well as on the event. With no consumer there is no listener, so a
    // language changed in that window would otherwise go unnoticed and the first component to
    // mount afterwards would render in the language the page was loaded with.
    onLanguageChange();
    window.addEventListener("languagechange", onLanguageChange);
  }

  return () => {
    if (--consumerCount === 0) window.removeEventListener("languagechange", onLanguageChange);
  };
};

/**
 * The locale the browser is set to, following the user changing it.
 *
 * Ported from React Aria's `packages/react-aria/src/i18n/useDefaultLocale.ts` (react-aria 3.51.0),
 * minus its server branch — this package does not render on the server yet.
 */
export const useDefaultLocale = (): ComputedRef<Locale> => {
  onScopeDispose(retainBrowserLocale());

  return computed(() => browserLocale.value);
};
