import type { DisclosureKey } from "./use-disclosure-group";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

export interface UseDisclosureGroupNavigationOptions {
  /** Whether more than one item can be expanded at a time. */
  allowsMultipleExpanded?: MaybeRefOrGetter<boolean | undefined>;
  /** Currently expanded keys. */
  expandedKeys: MaybeRefOrGetter<Iterable<DisclosureKey>>;
  /** Keys of the items to step through, in the order they are shown. */
  itemIds: MaybeRefOrGetter<Iterable<DisclosureKey>>;
  /** Called with the next expanded key set. */
  onExpandedChange: (keys: Set<DisclosureKey>) => void;
}

export interface UseDisclosureGroupNavigationReturn {
  /** Index of the item the steppers move from, or `-1` when there are no items. */
  currentIndex: ComputedRef<number>;
  /** Whether there is nothing before the current item. */
  isPrevDisabled: ComputedRef<boolean>;
  /** Whether there is nothing after the current item. */
  isNextDisabled: ComputedRef<boolean>;
  /** Expand the item before the current one. */
  onPrevious: () => void;
  /** Expand the item after the current one. */
  onNext: () => void;
}

/**
 * Steps a group of disclosures forwards and backwards from outside it.
 *
 * This drives the paging controls a group can be wrapped in — a stepper that walks through
 * items one at a time — and is deliberately separate from the group's own state: it only ever
 * hands back a next key set for the caller to apply, so it works the same whether the group is
 * controlled by the caller or not.
 *
 * The item it moves from is the **first expanded one**, falling back to the first item when
 * nothing is expanded. While more than one item may be expanded the steppers only ever add
 * keys, so walking forwards opens items cumulatively rather than replacing.
 *
 * @example
 * ```ts
 * const {isNextDisabled, onNext} = useDisclosureGroupNavigation({
 *   expandedKeys,
 *   itemIds: () => items.map((item) => item.id),
 *   onExpandedChange: (keys) => (expandedKeys.value = keys),
 * });
 * ```
 */
export const useDisclosureGroupNavigation = (
  options: UseDisclosureGroupNavigationOptions,
): UseDisclosureGroupNavigationReturn => {
  const itemIds = computed(() => [...toValue(options.itemIds)]);
  const expandedKeys = computed(() => new Set(toValue(options.expandedKeys)));

  const currentIndex = computed(() => {
    const expanded = itemIds.value.filter((id) => expandedKeys.value.has(id));
    // Checked against `undefined` rather than for truthiness, so `0` stays a usable key.
    const current = expanded.length > 0 ? expanded[0] : itemIds.value[0];

    return current === undefined ? -1 : itemIds.value.indexOf(current);
  });

  const isPrevDisabled = computed(() => currentIndex.value <= 0);
  const isNextDisabled = computed(() => currentIndex.value >= itemIds.value.length - 1);

  /** Expands `key`, on its own or alongside what is already open. */
  const expand = (key: DisclosureKey) => {
    options.onExpandedChange(
      (toValue(options.allowsMultipleExpanded) ?? false)
        ? new Set([...expandedKeys.value, key])
        : new Set([key]),
    );
  };

  const onPrevious = () => {
    if (isPrevDisabled.value) return;

    const previous = itemIds.value[currentIndex.value - 1];

    if (previous !== undefined) expand(previous);
  };

  const onNext = () => {
    if (isNextDisabled.value) return;

    const next = itemIds.value[currentIndex.value + 1];

    if (next !== undefined) expand(next);
  };

  return { currentIndex, isNextDisabled, isPrevDisabled, onNext, onPrevious };
};
