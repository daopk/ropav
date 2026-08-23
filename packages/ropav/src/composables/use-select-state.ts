import type { VirtualizerNode } from "../utils/virtualizer-layout";
import type { CollectionKey, UseCollectionReturn } from "./use-collection";
import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type { FocusStrategy, MenuTriggerState } from "./use-overlay-trigger-state";
import type {
  CollectionSelection,
  DisabledBehavior,
  UseSelectionManagerReturn,
} from "./use-selection-manager";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

import { createListCollection } from "../utils/virtualizer-collection";

import { useCollection } from "./use-collection";
import { useControllableState } from "./use-controllable-state";
import { useFormValidationState } from "./use-form-validation-state";
import { useMenuTriggerState } from "./use-overlay-trigger-state";
import { useSelectionManager } from "./use-selection-manager";

/** Whether one or several options can be chosen. */
export type SelectSelectionMode = "single" | "multiple";

/** What a select holds: one key, or a list of them. */
export type SelectedValue = CollectionKey | readonly CollectionKey[] | null;

export interface UseSelectStateOptions<T> {
  /**
   * The options, as data.
   *
   * React Aria renders its children into a hidden tree to learn the collection before the first
   * paint. Rendering is what creates DOM here, so there is no such pass — and the options only
   * exist in the DOM while the popover is open. The data is therefore the only thing that can
   * answer for the collection when it is closed, which is when the value in the trigger and the
   * options of the hidden native control are read.
   */
  items: MaybeRefOrGetter<readonly T[]>;
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: T, index: number) => CollectionKey;
  /** Text an item is matched on by typeahead, and shown in the trigger when it is chosen. */
  itemTextValue?: (item: T) => string | undefined;
  /** Whether an item cannot be selected. Merges with `disabledKeys`. */
  itemDisabled?: (item: T) => boolean;
  /** Whether one or several options can be chosen. @default "single" */
  selectionMode?: MaybeRefOrGetter<SelectSelectionMode | undefined>;
  value?: MaybeRefOrGetter<SelectedValue | undefined>;
  defaultValue?: SelectedValue;
  onChange?: (value: SelectedValue) => void;
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether choosing an option closes the popover. @default true when single */
  shouldCloseOnSelect?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the popover may open with nothing in it. */
  allowsEmptyCollection?: MaybeRefOrGetter<boolean | undefined>;
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  /** @default "all" */
  disabledBehavior?: MaybeRefOrGetter<DisabledBehavior | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<SelectedValue> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
}

/** One chosen option, with both the datum and what the collection knows about it. */
export interface SelectedItem<T> {
  key: CollectionKey;
  /** The datum this option was built from. */
  value: T;
  /** The text shown for it in the trigger. */
  textValue: string;
}

export interface UseSelectStateReturn<T> extends MenuTriggerState, FormValidationState {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  selectionMode: ComputedRef<SelectSelectionMode>;
  /** The current value: one key when single, a list of them when multiple. */
  value: ComputedRef<SelectedValue>;
  /** The value a form reset goes back to. */
  defaultValue: ComputedRef<SelectedValue>;
  setValue: (value: SelectedValue) => void;
  /** The first chosen key, which is the whole value when single. */
  selectedKey: ComputedRef<CollectionKey | null>;
  selectedItems: ComputedRef<SelectedItem<T>[]>;
  /** Whether focus is anywhere inside the select. */
  isFocused: ComputedRef<boolean>;
  setFocused: (isFocused: boolean) => void;
}

/**
 * The text an option shows and is matched on, when the caller named no accessor.
 *
 * The React build reads this off the option's rendered children, which is nothing at all before
 * the popover has ever opened. A datum that *is* its own label — a string, a number — answers for
 * itself, and an object is asked for the fields a label conventionally lives in. Anything else
 * has to say so with `itemTextValue`, or the trigger would show an empty value.
 */
export const defaultItemTextValue = (item: unknown): string | undefined => {
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;

    for (const field of ["textValue", "label", "name"]) {
      const candidate = record[field];

      if (typeof candidate === "string") return candidate;
    }
  }

  return undefined;
};

/** The keys a value stands for, as the selection manager wants them. */
const toKeys = (value: SelectedValue): CollectionKey[] => {
  if (value == null) return [];

  return Array.isArray(value) ? [...value] : [value as CollectionKey];
};

/**
 * State for a select, ported from React Stately's `useSelectState`.
 *
 * Three things are held together here, which is the whole reason this exists rather than the
 * parts being wired up at the component: the open state, the collection with its selection, and
 * the validation that reads the value. Choosing an option has to touch all three in one go —
 * write the value, close the popover, and reveal validation — and any order but this one shows
 * as a flicker of the old value behind a closing popover.
 *
 * The collection is built from **data**, not from what rendered. See `items`.
 *
 * @example
 * ```ts
 * const state = useSelectState({items: () => props.items, value: () => props.value});
 * ```
 */
