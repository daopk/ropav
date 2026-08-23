import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

export interface UseMediaQueryOptions {
  /**
   * What to report where there is nothing to ask — the server, and any environment without
   * `matchMedia`.
   *
   * @default false
   */
  defaultValue?: boolean;
}

/**
 * Whether a media query currently matches.
 *
 * Reactive on two axes: the query itself may change, and so may the answer. Both go through the
 * same subscribe step, so switching queries tears the old listener down rather than accumulating
 * one per change.
 *
 * @example
 * ```ts
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * ```
 */
export const useMediaQuery = (
  query: MaybeRefOrGetter<string>,
  options: UseMediaQueryOptions = {},
): ComputedRef<boolean> => {
  const fallback = options.defaultValue ?? false;
  const matches = shallowRef(fallback);

  let detach: (() => void) | undefined;

  const subscribe = (next: string) => {
    detach?.();
    detach = undefined;

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      matches.value = fallback;

      return;
    }

    const list = window.matchMedia(next);
    const onChange = () => {
      matches.value = list.matches;
    };

    onChange();

    // `addListener` is deprecated, but a media query list in Safari below 14 has nothing else,
    // which is why the modern path is tried first and this is the fallback.
    if (typeof list.addEventListener === "function") {
      list.addEventListener("change", onChange);
      detach = () => list.removeEventListener("change", onChange);
    } else {
      list.addListener(onChange);
      detach = () => list.removeListener(onChange);
    }
  };

  watch(() => toValue(query), subscribe, { immediate: true });

  onScopeDispose(() => {
    detach?.();
    detach = undefined;
  }, true);

  return computed(() => matches.value);
};
