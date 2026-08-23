import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useId} from "./use-id";

export interface AriaLabelingProps {
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
}

export interface UseLabelsOptions extends AriaLabelingProps {
  /** The element's own id, minted when the caller has none. */
  id?: string | undefined;
}

export interface UseLabelsReturn {
  id: string;
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
}

/**
 * Reconcile the ways an element can be named, ported from React Aria's
 * `packages/react-aria/src/utils/useLabels.ts` (react-aria 3.51.0).
 *
 * When both a label and a list of labelling ids are given, `aria-labelledby` wins outright in
 * assistive technology and the `aria-label` would be dropped — so the element's own id is prepended
 * to the list, which is what makes its `aria-label` count as the first part of the name.
 */
export const useLabels = (
  options: MaybeRefOrGetter<UseLabelsOptions | undefined>,
  defaultLabel?: MaybeRefOrGetter<string | undefined>,
): ComputedRef<UseLabelsReturn> => {
  const resolved = computed(() => toValue(options) ?? {});
  const id = useId(() => resolved.value.id);

  return computed(() => {
    const {"aria-label": ariaLabel, "aria-labelledby": ariaLabelledby} = resolved.value;

    let label = ariaLabel;
    let labelledBy = ariaLabelledby;

    if (labelledBy && label) {
      labelledBy = [...new Set([id.value, ...labelledBy.trim().split(/\s+/)])].join(" ");
    } else if (labelledBy) {
      labelledBy = labelledBy.trim().split(/\s+/).join(" ");
    }

    if (!label && !labelledBy) label = toValue(defaultLabel);

    return {"aria-label": label, "aria-labelledby": labelledBy, id: id.value};
  });
};
