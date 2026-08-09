import type {CollectionKey, UseCollectionReturn} from "./use-collection";
import type {UseSelectionManagerReturn} from "./use-selection-manager";
import type {Rect, Size} from "../utils/virtualizer-geometry";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, nextTick, toValue, watch} from "vue";

import {focusableIn, isScrollable} from "../utils/focus";

export type ListOrientation = "horizontal" | "vertical";

/**
 * Geometry from a layout, for a collection that does not have every item in the DOM.
 *
 * Paging needs to know where an item sits and how tall the viewport is. Measuring elements can
 * only answer for the items that rendered, which in a virtualized collection is a screenful.
 */
export interface ListKeyboardLayoutDelegate {
  getItemRect: (key: CollectionKey) => Rect | null;
  getVisibleRect: () => Rect;
  getContentSize: () => Size;
}

export interface UseListKeyboardOptions {
  collection: UseCollectionReturn;
  /** Where the items are, when a layout knows better than the DOM does. */
  layout?: MaybeRefOrGetter<ListKeyboardLayoutDelegate | null | undefined>;
  selection: UseSelectionManagerReturn;
  /** The element carrying `role="listbox"` or `role="grid"`. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** @default "vertical" */
  orientation?: MaybeRefOrGetter<ListOrientation | undefined>;
  /** Whether arrow keys wrap at the ends. Menus and tag groups do; listboxes do not. */
  shouldFocusWrap?: MaybeRefOrGetter<boolean | undefined>;
  disallowSelectAll?: MaybeRefOrGetter<boolean | undefined>;
  disallowTypeAhead?: MaybeRefOrGetter<boolean | undefined>;
  /** @default "clearSelection" */
  escapeKeyBehavior?: MaybeRefOrGetter<"clearSelection" | "none" | undefined>;
  /** Called when an item is activated rather than selected. */
  onAction?: (key: CollectionKey) => void;
  /**
   * Leaves Enter and Space to the items.
   *
   * A menu needs this: its sections may each hold their own selection, so only the item knows
   * which one to act on, and answering here would always act on the collection's.
   */
  disallowActivation?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseListKeyboardReturn {
  /** `0` while nothing inside is focused, `-1` afterwards. */
  collectionTabIndex: ComputedRef<number>;
  itemTabIndex: (key: CollectionKey) => number | undefined;
  onKeydown: (event: KeyboardEvent) => void;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  getKeyBelow: (key: CollectionKey) => CollectionKey | null;
  getKeyAbove: (key: CollectionKey) => CollectionKey | null;
  getKeyLeftOf: (key: CollectionKey) => CollectionKey | null;
  getKeyRightOf: (key: CollectionKey) => CollectionKey | null;
  getFirstKey: () => CollectionKey | null;
  getLastKey: () => CollectionKey | null;
  getKeyPageAbove: (key: CollectionKey) => CollectionKey | null;
  getKeyPageBelow: (key: CollectionKey) => CollectionKey | null;
  getKeyForSearch: (search: string, fromKey?: CollectionKey | null) => CollectionKey | null;
  /** Move focus to a key. `scroll` is passed only from keyboard paths. */
  focusKey: (key: CollectionKey | null, options?: {scroll?: boolean}) => void;
}

/**
 * Keyboard navigation and focus management for a collection, ported from React Aria's
 * `useSelectableCollection` and `ListKeyboardDelegate`.
 *
 * Focus is real DOM focus with a roving tabindex, not `aria-activedescendant`: exactly one
 * item is tabbable at a time and the collection itself is the tab stop until something inside
 * has been focused. Arrow keys move focus without changing the selection, because
 * `selectOnFocus` is only true for `selectionBehavior: "replace"`, which neither a listbox nor
 * a tag group uses.
 */
export const useListKeyboard = (options: UseListKeyboardOptions): UseListKeyboardReturn => {
  const {collection, selection} = options;

  const orientation = computed(() => toValue(options.orientation) ?? "vertical");
  const shouldFocusWrap = computed(() => toValue(options.shouldFocusWrap) ?? false);
  const escapeKeyBehavior = computed(() => toValue(options.escapeKeyBehavior) ?? "clearSelection");

  const getElement = () => toValue(options.element) ?? null;

  // Matched to the collator React Aria uses, so a search behaves the same way: case- and
  // accent-insensitive, and tuned for prefix searching rather than sorting.
  const collator = new Intl.Collator(undefined, {sensitivity: "base", usage: "search"});

  const isDirectionReversed = () => {
    const element = getElement();

    // RTL mirrors the inline axis only, so a vertical list reads top to bottom either way.
    return (
      orientation.value === "horizontal" && element && getComputedStyle(element).direction === "rtl"
    );
  };

  /** Walk `step` from `key`, skipping items focus cannot land on. */
  const walk = (key: CollectionKey | null, step: -1 | 1): CollectionKey | null => {
    let next = key;

    while (next != null) {
      if (!selection.isDisabled(next)) return next;
      next = step === 1 ? collection.getKeyAfter(next) : collection.getKeyBefore(next);
    }

    return null;
  };

  const getFirstKey = () => walk(collection.getFirstKey(), 1);
  const getLastKey = () => walk(collection.getLastKey(), -1);

  const getNextKey = (key: CollectionKey) => {
    const next = walk(collection.getKeyAfter(key), 1);

    return next ?? (shouldFocusWrap.value ? getFirstKey() : null);
  };

  const getPreviousKey = (key: CollectionKey) => {
    const previous = walk(collection.getKeyBefore(key), -1);

    return previous ?? (shouldFocusWrap.value ? getLastKey() : null);
  };

  const getKeyBelow = (key: CollectionKey) => getNextKey(key);
  const getKeyAbove = (key: CollectionKey) => getPreviousKey(key);

  // A vertical stack deliberately does not answer these: React Aria deletes the methods
  // outright so the horizontal arrows stay free for the page's own scrolling.
  const getKeyRightOf = (key: CollectionKey) => {
    if (orientation.value !== "horizontal") return null;

    return isDirectionReversed() ? getPreviousKey(key) : getNextKey(key);
  };

  const getKeyLeftOf = (key: CollectionKey) => {
    if (orientation.value !== "horizontal") return null;

    return isDirectionReversed() ? getNextKey(key) : getPreviousKey(key);
  };

  const rectOf = (key: CollectionKey) => collection.getElement(key)?.getBoundingClientRect();

  /**
   * Paging by the layout's own geometry, ported from React Aria's `ListKeyboardDelegate`.
   *
   * Walks item by item until one is a viewport away from where it started, which is the same
   * answer measuring elements would give — except it can also answer for the items that are not
   * in the DOM.
   */
  const pageStepByLayout = (
    layout: ListKeyboardLayoutDelegate,
    key: CollectionKey,
    step: -1 | 1,
  ): CollectionKey | null => {
    const element = getElement();
    let itemRect = layout.getItemRect(key);

    if (!itemRect) return null;
    if (element && !isScrollable(element)) return step === 1 ? getLastKey() : getFirstKey();

    const visibleRect = layout.getVisibleRect();
    let next: CollectionKey | null = key;

    if (step === 1) {
      const pageY = Math.min(
        layout.getContentSize().height,
        itemRect.y - itemRect.height + visibleRect.height,
      );

      while (itemRect && itemRect.y < pageY && next != null) {
        next = getKeyBelow(next);
        itemRect = next == null ? null : layout.getItemRect(next);
      }

      return next ?? getLastKey();
    }

    const pageY = Math.max(0, itemRect.y + itemRect.height - visibleRect.height);

    while (itemRect && itemRect.y > pageY && next != null) {
      next = getKeyAbove(next);
      itemRect = next == null ? null : layout.getItemRect(next);
    }

    return next ?? getFirstKey();
  };

  const pageStep = (key: CollectionKey, step: -1 | 1): CollectionKey | null => {
    const layout = toValue(options.layout);

    if (layout) return pageStepByLayout(layout, key, step);

    const element = getElement();

    // No scroll means no page to move by, so the ends are the honest answer. This is also
    // what makes the behaviour deterministic where layout is not measured at all.
    if (!element || !isScrollable(element)) return step === 1 ? getLastKey() : getFirstKey();

    const startRect = rectOf(key);

    if (!startRect) return null;

    const page = element.clientHeight;
    let next: CollectionKey | null = key;
    let candidate: CollectionKey | null = key;

    while (candidate != null) {
      candidate = step === 1 ? getKeyBelow(candidate) : getKeyAbove(candidate);
      if (candidate == null) break;

      const rect = rectOf(candidate);

      if (!rect) break;
      if (Math.abs(rect.top - startRect.top) > page) {
        next = candidate;
        break;
      }

      next = candidate;
    }

    return next ?? (step === 1 ? getLastKey() : getFirstKey());
  };

  const getKeyForSearch = (search: string, fromKey?: CollectionKey | null) => {
    // Starts *at* `fromKey` rather than after it, matching React Aria: a longer search has to
    // be able to keep matching the item it is already on.
    let key = fromKey ?? getFirstKey();

    while (key != null) {
      const item = collection.getItem(key);

      if (!item) return null;

      const text = item.textValue();

      if (text && collator.compare(text.slice(0, search.length), search) === 0) return key;

      key = walk(collection.getKeyAfter(key), 1);
    }

    return null;
  };

  const land = (element: HTMLElement, scroll?: boolean) => {
    element.focus();
    // Guarded because jsdom does not implement it, and because only keyboard paths ask for it.
    if (scroll && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({block: "nearest"});
    }
  };

  const focusKey = (key: CollectionKey | null, focusOptions: {scroll?: boolean} = {}) => {
    // Claimed before focus moves, so the focus event that follows knows the collection already
    // decided where it goes.
    selection.setFocused(true);
    selection.setFocusedKey(key);

    if (key == null) return;

    const element = collection.getElement(key);

    if (element) {
      land(element, focusOptions.scroll);

      return;
    }

    /**
     * Nothing to focus yet, which happens in a virtualized collection when the key is outside
     * the rendered window. Setting the focused key above is what brings it into the DOM — a
     * collection persists its focused key wherever it sits — so the element exists one tick
     * later, and focus lands then.
     */
    nextTick(() => {
      const rendered = collection.getElement(key);

      if (rendered) land(rendered, focusOptions.scroll);
    });
  };

  /** Where focus should land when it first enters the collection. */
  const entryKey = (fromLater: boolean) => {
    if (fromLater) return selection.lastSelectedKey.value ?? getLastKey();

    return selection.firstSelectedKey.value ?? getFirstKey();
  };

  const onKeydown = (event: KeyboardEvent) => {
    const element = getElement();
    const target = event.target;

    if (!element || !(target instanceof Node) || !element.contains(target)) return;

    const focused = selection.focusedKey.value;

    const move = (key: CollectionKey | null) => {
      if (key == null) return false;

      focusKey(key, {scroll: true});
      event.preventDefault();
      event.stopPropagation();

      return true;
    };

    switch (event.key) {
      case "ArrowDown": {
        move(focused == null ? getFirstKey() : getKeyBelow(focused));

        return;
      }
      case "ArrowUp": {
        move(focused == null ? getLastKey() : getKeyAbove(focused));

        return;
      }
      case "ArrowRight": {
        if (orientation.value !== "horizontal") return;
        move(focused == null ? getFirstKey() : getKeyRightOf(focused));

        return;
      }
      case "ArrowLeft": {
        if (orientation.value !== "horizontal") return;
        move(focused == null ? getLastKey() : getKeyLeftOf(focused));

        return;
      }
      case "Home": {
        // Shift+Home from nowhere would extend a selection that has no anchor.
        if (focused == null && event.shiftKey) return;
        move(getFirstKey());

        return;
      }
      case "End": {
        if (focused == null && event.shiftKey) return;
        move(getLastKey());

        return;
      }
      case "PageUp": {
        move(focused == null ? getFirstKey() : pageStep(focused, -1));

        return;
      }
      case "PageDown": {
        move(focused == null ? getLastKey() : pageStep(focused, 1));

        return;
      }
      case "a": {
        if (!(event.ctrlKey || event.metaKey) || toValue(options.disallowSelectAll)) return;
        if (selection.selectionMode.value !== "multiple") return;

        selection.selectAll();
        event.preventDefault();
        event.stopPropagation();

        return;
      }
      case "Escape": {
        if (escapeKeyBehavior.value !== "clearSelection" || selection.isEmpty.value) return;

        // Only claimed when it actually cleared something, so an Escape that does nothing here
        // still reaches an enclosing overlay that wants to close.
        selection.clearSelection();
        event.preventDefault();
        event.stopPropagation();

        return;
      }
      case "Tab": {
        // Park focus at the far end and hand back to the browser, so one Tab leaves the whole
        // collection rather than stepping through every item.
        const focusable = focusableIn(element);
        const edge = event.shiftKey ? element : focusable.at(-1);

        edge?.focus();

        return;
      }
      case "Enter": {
        if (focused == null || toValue(options.disallowActivation)) return;

        options.onAction?.(focused);
        event.preventDefault();

        return;
      }
      case " ": {
        if (focused == null || toValue(options.disallowActivation)) return;

        if (selection.selectionMode.value === "none") options.onAction?.(focused);
        else selection.select(focused, {isShiftPressed: event.shiftKey});

        event.preventDefault();

        return;
      }
      default:
        return;
    }
  };

  const onFocusin = (event: FocusEvent) => {
    const element = getElement();
    const target = event.target;
    const isInside = element && target instanceof Node && element.contains(target);

    // Already ours: whatever moved focus has decided where it goes, and picking an entry key here
    // would overwrite it. This is what keeps a menu opened by pointer focused on the menu itself
    // rather than jumping to its first item.
    if (selection.isFocused.value) {
      // A focus event that bubbled from a teleported overlay is not focus on this collection.
      if (!isInside) selection.setFocused(false);

      return;
    }

    if (!isInside) return;

    selection.setFocused(true);

    if (selection.focusedKey.value != null) return;

    const from = event.relatedTarget;

    // Focus arriving from later in the document means Shift+Tab, which should land at the end.
    const fromLater = Boolean(
      element &&
      from instanceof Node &&
      element.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING,
    );

    selection.setFocusedKey(entryKey(fromLater));
  };

  const onFocusout = (event: FocusEvent) => {
    const element = getElement();
    const next = event.relatedTarget;

    // Focus moving between items is not a departure.
    if (element && next instanceof Node && element.contains(next)) return;

    selection.setFocused(false);
  };

  // Real focus follows the focused key, so a key set programmatically still moves the caret.
  watch(
    () => selection.focusedKey.value,
    (key) => {
      if (key == null || !selection.isFocused.value) return;

      collection.getElement(key)?.focus();
    },
    {flush: "post"},
  );

  return {
    collectionTabIndex: computed(() => (selection.focusedKey.value == null ? 0 : -1)),
    focusKey,
    getFirstKey,
    getKeyAbove,
    getKeyBelow,
    getKeyForSearch,
    getKeyLeftOf,
    getKeyPageAbove: (key) => pageStep(key, -1),
    getKeyPageBelow: (key) => pageStep(key, 1),
    getKeyRightOf,
    getLastKey,
    itemTabIndex: (key) => {
      // A disabled item carries no tabindex at all, rather than -1, matching React Aria.
      if (selection.isDisabled(key)) return undefined;

      return key === selection.focusedKey.value ? 0 : -1;
    },
    onFocusin,
    onFocusout,
    onKeydown,
  };
};
