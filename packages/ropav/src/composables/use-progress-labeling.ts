import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {provideFieldIdsContext, useFieldIds} from "./use-field-ids";
import {useId} from "./use-id";
import {useLabels} from "./use-labels";

export interface UseProgressLabelingOptions {
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  id?: MaybeRefOrGetter<string | undefined>;
}

export interface UseProgressLabelingReturn {
  /** Stable id for the meter or progress root. */
  id: ComputedRef<string>;
  /** Visible, external, and explicit labels combined with React Aria parity. */
  ariaLabelledby: ComputedRef<string | undefined>;
}

/**
 * Wire the visible Label and explicit ARIA naming props shared by Meter and both Progress roots.
 *
 * React Aria's `useSlot` boolean only seeds whether a slot is expected on the first render. Once a
 * visible Label mounts, its ref marks the slot present even when `aria-label` or
 * `aria-labelledby` was supplied. The Label is therefore always allowed to claim an id here.
 * `useLabels` then makes `aria-label` participate alongside those ids by prepending the root's own
 * id, matching React Aria's accessible-name composition.
 */
export const useProgressLabeling = (
  options: UseProgressLabelingOptions,
): UseProgressLabelingReturn => {
  const id = useId(options.id);
  const {context, labelId} = useFieldIds({
    labelElementType: "span",
    slots: ["label"],
  });

  provideFieldIdsContext(context);

  const visibleAndExternalIds = computed(() => {
    const external = toValue(options.ariaLabelledby)?.trim().split(/\s+/).filter(Boolean) ?? [];
    const ids = [labelId.value, ...external].filter((value): value is string => Boolean(value));

    return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
  });

  const labels = useLabels(() => ({
    "aria-label": toValue(options.ariaLabel),
    "aria-labelledby": visibleAndExternalIds.value,
    id: id.value,
  }));

  return {
    ariaLabelledby: computed(() => labels.value["aria-labelledby"]),
    id,
  };
};
