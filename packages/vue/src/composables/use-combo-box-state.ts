import type {CollectionKey, UseCollectionReturn} from "./use-collection";
import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type {FocusStrategy, MenuTriggerState} from "./use-overlay-trigger-state";
import type {SelectSelectionMode, SelectedItem, SelectedValue} from "./use-select-state";
import type {
  CollectionSelection,
  DisabledBehavior,
  UseSelectionManagerReturn,
} from "./use-selection-manager";
import type {VirtualizerCollection, VirtualizerNode} from "../utils/virtualizer-layout";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

import {createListCollection} from "../utils/virtualizer-collection";

import {useCollection} from "./use-collection";
import {useControllableState} from "./use-controllable-state";
import {useFilter} from "./use-filter";
import {useFormValidationState} from "./use-form-validation-state";
import {useMenuTriggerState} from "./use-overlay-trigger-state";
import {defaultItemTextValue} from "./use-select-state";
import {useSelectionManager} from "./use-selection-manager";

/**
 * What made the popover open, which decides whether it shows every option or only the matches.
 *
 * Also what `menuTrigger` names: `"focus"` opens on focus, `"input"` on the first keystroke, and
 * `"manual"` only when the button is pressed or an arrow key is used.
 */
export type ComboBoxMenuTrigger = "focus" | "input" | "manual";

/** Whether an option's text matches what has been typed. */
export type ComboBoxFilter = (textValue: string, inputValue: string) => boolean;

/** What a combo box hands `validate`: the chosen key(s) *and* the text beside them. */
export interface ComboBoxValidationValue {
  /** The chosen key, or keys when multiple. */
  value: SelectedValue;
  /** The text in the input, which may be a value of its own when custom values are allowed. */
  inputValue: string;
}

export interface UseComboBoxStateOptions<T> {
  /**
   * The options, as data.
   *
   * React Aria renders its children into a hidden tree to learn the collection before the first
   * paint. Rendering is what creates DOM here, so there is no such pass — and the options only
   * exist in the DOM while the popover is open. Everything a closed combo box has to answer for
   * reads this instead: the text the input shows for the chosen option, the list the filter runs
   * over, and the key the form submits.
   */
  items: MaybeRefOrGetter<readonly T[]>;
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: T, index: number) => CollectionKey;
  /** Text shown for an item in the input, and matched on by the filter. Defaults to its text. */
  itemTextValue?: (item: T) => string | undefined;
  /** Whether an item cannot be chosen. Merges with `disabledKeys`. */
  itemDisabled?: (item: T) => boolean;
  /** Whether one or several options can be chosen. @default "single" */
  selectionMode?: MaybeRefOrGetter<SelectSelectionMode | undefined>;
  /** The chosen key, or keys when multiple. Controlled. */
  value?: MaybeRefOrGetter<SelectedValue | undefined>;
  defaultValue?: SelectedValue;
  onChange?: (value: SelectedValue) => void;
  /** Text in the input. Present at all puts the caller in charge of it. */
  inputValue?: MaybeRefOrGetter<string | undefined>;
  /** Text the input starts with. Defaults to the chosen option's own text. */
  defaultInputValue?: MaybeRefOrGetter<string | undefined>;
  onInputChange?: (value: string) => void;
  /**
   * Reports the open state along with what opened it.
   *
   * There is no `isOpen`/`defaultOpen` to go with it, and that is upstream's design rather than an
   * omission: a combo box opens and closes as a consequence of typing, choosing and blurring, so
   * a caller pinning it open would be fighting its own state machine on every keystroke.
   */
  onOpenChange?: (isOpen: boolean, menuTrigger?: ComboBoxMenuTrigger) => void;
  /** What has to happen for the popover to appear. @default "input" */
  menuTrigger?: MaybeRefOrGetter<ComboBoxMenuTrigger | undefined>;
  /**
   * Whether an option's text matches what has been typed.
   *
   * Absent means the locale-aware `contains` of `useFilter`, which is what upstream defaults to.
   * An explicit `null` means the caller narrows `items` itself — an asynchronous search, or a
   * list sliced for a virtualizer — and nothing here filters a second time.
   */
  defaultFilter?: MaybeRefOrGetter<ComboBoxFilter | null | undefined>;
  /** Whether text matching no option may stand as the value. */
  allowsCustomValue?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the popover may open with nothing in it. */
  allowsEmptyCollection?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether leaving the field commits what is in it and closes the popover. @default true */
  shouldCloseOnBlur?: MaybeRefOrGetter<boolean | undefined>;
  /** Keys that cannot be chosen. */
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  /** @default "all" */
  disabledBehavior?: MaybeRefOrGetter<DisabledBehavior | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<ComboBoxValidationValue> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
}

