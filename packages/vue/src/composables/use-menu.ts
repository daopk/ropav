import type {CollectionKey} from "./use-collection";
import type {FocusStrategy} from "./use-overlay-trigger-state";
import type {
  CollectionSelection,
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "./use-selection-manager";
import type {ComputedRef, MaybeRefOrGetter, ShallowRef} from "vue";

import {computed, nextTick, shallowRef, toValue, watch} from "vue";

import {provideMenuContext} from "../components/menu/menu.context";

import {useCollection} from "./use-collection";
import {useId} from "./use-id";
import {useListKeyboard} from "./use-list-keyboard";
import {useSelectionManager} from "./use-selection-manager";
import {useTypeahead} from "./use-typeahead";

export interface UseMenuProps {
  /** Overrides the menu's id, which a trigger's `aria-controls` points at. */
  id?: MaybeRefOrGetter<string | undefined>;
  /** The id of the element naming the menu, normally the trigger. */
  labelledBy?: MaybeRefOrGetter<string | undefined>;
  selectionMode?: MaybeRefOrGetter<SelectionMode | undefined>;
  selectionBehavior?: MaybeRefOrGetter<SelectionBehavior | undefined>;
  selectedKeys?: MaybeRefOrGetter<"all" | Iterable<CollectionKey> | undefined>;
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  disallowEmptySelection?: MaybeRefOrGetter<boolean | undefined>;
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  disabledBehavior?: MaybeRefOrGetter<DisabledBehavior | undefined>;
  /** Whether choosing an item closes the menu. @default true */
  shouldCloseOnSelect?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Where focus lands when the menu appears. `"first"`/`"last"` pick an end, `true` focuses the
   * menu itself, and a selected item wins over any of them.
   */
  autoFocus?: MaybeRefOrGetter<boolean | FocusStrategy | undefined>;
  onAction?: (key: CollectionKey) => void;
  onSelectionChange?: (keys: CollectionSelection) => void;
  /** Closes the menu, and every menu above it. */
  onClose?: () => void;
}

export interface UseMenuReturn {
  /** Assign the menu element to this. */
  element: ShallowRef<HTMLElement | null>;
  menuId: ComputedRef<string>;
  collectionId: ComputedRef<string>;
  /** Attributes the menu element renders, beside its own class and `data-slot`. */
  menuAttributes: ComputedRef<Record<string, string | number | boolean | undefined>>;
  onKeydown: (event: KeyboardEvent) => void;
  onKeydownCapture: (event: KeyboardEvent) => void;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  isEmpty: ComputedRef<boolean>;
  selectionMode: ComputedRef<SelectionMode>;
}

/**
 * The behaviour of a menu, ported from React Aria's `useMenu`.
 *
 * Separated from the component because two components render a menu — the standalone one and the
 * one inside a dropdown — and they differ only in the class and `data-slot` they carry. React
 * splits them the same way, over a shared primitive.
 *
 * Two things differ from a listbox and both matter. Arrow keys wrap, because a menu is a short
 * list of actions where running off the end is a dead end rather than a boundary worth feeling.
 * And Enter and Space are left to the items: a menu's sections can each hold their own selection,
 * so only the item knows which one it belongs to.
 *
 * @example
 * ```ts
 * const menu = useMenu({labelledBy: () => triggerId, onClose: state.close});
 * // <div ref="element" v-bind="menu.menuAttributes.value" @keydown="menu.onKeydown">
 * ```
 */
export const useMenu = (props: UseMenuProps = {}): UseMenuReturn => {
  const menuId = useId(props.id);
  const collectionId = useId();
  const element = shallowRef<HTMLElement | null>(null);

  const collection = useCollection();

  const selection = useSelectionManager({
    collection,
    defaultSelectedKeys: props.defaultSelectedKeys,
    disabledBehavior: props.disabledBehavior,
    disabledKeys: props.disabledKeys,
    disallowEmptySelection: props.disallowEmptySelection,
    onSelectionChange: props.onSelectionChange,
    selectedKeys: props.selectedKeys,
    selectionBehavior: props.selectionBehavior,
    selectionMode: props.selectionMode,
  });

  const keyboard = useListKeyboard({
    collection,
    // The items own activation, so the collection must not also answer for it.
    disallowActivation: true,
    element,
    selection,
    // A menu is a short list of actions, so running off the end wraps rather than stopping.
    shouldFocusWrap: true,
  });

  const typeahead = useTypeahead({
    focusedKey: () => selection.focusedKey.value,
    getKeyForSearch: keyboard.getKeyForSearch,
    onSearchMatch: (key) => keyboard.focusKey(key, {scroll: true}),
  });

  const shouldCloseOnSelect = computed(() => toValue(props.shouldCloseOnSelect) ?? true);

  provideMenuContext({
    collection,
    collectionId,
    keyboard,
    menuId,
    onAction: props.onAction,
    onClose: props.onClose,
    selection,
    shouldCloseOnSelect,
  });

  /**
   * Move focus in once, when the menu appears.
   *
   * A selected item wins over the requested end of the list, because reopening a menu of choices
   * on the choice already made is where the user left off. With nothing selected and no end asked
   * for, the menu itself takes focus — that is what makes the first arrow press start from the
   * top rather than from wherever focus happened to be.
   */
  let hasAutoFocused = false;

  watch(
    element,
    (current) => {
      if (!current || hasAutoFocused) return;

      hasAutoFocused = true;

      const autoFocus = toValue(props.autoFocus);

      if (!autoFocus) return;

      // One tick behind the element, because the items register themselves post-flush too and
      // this one is queued first — asking for the first key any sooner asks an empty collection.
      // Still within the same task, so nothing is painted with focus in the wrong place.
      void nextTick(() => {
        let focusedKey: CollectionKey | null = null;

        if (autoFocus === "first") focusedKey = keyboard.getFirstKey();
        if (autoFocus === "last") focusedKey = keyboard.getLastKey();

        for (const key of selection.selectedKeys.value) {
          if (selection.canSelectItem(key)) {
            focusedKey = key;
            break;
          }
        }

        selection.setFocused(true);

        if (focusedKey == null) current.focus({preventScroll: true});
        else keyboard.focusKey(focusedKey);
      });
    },
    {flush: "post"},
  );

  return {
    collectionId,
    element,
    isEmpty: computed(() => collection.size.value === 0),
    menuAttributes: computed(() => ({
      "aria-labelledby": toValue(props.labelledBy),
      "data-collection": collectionId.value,
      "data-empty": collection.size.value === 0 ? "true" : undefined,
      id: menuId.value,
      role: "menu",
      tabindex: keyboard.collectionTabIndex.value,
    })),
    menuId,
    onFocusin: keyboard.onFocusin,
    onFocusout: keyboard.onFocusout,
    // Typeahead runs first on both phases: it has to claim a Space that is extending a search
    // before the focused item treats the same key as an activation.
    onKeydown: (event) => {
      typeahead.onKeydown(event);
      if (!event.defaultPrevented) keyboard.onKeydown(event);
    },
    onKeydownCapture: typeahead.onKeydownCapture,
    selectionMode: selection.selectionMode,
  };
};
