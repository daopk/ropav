import type {ComputedRef} from "vue";

import {computed} from "vue";

import {useCollator} from "./use-collator";

export interface Filter {
  /** Whether a string starts with a substring. */
  startsWith: (string: string, substring: string) => boolean;
  /** Whether a string ends with a substring. */
  endsWith: (string: string, substring: string) => boolean;
  /** Whether a string contains a substring. */
  contains: (string: string, substring: string) => boolean;
}

/**
 * Substring tests that compare the way the locale reads rather than the way the string is encoded,
 * ported from React Aria's `packages/react-aria/src/i18n/useFilter.ts` (react-aria 3.51.0).
 *
 * A date field needs this to match what somebody types against a month name: typing `Marz` should
 * find `März`, and a plain `===` never will. Both sides are normalised to NFC first so slicing by
 * length cannot cut a combining mark off its base character.
 *
 * As upstream, `ignorePunctuation` is not honoured by these three methods.
 */
export const useFilter = (options?: Intl.CollatorOptions): ComputedRef<Filter> => {
  const collator = useCollator({usage: "search", ...options});

  return computed<Filter>(() => {
    const compare = collator.value;

    return {
      contains: (string, substring) => {
        if (substring.length === 0) return true;

        const haystack = string.normalize("NFC");
        const needle = substring.normalize("NFC");

        for (let scan = 0; scan + needle.length <= haystack.length; scan++) {
          if (compare.compare(needle, haystack.slice(scan, scan + needle.length)) === 0) {
            return true;
          }
        }

        return false;
      },
      endsWith: (string, substring) => {
        if (substring.length === 0) return true;

        return (
          compare.compare(
            string.normalize("NFC").slice(-substring.normalize("NFC").length),
            substring.normalize("NFC"),
          ) === 0
        );
      },
      startsWith: (string, substring) => {
        if (substring.length === 0) return true;

        return (
          compare.compare(
            string.normalize("NFC").slice(0, substring.normalize("NFC").length),
            substring.normalize("NFC"),
          ) === 0
        );
      },
    };
  });
};