export interface UseComboBoxStateReturn<T> extends MenuTriggerState, FormValidationState {
  /** The options on screen: the matches while open, and frozen at what they were while closing. */
  collection: UseCollectionReturn;
  /**
   * The same options as data, in the same order.
   *
   * Handed out because the markup for the options is written by the caller here, not rendered from
   * the collection the way React Aria does it — so whoever writes the listbox needs the list. Read
   * off the displayed collection rather than filtered again, so it freezes with it.
   */
  displayedItems: ComputedRef<T[]>;
  /** The selection, over **every** option rather than only the matches. */
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
  /** The text in the input. */
  inputValue: ComputedRef<string>;
  /** The text a form reset goes back to. */
  defaultInputValue: ComputedRef<string>;
  setInputValue: (value: string) => void;
  /** Choose whatever the arrows have landed on, or settle the text when they have landed nowhere. */
  commit: () => void;
  /** Put the text back to what the chosen option says and close, as Escape does. */
  revert: () => void;
  /** Whether the input holds focus. */
  isFocused: ComputedRef<boolean>;
  setFocused: (isFocused: boolean) => void;
  open: (focusStrategy?: FocusStrategy | null, trigger?: ComboBoxMenuTrigger) => void;
  toggle: (focusStrategy?: FocusStrategy | null, trigger?: ComboBoxMenuTrigger) => void;
}

/** The keys a value stands for, as the selection manager wants them. */
const toKeys = (value: SelectedValue): CollectionKey[] => {
  if (value == null) return [];

  return Array.isArray(value) ? [...value] : [value as CollectionKey];
};

/**
 * State for a combo box, ported from React Stately's
 * `packages/react-stately/src/combobox/useComboBoxState.ts` (react-stately 3.49.0).
 *
 * What separates this from a select is that the field holds *text*, and the text and the chosen
 * key have to be kept in step in both directions: typing narrows the options and may clear the
 * value, while choosing an option writes its name back into the field. Neither direction is a
 * one-way binding, which is why they are reconciled in one place — see `sync` below — rather than
 * at each of the events that can move either half.
 *
 * The collection is built from **data**, not from what rendered. See `items`.
 *
 * @example
 * ```ts
 * const state = useComboBoxState({items: () => props.items, value: () => props.value});
 * ```
 */
