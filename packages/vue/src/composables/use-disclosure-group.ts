import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";

export type DisclosureKey = string | number;

/** Keys that move focus between triggers, per the WAI-ARIA Accordion pattern. */
const NAVIGATION_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

export interface UseDisclosureGroupOptions {
  /** Whether more than one item can be expanded at a time. */
  allowsMultipleExpanded?: MaybeRefOrGetter<boolean | undefined>;
  /** Expanded keys in uncontrolled mode. */
  defaultExpandedKeys?: Iterable<DisclosureKey>;
  /** Expanded keys in controlled mode. */
  expandedKeys?: MaybeRefOrGetter<Iterable<DisclosureKey> | undefined>;
  /** Whether the whole group is disabled. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Called with the next expanded key set whenever it changes. */
  onExpandedChange?: (keys: Set<DisclosureKey>) => void;
}

export interface UseDisclosureGroupReturn {
  /** Currently expanded keys. */
  expandedKeys: ComputedRef<Set<DisclosureKey>>;
  /** Whether more than one item can be expanded at a time. */
  allowsMultipleExpanded: ComputedRef<boolean>;
  /** Whether the whole group is disabled. */
  isDisabled: ComputedRef<boolean>;
  /** Whether a given item is expanded. */
  isExpanded: (key: DisclosureKey) => boolean;
  /** Expand an item. No-op while the group is disabled. */
  expand: (key: DisclosureKey) => void;
  /** Collapse an item. No-op while the group is disabled. */
  collapse: (key: DisclosureKey) => void;
  /** Toggle an item. No-op while the group is disabled. */
  toggle: (key: DisclosureKey) => void;
  /** Register a trigger element for keyboard navigation. Returns its cleanup. */
  registerTrigger: (key: DisclosureKey, element: HTMLElement) => () => void;
  /** `keydown` handler for a trigger. Moves focus on Arrow/Home/End. */
  onTriggerKeydown: (event: KeyboardEvent) => void;
}

/**
 * Expanded-key state and trigger keyboard navigation for a group of disclosures.
 *
 * Backs the Accordion. Supports single and multiple expansion, controlled and
 * uncontrolled use, and Arrow/Home/End focus movement between triggers. Every trigger
 * stays tabbable — the accordion pattern does not use roving tabindex.
 *
 * @example
 * ```ts
 * const group = useDisclosureGroup({
 *   allowsMultipleExpanded: () => props.allowsMultipleExpanded,
 *   expandedKeys: () => props.expandedKeys,
 *   onExpandedChange: (keys) => emit("expandedChange", keys),
 * });
 * ```
 */
export const useDisclosureGroup = (
  options: UseDisclosureGroupOptions = {},
): UseDisclosureGroupReturn => {
  const allowsMultipleExpanded = computed(() => toValue(options.allowsMultipleExpanded) ?? false);
  const isDisabled = computed(() => toValue(options.isDisabled) ?? false);

  const {setState, state} = useControllableState<Set<DisclosureKey>>({
    defaultValue: new Set(options.defaultExpandedKeys ?? []),
    onValueChange: options.onExpandedChange,
    value: () => {
      const keys = toValue(options.expandedKeys);

      return keys === undefined ? undefined : new Set(keys);
    },
  });

  // Plain Map, not reactive — only ever read imperatively to move focus.
  const triggers = new Map<DisclosureKey, HTMLElement>();

  const isExpanded = (key: DisclosureKey) => state.value.has(key);

  const expand = (key: DisclosureKey) => {
    if (isDisabled.value || isExpanded(key)) return;

    setState((previous) => new Set(allowsMultipleExpanded.value ? [...previous, key] : [key]));
  };

  const collapse = (key: DisclosureKey) => {
    if (isDisabled.value || !isExpanded(key)) return;

    setState((previous) => {
      const next = new Set(previous);

      next.delete(key);

      return next;
    });
  };

  const toggle = (key: DisclosureKey) => {
    if (isExpanded(key)) collapse(key);
    else expand(key);
  };

  const registerTrigger = (key: DisclosureKey, element: HTMLElement) => {
    triggers.set(key, element);

    return () => {
      // Only drop the entry if it still points at this element, so a re-register
      // during an update is not undone by the previous cleanup running late.
      if (triggers.get(key) === element) triggers.delete(key);
    };
  };

  /**
   * Registered triggers in document order. Registration order is not reliable —
   * items can mount out of order — so position is resolved from the DOM itself.
   */
  const orderedTriggers = () =>
    [...triggers.values()]
      .filter((element) => element.isConnected && !element.hasAttribute("disabled"))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

  const onTriggerKeydown = (event: KeyboardEvent) => {
    if (!NAVIGATION_KEYS.has(event.key)) return;

    const current = event.currentTarget;

    if (!(current instanceof HTMLElement)) return;

    const elements = orderedTriggers();
    const index = elements.indexOf(current);

    if (index === -1) return;

    // Claim the key even at the ends of the list, so ArrowUp/ArrowDown never
    // scrolls the page out from under the focused trigger.
    event.preventDefault();

    let nextIndex: number;

    switch (event.key) {
      case "ArrowDown":
        nextIndex = Math.min(index + 1, elements.length - 1);
        break;
      case "ArrowUp":
        nextIndex = Math.max(index - 1, 0);
        break;
      case "Home":
        nextIndex = 0;
        break;
      default:
        nextIndex = elements.length - 1;
    }

    elements[nextIndex]?.focus();
  };

  return {
    allowsMultipleExpanded,
    collapse,
    expand,
    expandedKeys: computed(() => state.value),
    isDisabled,
    isExpanded,
    onTriggerKeydown,
    registerTrigger,
    toggle,
  };
};
