import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue, useId as useVueId} from "vue";

/** Fallback counter for the case where no component instance is active. */
let fallbackCounter = 0;

/**
 * Stable element id, with support for a caller-supplied override.
 *
 * Wraps Vue's own `useId()`, which works in Vapor (it reads the generic component
 * instance rather than `getCurrentInstance()`, the latter being `null` under Vapor)
 * and is hydration-stable by design. The override is read reactively, because Vapor
 * props are getters.
 *
 * Must be called during `setup()` — that is what makes the generated value stable
 * for the lifetime of the component.
 *
 * @example
 * ```ts
 * const props = defineProps<{id?: string}>();
 * const triggerId = useId(() => props.id);
 * ```
 */
export const useId = (idOverride?: MaybeRefOrGetter<string | undefined>): ComputedRef<string> => {
  // Called once per component instance, so the generated id never changes afterwards.
  const generatedId = useVueId();
  // `useVueId()` returns "" when called outside a component instance. An empty id
  // would silently break `aria-controls`/`aria-labelledby` wiring, so fall back.
  const stableId = generatedId || `heroui-${++fallbackCounter}`;

  return computed(() => toValue(idOverride) || stableId);
};