export const useComboBoxState = <T>(
  options: UseComboBoxStateOptions<T>,
): UseComboBoxStateReturn<T> => {
  const selectionMode = computed<SelectSelectionMode>(
    () => toValue(options.selectionMode) ?? "single",
  );
  const menuTrigger = computed<ComboBoxMenuTrigger>(() => toValue(options.menuTrigger) ?? "input");
  const allowsCustomValue = computed(() => Boolean(toValue(options.allowsCustomValue)));
  const allowsEmptyCollection = computed(() => Boolean(toValue(options.allowsEmptyCollection)));
  const shouldCloseOnBlur = computed(() => toValue(options.shouldCloseOnBlur) ?? true);

  const getTextValue = options.itemTextValue ?? defaultItemTextValue;

  /** Every option, which is what the value, the form and the input's text are resolved against. */
  const source = computed(() =>
    createListCollection({
      getKey: options.itemKey,
      getTextValue,
      isDisabled: options.itemDisabled,
      items: toValue(options.items),
    }),
  );

  const sourceCollection = useCollection({source: () => source.value});

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
   * A caller switching a controlled combo box from multiple to single would otherwise leave
   * several options looking chosen behind a field that can only show one.
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

  const showAllItems = shallowRef(false);
  const isFocusedRef = shallowRef(false);

  const filter = useFilter({sensitivity: "base"});

  /**
   * The matches, or every option when the caller narrows `items` itself.
   *
   * Filtering the data rather than the built collection is the whole difference from upstream,
   * which walks the node tree because its collection comes from rendered children and can hold
   * sections. A collection built from a flat list of data has none to walk.
   */
  const filtered = computed<VirtualizerCollection>(() => {
    const resolved = toValue(options.defaultFilter);
    const match = resolved === null ? null : (resolved ?? filter.value.contains);

    if (!match) return source.value;

    const text = inputValue.value;
    const items = toValue(options.items).filter((item) => match(getTextValue(item) ?? "", text));

    return createListCollection({
      getKey: options.itemKey,
      getTextValue,
      isDisabled: options.itemDisabled,
      items,
    });
  });

  /**
   * What was on screen when the popover was last open.
   *
   * Held so the list does not rearrange itself on the way out: closing commits the text, which
   * re-runs the filter, and without this the options would visibly change as they fade.
   */
  const lastCollection = shallowRef<VirtualizerCollection | null>(null);

  const trigger = useMenuTriggerState({
    onOpenChange: (isOpen) => {
      options.onOpenChange?.(isOpen, isOpen ? menuOpenTrigger : undefined);

      selection.setFocused(isOpen);
      if (!isOpen) selection.setFocusedKey(null);
    },
  });

  const displayed = computed<VirtualizerCollection>(() => {
    if (!trigger.isOpen.value) return lastCollection.value ?? filtered.value;

    return showAllItems.value ? source.value : filtered.value;
  });

  const collection = useCollection({source: () => displayed.value});

  const displayedItems = computed<T[]>(() =>
    displayed.value.keys.flatMap((key) => {
      const node = displayed.value.getNode(key) as VirtualizerNode | undefined;

      return node ? [node.content as T] : [];
    }),
  );

  const textOf = (key: CollectionKey | null) => {
    if (key == null) return "";

    const node = source.value.getNode(key) as VirtualizerNode | undefined;

    return node?.textValue ?? sourceCollection.getItem(key)?.textValue() ?? "";
  };

  /**
   * The text the field starts with, and goes back to when the form is reset.
   *
   * A computed rather than a value captured on the first run, unlike upstream's `useState`: the
   * options can arrive after mount — an asynchronous list, a deferred import — and a constant
   * captured before they landed would leave the reset target permanently empty.
   */
  const defaultInputValue = computed(() => {
    const given = toValue(options.defaultInputValue);

    if (given != null) return given;

    const value = defaultValue.value;
    const key = Array.isArray(value) ? (value[0] ?? null) : value;

    return selectionMode.value === "single" ? textOf(key as CollectionKey | null) : "";
  });

  const input = useControllableState<string>({
    defaultValue: defaultInputValue.value,
    onValueChange: options.onInputChange,
    value: () => toValue(options.inputValue),
  });

  const inputValue = computed(() => input.state.value);

  const validation = useFormValidationState<ComboBoxValidationValue>({
    isInvalid: options.isInvalid,
    name: options.name,
    validate: options.validate,
    validationBehavior: options.validationBehavior,
    // An empty list is nothing chosen, and custom validation is skipped for a value of `null`.
    value: () => {
      const current = displayValue.value;

      if (Array.isArray(current) && current.length === 0) return null;

      return {inputValue: inputValue.value, value: current};
    },
  });

  /** Put the text back to what the chosen option says, without touching the value. */
  const resetInputValue = () => {
    const text = selectionMode.value === "single" ? textOf(selectedKey.value) : "";

    lastValue = text;
    input.setState(text);
  };

  const closeMenu = () => {
    if (!trigger.isOpen.value) return;

    trigger.close();
  };

  const selection = useSelectionManager({
    // Over every option, not only the matches: a key stays chosen while the filter hides it, and
    // the value in the field has to survive typing past the option it names.
    collection: sourceCollection,
    disabledBehavior: options.disabledBehavior,
    disabledKeys: options.disabledKeys,
    // A single combo box never lets go of what it has by pressing the chosen option again.
    disallowEmptySelection: () => selectionMode.value === "single",
    onSelectionChange: (keys: CollectionSelection) => {
      // A combo box never selects everything, but the manager's type allows for it.
      if (keys === "all") return;

      if (selectionMode.value !== "single") {
        setValue([...keys]);

        return;
      }

      const key = [...keys][0] ?? null;

      if (key === displayValue.value) {
        // Pressing the option that is already chosen: nothing to write, but the field still has
        // to settle back to that option's text and the popover still has to close.
        options.onChange?.(key);
        resetInputValue();
        closeMenu();

        return;
      }

      setValue(key);
    },
    selectedKeys: () => toKeys(displayValue.value),
    selectionMode,
  });

  const selectedKey = computed(() =>
    selectionMode.value === "single" ? selection.firstSelectedKey.value : null,
  );

  const selectedItems = computed<SelectedItem<T>[]>(() =>
    toKeys(displayValue.value).flatMap((key) => {
      const node = source.value.getNode(key) as VirtualizerNode | undefined;

      if (!node) return [];

      return [{key, textValue: textOf(key), value: node.content as T}];
    }),
  );

  /** What opened the popover, which decides whether every option shows or only the matches. */
  let menuOpenTrigger: ComboBoxMenuTrigger | undefined = "focus";

  const showsAllFor = (source?: ComboBoxMenuTrigger) =>
    source === "manual" || (source === "focus" && menuTrigger.value === "focus");

  /** Whether there is anything worth showing, which is what stops an empty popover appearing. */
  const canOpen = (displayAllItems: boolean) =>
    allowsEmptyCollection.value ||
    filtered.value.itemCount > 0 ||
    (displayAllItems && source.value.itemCount > 0);

  const open = (focusStrategy: FocusStrategy | null = null, source?: ComboBoxMenuTrigger) => {
    /*
     * An already-open popover is left entirely alone, which upstream does not bother with because
     * it does not have to: React's writes are deferred, so two calls in one gesture both read a
     * shut popover and settle into one open. Here the first lands at once, and rewriting the reason
     * and the focus strategy on the second would report the *later* cause of an opening that had
     * already happened.
     */
    if (trigger.isOpen.value) return;

    const displayAllItems = showsAllFor(source);

    if (!canOpen(displayAllItems)) return;

    if (displayAllItems) showAllItems.value = true;

    menuOpenTrigger = source;
    trigger.open(focusStrategy);
  };

  const toggle = (focusStrategy: FocusStrategy | null = null, source?: ComboBoxMenuTrigger) => {
    const displayAllItems = showsAllFor(source);

    if (!canOpen(displayAllItems) && !trigger.isOpen.value) return;

    if (displayAllItems && !trigger.isOpen.value) showAllItems.value = true;

    // Only the press that opens it names the reason; the one that closes it has none to give.
    if (!trigger.isOpen.value) menuOpenTrigger = source;

    trigger.toggle(focusStrategy);
  };

  const commitCustomValue = () => {
    if (selectionMode.value !== "single") {
      // The text is a search rather than the value here, so keeping it costs the selection
      // nothing — and clearing what has been chosen is not what closing the field meant.
      lastValue = inputValue.value;
      closeMenu();

      return;
    }

    lastDisplayValue = null;
    setValue(null);
    closeMenu();
  };

  const commitSelection = (shouldForceSelectionChange = false) => {
    // With both halves controlled there is nothing here to write, so the only thing left to do is
    // tell the caller — and only when the text and the chosen option have actually drifted apart.
    if (controllable.isControlled.value && input.isControlled.value) {
      const text = textOf(selectedKey.value);

      if (
        shouldForceSelectionChange ||
        selectionMode.value !== "single" ||
        inputValue.value !== text
      ) {
        options.onChange?.(displayValue.value);
      }

      // Keeps `sync` from reading this as a fresh keystroke and reopening the popover.
      lastValue = text;
      closeMenu();

      return;
    }

    resetInputValue();
    closeMenu();
  };

  const commitValue = () => {
    if (!allowsCustomValue.value) {
      commitSelection();

      return;
    }

    if (inputValue.value === textOf(selectedKey.value)) commitSelection();
    else commitCustomValue();
  };

  const commit = () => {
    if (!trigger.isOpen.value || selection.focusedKey.value == null) {
      commitValue();

      return;
    }

    const key = selection.focusedKey.value;

    // Choosing what is already chosen writes nothing, so the field has to be settled here
    // instead; anything else goes through the selection so the caller can react to it.
    if (selection.isSelected(key) && selectionMode.value === "single") commitSelection(true);
    else selection.select(key);
  };

  const revert = () => {
    if (allowsCustomValue.value && selectedKey.value == null) commitCustomValue();
    else commitSelection();
  };

  /** The text and value focus arrived on, so blurring knows whether validation has anything to say. */
  let valueOnFocus: [string, SelectedValue] = [inputValue.value, displayValue.value];

  const setFocused = (next: boolean) => {
    if (next) {
      valueOnFocus = [inputValue.value, displayValue.value];

      if (menuTrigger.value === "focus" && !toValue(options.isReadOnly)) open(null, "focus");
    } else {
      /*
       * Read before committing, not after. React compares the values its closure captured for the
       * render the blur happened in, and `commitValue` there only schedules an update — so the
       * comparison is always against the field as the user left it. A write here lands at once, so
       * the pair has to be taken first or committing would erase the very change it is asking
       * about and validation would never be revealed.
       */
      const left: [string, SelectedValue] = [inputValue.value, displayValue.value];

      if (shouldCloseOnBlur.value) commitValue();

      if (left[0] !== valueOnFocus[0] || left[1] !== valueOnFocus[1]) {
        validation.commitValidation();
      }
    }

    isFocusedRef.value = next;
  };

  /*
   * Bookkeeping for `sync`, deliberately outside Vue's reactivity.
   *
   * These answer "what did this look like the last time the two halves agreed", which is a
   * question only `sync` asks and only `sync` answers. Making them reactive would have `sync`
   * retrigger itself off its own record-keeping.
   */
  let lastValue = inputValue.value;
  let lastDisplayValue: SelectedValue = displayValue.value;
  let lastSelectedText = textOf(selectedKey.value);

  /**
   * Keeps the text and the chosen option in step, in both directions.
   *
   * Upstream is an effect with no dependency array, running on every render; here it is one
   * watcher over everything it reads. That is not a loosening: every branch below is already
   * guarded by "has this changed since the last time I looked", so running only when something
   * really changed reaches the same place with far fewer passes.
   */
  const sync = () => {
    const text = inputValue.value;
    const value = displayValue.value;
    const isSingle = selectionMode.value === "single";
    const textChanged = text !== lastValue;

    // Typing is what opens the popover, unless the caller asked for it to stay shut until asked.
    if (
      isFocusedRef.value &&
      (filtered.value.itemCount > 0 || allowsEmptyCollection.value) &&
      !trigger.isOpen.value &&
      textChanged &&
      menuTrigger.value !== "manual"
    ) {
      open(null, "input");
    }

    // Nothing matched any more. Not while the button is holding every option open, though.
    if (
      !showAllItems.value &&
      !allowsEmptyCollection.value &&
      trigger.isOpen.value &&
      filtered.value.itemCount === 0
    ) {
      closeMenu();
    }

    // Something was chosen.
    if (value != null && value !== lastDisplayValue && isSingle) closeMenu();

    if (textChanged) {
      selection.setFocusedKey(null);
      showAllItems.value = false;

      // Emptying the field lets go of the value. A caller driving both halves owns that decision.
      if (
        isSingle &&
        text === "" &&
        !(controllable.isControlled.value && input.isControlled.value)
      ) {
        setValue(null);
      }
    }

    if (
      value !== lastDisplayValue &&
      !(controllable.isControlled.value && input.isControlled.value)
    ) {
      resetInputValue();
    } else if (textChanged) {
      lastValue = text;
    }

    /*
     * The chosen option's own text changed under us — an asynchronous list arriving, or a rename.
     * Only outside the field, so a rename mid-sentence does not rewrite what is being typed, and
     * only when the caller is not driving the text themselves.
     */
    const selectedText = textOf(selectedKey.value);

    if (
      !isFocusedRef.value &&
      selectedKey.value != null &&
      !input.isControlled.value &&
      selectedKey.value === lastDisplayValue &&
      lastSelectedText !== selectedText
    ) {
      lastValue = selectedText;
      input.setState(selectedText);
    }

    lastDisplayValue = value;
    lastSelectedText = selectedText;
  };

  /**
   * Keeps the frozen copy up to date for as long as the popover is open.
   *
   * Upstream takes the copy inside `closeMenu`, which works there because React defers its writes:
   * committing the text and closing happen in one render, so the collection read at close time is
   * still the one the user was looking at. A write lands at once here, so by the time anything
   * closed the filter had already re-run over the committed text — and the copy would freeze the
   * list nobody ever saw. Recording it while open, and never after, keeps it to the last list that
   * was actually on screen.
   */
  watch(
    () => (trigger.isOpen.value ? (showAllItems.value ? source.value : filtered.value) : null),
    (next) => {
      if (next) lastCollection.value = next;
    },
    {flush: "post", immediate: true},
  );

  watch(
    () => [
      inputValue.value,
      displayValue.value,
      filtered.value.itemCount,
      isFocusedRef.value,
      trigger.isOpen.value,
      showAllItems.value,
      menuTrigger.value,
      textOf(selectedKey.value),
    ],
    sync,
    {flush: "post", immediate: true},
  );

  return {
    ...validation,
    close: commitValue,
    collection,
    commit,
    defaultInputValue,
    defaultValue,
    displayedItems,
    focusStrategy: trigger.focusStrategy,
    inputValue,
    isFocused: computed(() => isFocusedRef.value),
    isOpen: trigger.isOpen,
    open,
    revert,
    selectedItems,
    selectedKey,
    selection,
    selectionMode,
    setFocused,
    setInputValue: input.setState,
    setOpen: (next: boolean) => {
      if (next) open();
      else closeMenu();
    },
    setValue,
    toggle,
    value: displayValue,
  };
};
