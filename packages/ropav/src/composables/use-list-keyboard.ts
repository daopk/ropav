import type {Rect, Size} from "../utils/virtualizer-geometry";
import type {CollectionKey, UseCollectionReturn} from "./use-collection";
import type {UseSelectionManagerReturn} from "./use-selection-manager";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, nextTick, toValue, watch} from "vue";

import {focusableIn, isScrollable} from "../utils/focus";
import {isAppleDevice} from "../utils/platform";

export type ListOrientation = "horizontal" | "vertical";

/**
 * How the items are arranged, which decides how many axes the arrow keys drive.
 *
 * A `"stack"` runs along one axis, so the cross-axis arrows stay free for the page's own
 * scrolling. A `"grid"` wraps, so both axes navigate — and the cross-axis answer has to be found
 * by geometry rather than by counting, because a collection is a flat list either way.
 */
export type ListKeyboardLayout = "grid" | "stack";

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
  layoutDelegate?: MaybeRefOrGetter<ListKeyboardLayoutDelegate | null | undefined>;
  /** @default "stack" */
  layout?: MaybeRefOrGetter<ListKeyboardLayout | undefined>;
  selection: UseSelectionManagerReturn;
  /** The element carrying `role="listbox"` or `role="grid"`. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** @default "vertical" */
  orientation?: MaybeRefOrGetter<ListOrientation | undefined>;
  /** Whether arrow keys wrap at the ends. Menus and tag groups do; listboxes do not. */
  shouldFocusWrap?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Whether moving focus with the keyboard also replaces the selection.
   *
   * Defaults to whether the collection's selection behaviour is to replace, which is the case
   * where moving focus and choosing are the same gesture. A tab list overrides it: its behaviour
   * is to toggle, and whether the arrows choose is the caller's own question about how
   * activation works rather than the manager's about what a press means.
   *
   * Held off while the non-contiguous modifier is down, so focus can move past an item without
   * taking the selection along. A jump to either end is deliberately not held off.
   */
  selectOnFocus?: MaybeRefOrGetter<boolean | undefined>;
  disallowSelectAll?: MaybeRefOrGetter<boolean | undefined>;
  /** @default "clearSelection" */
  escapeKeyBehavior?: MaybeRefOrGetter<"clearSelection" | "none" | undefined>;
  /** Called when an item is activated rather than selected. */
  onAction?: (key: CollectionKey) => void;
  /**
   * Whether focus over the collection is nominal rather than real.
   *
   * A control *outside* the collection keeps real DOM focus — a text input, typically — and
   * points `aria-activedescendant` at whichever item the arrows landed on. Nothing inside the
   * collection is focused or tabbable then, so the roving tab stop, the focus tracking and the
   * `.focus()` calls all have to stand down: focusing an item would take the caret out of the
   * input, which is the one place it has to stay.
   */
  shouldUseVirtualFocus?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * The collection element's id, which item ids are derived from.
   *
   * Only read to build {@link UseListKeyboardReturn.focusedNodeId}, which is the id an outside
   * control has to name — so a collection with real focus has no use for it.
   */
  listId?: MaybeRefOrGetter<string | undefined>;
  /**
   * Leaves Enter and Space to the items.
   *
   * A menu needs this: its sections may each hold their own selection, so only the item knows
   * which one to act on, and answering here would always act on the collection's.
   */
  disallowActivation?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseListKeyboardReturn {
  /** `0` while nothing inside is focused, `-1` afterwards. `undefined` under virtual focus. */
  collectionTabIndex: ComputedRef<number | undefined>;
  itemTabIndex: (key: CollectionKey) => number | undefined;
  /**
   * The DOM id of the focused item, for a control outside the collection to point
   * `aria-activedescendant` at. Only ever set under virtual focus.
   */
  focusedNodeId: ComputedRef<string | undefined>;
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
 * Whether the modifier that means "move focus without touching the selection" is down.
 *
 * Ported from React Aria's `isNonContiguousSelectionModifier`
 * (`react-aria/src/selection/utils.ts`, react-aria 3.51.0). Ctrl plus an arrow already means
 * something system-wide on Apple platforms, so Alt stands in there; Alt plus Space means
 * something on Windows and Ubuntu, so Ctrl stands in everywhere else.
 */
const isNonContiguousSelectionModifier = (event: KeyboardEvent): boolean =>
  isAppleDevice() ? event.altKey : event.ctrlKey;

/**
 * Keyboard navigation and focus management for a collection, ported from React Aria's
 * `useSelectableCollection` and `ListKeyboardDelegate`
 * (`react-aria/src/selection/`, react-aria 3.51.0).
 *
 * Focus is real DOM focus with a roving tabindex, not `aria-activedescendant`: exactly one
 * item is tabbable at a time and the collection itself is the tab stop until something inside
 * has been focused.
 *
 * Whether moving focus also chooses is `selectOnFocus`, which defaults to the collection's
 * selection behaviour being to replace. A listbox and a tag group toggle, so their arrows only
 * move focus; a tab list opts in by hand, because for it the question is whether activation is
 * automatic rather than what a press means.
 *
 * `shouldUseVirtualFocus` inverts that, for a collection driven from a control beside it: the
 * caret stays where it is, the focused key is published as
 * {@link UseListKeyboardReturn.focusedNodeId} for that control to name, and nothing inside the
 * collection is focused or tabbable.
 */
export const useListKeyboard = (options: UseListKeyboardOptions): UseListKeyboardReturn => {
  const {collection, selection} = options;

  const orientation = computed(() => toValue(options.orientation) ?? "vertical");
  const layout = computed(() => toValue(options.layout) ?? "stack");
  const shouldFocusWrap = computed(() => toValue(options.shouldFocusWrap) ?? false);
  const escapeKeyBehavior = computed(() => toValue(options.escapeKeyBehavior) ?? "clearSelection");
  const isVirtual = computed(() => Boolean(toValue(options.shouldUseVirtualFocus)));
  const selectOnFocus = computed(
    () => toValue(options.selectOnFocus) ?? selection.selectionBehavior.value === "replace",
  );

  const getElement = () => toValue(options.element) ?? null;

  // Matched to the collator React Aria uses, so a search behaves the same way: case- and
  // accent-insensitive, and tuned for prefix searching rather than sorting.
  const collator = new Intl.Collator(undefined, {sensitivity: "base", usage: "search"});

  /**
   * A vertical stack deliberately does not answer the inline arrows: React Aria deletes the
   * methods outright so they stay free for the page's own scrolling. A grid navigates both axes,
   * so it answers whatever its orientation is.
   */
  const answersInlineAxis = () => layout.value === "grid" || orientation.value === "horizontal";

  const isDirectionReversed = () => {
    const element = getElement();

    // RTL mirrors the inline axis only, so a vertical stack reads top to bottom either way — but
    // a grid navigates the inline axis whichever way it is oriented.
    return Boolean(answersInlineAxis() && element && getComputedStyle(element).direction === "rtl");
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

  const rectOf = (key: CollectionKey) => collection.getElement(key)?.getBoundingClientRect();

  /**
   * Where an item sits, asking the layout first for the same reason paging does: in a
   * virtualized collection the DOM only knows about a screenful.
   *
   * Only `x` and `y` are read, so a `DOMRect` and a layout's `Rect` are interchangeable here.
   */
  const positionOf = (key: CollectionKey): {x: number; y: number} | null => {
    const delegate = toValue(options.layoutDelegate);

    return delegate ? delegate.getItemRect(key) : (rectOf(key) ?? null);
  };

  /**
   * Walk with `nextKey` until an item lands somewhere `shouldSkip` accepts, ported from React
   * Aria's `ListKeyboardDelegate.findKey`.
   *
   * `from` is the rect of the item the walk *started* on and never advances, so "the item below"
   * means below the original — not below whatever was stepped over on the way.
   */
  const findKey = (
    key: CollectionKey,
    nextKey: (key: CollectionKey) => CollectionKey | null,
    shouldSkip: (from: {x: number; y: number}, item: {x: number; y: number}) => boolean,
  ): CollectionKey | null => {
    const from = positionOf(key);

    if (!from) return null;

    let candidate: CollectionKey | null = key;
    let position: {x: number; y: number} | null = from;

    do {
      candidate = nextKey(candidate);
      if (candidate == null) break;
      position = positionOf(candidate);
    } while (position && shouldSkip(from, position));

    return candidate;
  };

  // Skip while the candidate shares a row with where we started, or sits in a different column:
  // what is left is the item directly across the row boundary in the same column.
  const isSameRow = (from: {x: number; y: number}, item: {x: number; y: number}) =>
    from.y === item.y || from.x !== item.x;

  const isSameColumn = (from: {x: number; y: number}, item: {x: number; y: number}) =>
    from.x === item.x || from.y !== item.y;

  const isGridAcross = () => layout.value === "grid" && orientation.value === "vertical";

  const getKeyBelow = (key: CollectionKey) =>
    isGridAcross() ? findKey(key, getNextKey, isSameRow) : getNextKey(key);

  const getKeyAbove = (key: CollectionKey) =>
    isGridAcross() ? findKey(key, getPreviousKey, isSameRow) : getPreviousKey(key);

  const getKeyRightOf = (key: CollectionKey) => {
    if (!answersInlineAxis()) return null;

    const step = isDirectionReversed() ? getPreviousKey : getNextKey;

    // A horizontal grid wraps along the block axis, so the item to the right of the last one in
    // a column is found by geometry, the same way a vertical grid finds the one below.
    if (layout.value === "grid" && orientation.value === "horizontal") {
      return findKey(key, step, isSameColumn);
    }

    return step(key);
  };

  const getKeyLeftOf = (key: CollectionKey) => {
    if (!answersInlineAxis()) return null;

    const step = isDirectionReversed() ? getNextKey : getPreviousKey;

    if (layout.value === "grid" && orientation.value === "horizontal") {
      return findKey(key, step, isSameColumn);
    }

    return step(key);
  };

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
    const delegate = toValue(options.layoutDelegate);

    if (delegate) return pageStepByLayout(delegate, key, step);

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
    // Under virtual focus the caret belongs to a control outside the collection, so the item is
    // only scrolled to. Focusing it here is the one thing that would take the caret away.
    if (!isVirtual.value) element.focus();
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

    // Under virtual focus the keys arrive from a control that is not inside the collection at
    // all — that is the whole arrangement — so only the collection's own existence is required.
    if (!element) return;
    if (!isVirtual.value && (!(target instanceof Node) || !element.contains(target))) return;

    const focused = selection.focusedKey.value;

    /**
     * `respectsModifier` is false only for a jump to either end: React Aria's `home` and `end`
     * replace the selection under `selectOnFocus` without consulting the modifier, where its
     * `navigateToKey` — the arrows and the paging keys — does consult it.
     */
    const move = (key: CollectionKey | null, respectsModifier = true) => {
      if (key == null) return false;

      // Focus first, so the focus event that follows finds the key already claimed, then the
      // selection — the order React Aria's `navigateToKey` uses.
      focusKey(key, {scroll: true});

      if (selectOnFocus.value && !(respectsModifier && isNonContiguousSelectionModifier(event))) {
        selection.replaceSelection(key);
      }

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
        if (!answersInlineAxis()) return;
        move(focused == null ? getFirstKey() : getKeyRightOf(focused));

        return;
      }
      case "ArrowLeft": {
        if (!answersInlineAxis()) return;
        move(focused == null ? getLastKey() : getKeyLeftOf(focused));

        return;
      }
      case "Home": {
        // Shift+Home from nowhere would extend a selection that has no anchor.
        if (focused == null && event.shiftKey) return;
        move(getFirstKey(), false);

        return;
      }
      case "End": {
        if (focused == null && event.shiftKey) return;
        move(getLastKey(), false);

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
        // Nothing inside is a tab stop under virtual focus, so there is nothing to park and the
        // key belongs to whatever holds real focus.
        if (isVirtual.value) return;

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
    // Real focus never enters the collection under virtual focus, so any event reaching here
    // belongs to something else and following it would move the focused key for no reason.
    if (isVirtual.value) return;

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

    const entry = entryKey(fromLater);

    selection.setFocusedKey(entry);

    // Entering a collection that chooses on focus chooses. Guarded on the key not already being
    // the selection, which is what keeps entering a tab list from reporting a change nobody made.
    if (entry != null && selectOnFocus.value && !selection.isSelected(entry)) {
      selection.replaceSelection(entry);
    }
  };

  const onFocusout = (event: FocusEvent) => {
    if (isVirtual.value) return;

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
      if (key == null || isVirtual.value || !selection.isFocused.value) return;

      collection.getElement(key)?.focus();
    },
    {flush: "post"},
  );

  return {
    collectionTabIndex: computed(() => {
      if (isVirtual.value) return undefined;

      return selection.focusedKey.value == null ? 0 : -1;
    }),
    focusKey,
    /*
     * Built from the same parts an item builds its own id from, rather than read back off the
     * element: the focused item may not be in the DOM yet in a virtualized collection, and the
     * control naming it has to be able to say so on the same tick the key moved.
     */
    focusedNodeId: computed(() => {
      const key = selection.focusedKey.value;
      const listId = toValue(options.listId);

      if (key == null || !isVirtual.value || !listId) return undefined;

      return `${listId}-option-${key}`;
    }),
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
      // A disabled item carries no tabindex at all, rather than -1, matching React Aria. Neither
      // does any item under virtual focus: the collection is not in the tab order at all.
      if (isVirtual.value || selection.isDisabled(key)) return undefined;

      return key === selection.focusedKey.value ? 0 : -1;
    },
    onFocusin,
    onFocusout,
    onKeydown,
  };
};