export const useSelectState = <T>(options: UseSelectStateOptions<T>): UseSelectStateReturn<T> => {
  const selectionMode = computed<SelectSelectionMode>(
    () => toValue(options.selectionMode) ?? "single",
  );

  const shouldCloseOnSelect = computed(
    () => toValue(options.shouldCloseOnSelect) ?? selectionMode.value === "single",
  );

  const trigger = useMenuTriggerState({
    defaultOpen: options.defaultOpen,
    isOpen: options.isOpen,
    onOpenChange: options.onOpenChange,
  });

  const source = computed(() =>
    createListCollection({
      getKey: options.itemKey,
      getTextValue: options.itemTextValue ?? defaultItemTextValue,
      isDisabled: options.itemDisabled,
      items: toValue(options.items),
    }),
  );

  const collection = useCollection({ source: () => source.value });

  const defaultValue = computed<SelectedValue>(
    () => options.defaultValue ?? (selectionMode.value === "single" ? null : []),
  );

  const controllable = useControllableState<SelectedValue>({
    defaultValue: defaultValue.value,
    onValueChange: (next) => options.onChange?.(next),
    value: () => toValue(options.value),
  });

  /**
   * Only the first key counts when the mode is single but the value arrived as a list.
   *
   * A caller switching a controlled select from multiple to single would otherwise leave several
   * options looking chosen under a trigger that can only show one.
   */
  const displayValue = computed<SelectedValue>(() => {
    const current = controllable.state.value;

    if (selectionMode.value === "single" && Array.isArray(current)) return current[0] ?? null;

    return current;
  });

  const setValue = (next: SelectedValue) => {
    if (selectionMode.value === "single") {
      controllable.setState(Array.isArray(next) ? (next[0] ?? null) : next);

      return;
    }

    controllable.setState(toKeys(next));
  };

  const validation = useFormValidationState<SelectedValue>({
    isInvalid: options.isInvalid,
    name: options.name,
    validate: options.validate,
    validationBehavior: options.validationBehavior,
    // An empty list is nothing chosen, and custom validation is skipped for a value of `null`.
    value: () => {
      const current = displayValue.value;

      return Array.isArray(current) && current.length === 0 ? null : current;
    },
  });

  const selection = useSelectionManager({
    collection,
    disabledBehavior: options.disabledBehavior,
    disabledKeys: options.disabledKeys,
    // A single select never lets go of what it has: pressing the chosen option again keeps it.
    disallowEmptySelection: () => selectionMode.value === "single",
    onSelectionChange: (keys: CollectionSelection) => {
      // A select never selects everything, but the manager's type allows for it.
      if (keys === "all") return;

      setValue(selectionMode.value === "single" ? ([...keys][0] ?? null) : [...keys]);

      if (shouldCloseOnSelect.value) trigger.close();

      validation.commitValidation();
    },
    selectedKeys: () => toKeys(displayValue.value),
    selectionMode,
  });

  const selectedItems = computed<SelectedItem<T>[]>(() =>
    toKeys(displayValue.value).flatMap((key) => {
      const node = source.value.getNode(key) as VirtualizerNode | undefined;

      if (!node) return [];

      return [
        {
          key,
          textValue: node.textValue ?? collection.getItem(key)?.textValue() ?? "",
          value: node.content as T,
        },
      ];
    }),
  );

  const isFocused = shallowRef(false);

  /**
   * A popover with nothing in it has nothing to arrow through, so it does not open.
   *
   * The guard sits on the state rather than the trigger because every way in goes through here —
   * pointer, keyboard, and a caller setting `isOpen` by hand.
   */
  const canOpen = () =>
    collection.size.value !== 0 || Boolean(toValue(options.allowsEmptyCollection));

  return {
    ...validation,
    close: trigger.close,
    collection,
    defaultValue,
    focusStrategy: trigger.focusStrategy,
    isFocused: computed(() => isFocused.value),
    isOpen: trigger.isOpen,
    open: (strategy: FocusStrategy | null = null) => {
      if (canOpen()) trigger.open(strategy);
    },
    selectedItems,
    selectedKey: selection.firstSelectedKey,
    selection,
    selectionMode,
    setFocused: (next: boolean) => {
      isFocused.value = next;
    },
    setOpen: (next: boolean) => {
      if (!next || canOpen()) trigger.setOpen(next);
    },
    setValue,
    toggle: (strategy: FocusStrategy | null = null) => {
      if (trigger.isOpen.value || canOpen()) trigger.toggle(strategy);
    },
    value: displayValue,
  };
};
