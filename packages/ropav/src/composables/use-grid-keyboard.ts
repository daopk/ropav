import type { CollectionKey } from "./use-collection";
import type { ListKeyboardLayoutDelegate } from "./use-list-keyboard";
import type { UseSelectionManagerReturn } from "./use-selection-manager";
import type { UseTableCollectionReturn } from "./use-table-collection";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, nextTick, shallowRef, toValue, watch } from "vue";

import { focusableIn, getScrollParent, isScrollable } from "../utils/focus";

import { isTableCellControl } from "./use-table-collection";

/**
 * Where focus sits in a grid.
 *
 * `rowKey: null` means the header row, `columnKey: null` means the row itself rather than one of
 * its cells, and both `null` means focus is not inside the grid at all.
 *
 * React Aria carries the same three states in a single key, because its collection holds rows and
 * cells in one tree. Here the selection manager runs on the **rows** alone — which is what lets a
 * listbox's manager be reused unchanged — so the two axes are held apart, and only `rowKey` is
 * ever handed to the manager. Handing it a cell key instead would silently break range selection:
 * `extendSelection` would look up a key the row collection does not have.
 */
export interface GridFocusTarget {
  rowKey: CollectionKey | null;
  columnKey: CollectionKey | null;
}

/** What the grid needs to know to open and close rows from the horizontal arrows. */
export interface GridExpansion {
  isTree: () => boolean;
  isExpanded: (rowKey: CollectionKey) => boolean;
  hasChildRows: (rowKey: CollectionKey) => boolean;
  parentKey: (rowKey: CollectionKey) => CollectionKey | null;
  toggle: (rowKey: CollectionKey) => void;
}

export interface UseGridKeyboardOptions {
  collection: UseTableCollectionReturn;
  selection: UseSelectionManagerReturn;
  /** The element carrying `role="grid"`. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  disallowSelectAll?: MaybeRefOrGetter<boolean | undefined>;
  /** Hands every key back, for as long as something else owns them — a column being resized. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Supplied by a tree grid, where the horizontal arrows expand and collapse rows. */
  expansion?: GridExpansion;
  /**
   * Where the rows are, when a layout knows better than the DOM does.
   *
   * The same delegate a virtualized listbox pages by: measuring elements can only answer for the
   * rows that rendered, which in a virtualized table is a screenful.
   */
  layout?: MaybeRefOrGetter<ListKeyboardLayoutDelegate | null | undefined>;
  /** @default "clearSelection" */
  escapeKeyBehavior?: MaybeRefOrGetter<"clearSelection" | "none" | undefined>;
}

export interface UseGridKeyboardReturn {
  focusedCell: ComputedRef<GridFocusTarget>;
  /** `0` while nothing inside is focused, `-1` afterwards. */
  collectionTabIndex: ComputedRef<number>;
  columnTabIndex: (columnKey: CollectionKey) => number;
  rowTabIndex: (rowKey: CollectionKey) => number | undefined;
  cellTabIndex: (rowKey: CollectionKey, columnKey: CollectionKey | null) => number;
  /** Move focus to a target, and move real DOM focus with it. */
  focusCell: (target: GridFocusTarget, options?: { scroll?: boolean }) => void;
  /** Record focus that arrived on its own, from a click or from assistive technology. */
  claimFocus: (target: GridFocusTarget) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  getKeyForSearch: (search: string, fromKey?: CollectionKey | null) => CollectionKey | null;
}

const NO_FOCUS: GridFocusTarget = { columnKey: null, rowKey: null };

/**
 * Two-dimensional keyboard navigation for a grid, ported from React Aria's
 * `GridKeyboardDelegate`, `TableKeyboardDelegate` and `useSelectableCollection`.
 *
 * Focus is real DOM focus with a roving tab stop, and it moves over three kinds of thing: the
 * column headers, a row as a whole, and the cells of a row. The rules that are easy to get wrong,
 * all taken from the delegates rather than guessed:
 *
 * - Up from the first row lands on the **column header** above it, and down from a column header
 *   lands on the cell under it. The header is part of the same two-dimensional walk.
 * - Left and right **wrap** among the column headers, but not among the cells of a row: running
 *   off either end of a row lands on the row itself.
 * - `Home` and `End` stay inside the current row; with a modifier they jump to the whole grid's
 *   first or last position.
 */
export const useGridKeyboard = (options: UseGridKeyboardOptions): UseGridKeyboardReturn => {
  const { collection, selection } = options;

  const escapeKeyBehavior = computed(() => toValue(options.escapeKeyBehavior) ?? "clearSelection");

  const focused = shallowRef<GridFocusTarget>(NO_FOCUS);

  const getElement = () => toValue(options.element) ?? null;

  // Matched to the collator React Aria uses, so a search behaves the same way: case- and
  // accent-insensitive, and tuned for prefix searching rather than sorting.
  const collator = new Intl.Collator(undefined, { sensitivity: "base", usage: "search" });

  const isReversed = () => {
    const element = getElement();

    return Boolean(element) && getComputedStyle(element!).direction === "rtl";
  };

  /* ---------------------------------------------------------------------------------------------
   * Resolving a target to an element
   * -------------------------------------------------------------------------------------------*/
  const columnIndex = (columnKey: CollectionKey) => collection.columns.indexOf(columnKey);

  const elementFor = (target: GridFocusTarget): HTMLElement | null => {
    const { columnKey, rowKey } = target;

    if (rowKey == null) {
      return columnKey == null ? null : (collection.columns.getItem(columnKey)?.element() ?? null);
    }

    const row = collection.rows.getElement(rowKey);

    if (!row) return null;
    if (columnKey == null) return row;

    const index = columnIndex(columnKey);

    // The nth cell of a row belongs to the nth column, which is the same pairing every other part
    // of the table is built on — but the cell is found by the index it renders rather than by its
    // position among the row's children, because a virtualized row holds each of its cells inside
    // a wrapper of its own and so has none of them as a direct child.
    return index < 0
      ? null
      : row.querySelector<HTMLElement>(`[data-slot="table-cell"][data-column-index="${index}"]`);
  };

  /* ---------------------------------------------------------------------------------------------
   * Walking rows
   * -------------------------------------------------------------------------------------------*/
  /** Walk `step` from `key`, skipping rows focus cannot land on. */
  const walkRows = (key: CollectionKey | null, step: -1 | 1): CollectionKey | null => {
    let next = key;

    while (next != null) {
      if (!selection.isDisabled(next)) return next;
      next = step === 1 ? collection.rows.getKeyAfter(next) : collection.rows.getKeyBefore(next);
    }

    return null;
  };

  const firstRow = () => walkRows(collection.rows.getFirstKey(), 1);
  const lastRow = () => walkRows(collection.rows.getLastKey(), -1);
  const rowAfter = (key: CollectionKey) => walkRows(collection.rows.getKeyAfter(key), 1);
  const rowBefore = (key: CollectionKey) => walkRows(collection.rows.getKeyBefore(key), -1);

  /* ---------------------------------------------------------------------------------------------
   * Walking columns
   * -------------------------------------------------------------------------------------------*/
  const columnKeys = () => collection.columns.orderedKeys.value;
  const firstColumn = () => columnKeys()[0] ?? null;
  const lastColumn = () => columnKeys().at(-1) ?? null;

  const columnAt = (index: number) => collection.columns.keyAt(index);

  /** The column `step` along, or `null` at the end. */
  const columnStep = (columnKey: CollectionKey, step: -1 | 1) => {
    const index = columnIndex(columnKey);

    return index < 0 ? null : columnAt(index + step);
  };

  /** The column `step` along, wrapping round the ends — which is what the header row does. */
  const columnStepWrapping = (columnKey: CollectionKey, step: -1 | 1) => {
    const keys = columnKeys();
    const index = keys.indexOf(columnKey);

    if (index < 0) return null;

    return keys[(index + step + keys.length) % keys.length] ?? null;
  };

  /* ---------------------------------------------------------------------------------------------
   * The delegate
   * -------------------------------------------------------------------------------------------*/
  const keyBelow = (from: GridFocusTarget): GridFocusTarget | null => {
    const { columnKey, rowKey } = from;

    // From a column header, down goes to the cell it sits above.
    if (rowKey == null) {
      const row = firstRow();

      return row == null ? null : { columnKey, rowKey: row };
    }

    const next = rowAfter(rowKey);

    return next == null ? null : { columnKey, rowKey: next };
  };

  const keyAbove = (from: GridFocusTarget): GridFocusTarget | null => {
    const { columnKey, rowKey } = from;

    // A column header has nothing above it: the grid has a single header row.
    if (rowKey == null) return null;

    const previous = rowBefore(rowKey);

    if (previous != null) return { columnKey, rowKey: previous };

    // Leaving the first row goes up into the header — to the column above the cell that was
    // focused, or to the first column when the row itself was.
    return { columnKey: columnKey ?? firstColumn(), rowKey: null };
  };

  const keyAfter = (from: GridFocusTarget): GridFocusTarget | null => {
    const { columnKey, rowKey } = from;

    if (rowKey == null) {
      return columnKey == null
        ? null
        : { columnKey: columnStepWrapping(columnKey, 1), rowKey: null };
    }

    // From the row itself, forwards means into its first cell.
    if (columnKey == null) return { columnKey: firstColumn(), rowKey };

    const next = columnStep(columnKey, 1);

    // Running off the end of a row lands on the row, not on the next row's first cell.
    return { columnKey: next, rowKey };
  };

  const keyBefore = (from: GridFocusTarget): GridFocusTarget | null => {
    const { columnKey, rowKey } = from;

    if (rowKey == null) {
      return columnKey == null
        ? null
        : { columnKey: columnStepWrapping(columnKey, -1), rowKey: null };
    }

    if (columnKey == null) return { columnKey: lastColumn(), rowKey };

    return { columnKey: columnStep(columnKey, -1), rowKey };
  };

  const keyRightOf = (from: GridFocusTarget) => (isReversed() ? keyBefore(from) : keyAfter(from));
  const keyLeftOf = (from: GridFocusTarget) => (isReversed() ? keyAfter(from) : keyBefore(from));

  /** `global` jumps to the grid's own first position rather than the row's. */
  const firstKey = (from: GridFocusTarget, global: boolean): GridFocusTarget | null => {
    if (global) {
      const row = firstRow();

      if (row == null) return null;

      return { columnKey: from.columnKey == null ? null : firstColumn(), rowKey: row };
    }

    // Inside the header row, or inside a row's cells, home stays on that axis.
    if (from.columnKey != null) return { columnKey: firstColumn(), rowKey: from.rowKey };

    const row = firstRow();

    return row == null ? null : { columnKey: null, rowKey: row };
  };

  const lastKey = (from: GridFocusTarget, global: boolean): GridFocusTarget | null => {
    if (global) {
      const row = lastRow();

      if (row == null) return null;

      return { columnKey: from.columnKey == null ? null : lastColumn(), rowKey: row };
    }

    if (from.columnKey != null) return { columnKey: lastColumn(), rowKey: from.rowKey };

    const row = lastRow();

    return row == null ? null : { columnKey: null, rowKey: row };
  };

  /**
   * Paging by the layout's own geometry, ported from React Aria's `ListKeyboardDelegate`.
   *
   * Walks row by row until one is a viewport away from where it started, which is the same answer
   * measuring elements would give — except it can also answer for the rows that are not in the DOM.
   */
  const pageStepByLayout = (
    layout: ListKeyboardLayoutDelegate,
    from: GridFocusTarget,
    step: -1 | 1,
  ): GridFocusTarget | null => {
    if (from.rowKey == null) return step === 1 ? keyBelow(from) : null;

    const element = getElement();

    let rect = layout.getItemRect(from.rowKey);

    if (!rect) return null;
    if (element && !isScrollable(element)) {
      return step === 1 ? lastKey(from, true) : firstKey(from, true);
    }

    const visibleRect = layout.getVisibleRect();
    // A page stops one row short of a full viewport, so the row that was at the bottom edge is at
    // the top edge afterwards rather than scrolling straight past.
    const pageY =
      step === 1
        ? Math.min(layout.getContentSize().height, rect.y - rect.height + visibleRect.height)
        : Math.max(0, rect.y + rect.height - visibleRect.height);

    let target = from;

    while (rect && (step === 1 ? rect.y < pageY : rect.y > pageY)) {
      const next = step === 1 ? keyBelow(target) : keyAbove(target);

      if (!next || next.rowKey == null) break;

      target = next;
      rect = layout.getItemRect(next.rowKey);
    }

    return target === from ? null : target;
  };

  const pageStep = (from: GridFocusTarget, step: -1 | 1): GridFocusTarget | null => {
    const layout = toValue(options.layout);

    if (layout) return pageStepByLayout(layout, from, step);

    const container = getScrollParent(getElement());

    // No scroll means no page to move by, so the ends are the honest answer.
    if (!container) return step === 1 ? lastKey(from, true) : firstKey(from, true);
    if (from.rowKey == null) return step === 1 ? keyBelow(from) : null;

    const startRect = collection.rows.getElement(from.rowKey)?.getBoundingClientRect();

    if (!startRect) return null;

    const page = container.clientHeight;
    let target: GridFocusTarget = from;

    for (;;) {
      const next = step === 1 ? keyBelow(target) : keyAbove(target);

      if (!next || next.rowKey == null) break;

      const rect = collection.rows.getElement(next.rowKey)?.getBoundingClientRect();

      if (!rect) break;

      target = next;
      if (Math.abs(rect.top - startRect.top) > page) break;
    }

    return target === from ? null : target;
  };

  /**
   * Ported from `TableKeyboardDelegate`: a search matches a row's text, which is already derived
   * from its row header cells, and it **wraps** round the end of the collection — unlike a
   * listbox, where a search that runs off the end simply fails.
   */
  const getKeyForSearch = (search: string, fromKey?: CollectionKey | null) => {
    let key = fromKey ?? firstRow();
    let hasWrapped = false;

    while (key != null) {
      const text = collection.rows.getItem(key)?.textValue();

      if (text && collator.compare(text.slice(0, search.length), search) === 0) return key;

      key = rowAfter(key);

      if (key == null && !hasWrapped) {
        key = firstRow();
        hasWrapped = true;
        // Coming back round to where the search started means nothing matched.
        if (key === (fromKey ?? null)) return null;
      }
    }

    return null;
  };

  /* ---------------------------------------------------------------------------------------------
   * Moving focus
   * -------------------------------------------------------------------------------------------*/
  const claimFocus = (target: GridFocusTarget) => {
    focused.value = target;
    selection.setFocused(true);
    // Only the row key reaches the manager: it is the only one of the two axes the row
    // collection knows about.
    selection.setFocusedKey(target.rowKey);
  };

  const land = (element: HTMLElement, scroll: boolean | undefined) => {
    element.focus();
    // Guarded because jsdom does not implement it, and because only keyboard paths ask for it.
    if (scroll && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ block: "nearest" });
    }
  };

  /**
   * Move focus to a target, waiting a tick for it to exist if it does not yet.
   *
   * In a virtualized table a row outside the window has no element at all, and what puts it in the
   * DOM is claiming it as focused — so the element can only be reached after the claim has been
   * rendered. React Aria has no equivalent: its virtualizer returns early when the element is
   * missing, and nothing brings the row in.
   */
  const focusCell = (target: GridFocusTarget, focusOptions: { scroll?: boolean } = {}) => {
    claimFocus(target);

    const element = elementFor(target);

    if (element) {
      land(element, focusOptions.scroll);

      return;
    }

    void nextTick(() => {
      const rendered = elementFor(target);

      if (rendered) land(rendered, focusOptions.scroll);
    });
  };

  /* ---------------------------------------------------------------------------------------------
   * Keyboard
   * -------------------------------------------------------------------------------------------*/
  /**
   * Open or close the focused row, ported from react-aria's `useTableRow`.
   *
   * Which physical arrow does which is mirrored in RTL, and collapsing a row that is already
   * closed walks **up** to its parent instead — which is what makes a keyboard user able to leave
   * a branch without arrowing back through every child. Only a row itself answers these keys: with
   * focus on a cell the arrows belong to the cells.
   */
  const handleExpansion = (
    event: KeyboardEvent,
    from: GridFocusTarget,
    intent: "expand" | "collapse",
  ) => {
    const { expansion } = options;

    if (!expansion?.isTree()) return false;
    if (from.rowKey == null || from.columnKey != null) return false;

    const rowKey = from.rowKey;
    const isExpanded = expansion.isExpanded(rowKey);
    const hasChildRows = expansion.hasChildRows(rowKey);

    if (intent === "expand") {
      if (!hasChildRows || isExpanded) return false;

      expansion.toggle(rowKey);
      event.preventDefault();
      event.stopPropagation();

      return true;
    }

    if (hasChildRows && isExpanded) {
      expansion.toggle(rowKey);
      event.preventDefault();
      event.stopPropagation();

      return true;
    }

    const parentKey = expansion.parentKey(rowKey);

    if (parentKey == null) return false;

    focusCell({ columnKey: null, rowKey: parentKey }, { scroll: true });
    event.preventDefault();
    event.stopPropagation();

    return true;
  };

  const onKeydown = (event: KeyboardEvent) => {
    const element = getElement();
    const target = event.target;

    if (toValue(options.isDisabled)) return;
    if (!element || !(target instanceof Node) || !element.contains(target)) return;
    // A control inside a cell answers its own keys — a checkbox's Space, a button's Enter.
    if (isTableCellControl(target)) return;

    const from = focused.value;
    const isModified = event.ctrlKey || event.metaKey;

    const move = (next: GridFocusTarget | null) => {
      if (!next) return;

      focusCell(next, { scroll: true });
      event.preventDefault();
      event.stopPropagation();

      // Shift turns a move into a range, which only means something over rows.
      if (event.shiftKey && next.rowKey != null && selection.selectionMode.value === "multiple") {
        selection.extendSelection(next.rowKey);
      }
    };

    switch (event.key) {
      case "ArrowDown": {
        move(from.rowKey == null && from.columnKey == null ? firstKey(from, true) : keyBelow(from));

        return;
      }
      case "ArrowUp": {
        move(from.rowKey == null && from.columnKey == null ? lastKey(from, true) : keyAbove(from));

        return;
      }
      case "ArrowRight": {
        if (handleExpansion(event, from, isReversed() ? "collapse" : "expand")) return;
        move(keyRightOf(from));

        return;
      }
      case "ArrowLeft": {
        if (handleExpansion(event, from, isReversed() ? "expand" : "collapse")) return;
        move(keyLeftOf(from));

        return;
      }
      case "Home": {
        // Shift+Home from nowhere would extend a selection that has no anchor.
        if (from.rowKey == null && from.columnKey == null && event.shiftKey) return;
        move(firstKey(from, isModified));

        return;
      }
      case "End": {
        if (from.rowKey == null && from.columnKey == null && event.shiftKey) return;
        move(lastKey(from, isModified));

        return;
      }
      case "PageUp": {
        move(pageStep(from, -1));

        return;
      }
      case "PageDown": {
        move(pageStep(from, 1));

        return;
      }
      case "a": {
        if (!isModified || toValue(options.disallowSelectAll)) return;
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
      case " ": {
        if (from.rowKey == null || selection.selectionMode.value === "none") return;

        selection.select(from.rowKey, { isShiftPressed: event.shiftKey });
        event.preventDefault();

        return;
      }
      case "Tab": {
        // Park focus at the far end and hand back to the browser, so one Tab leaves the whole
        // grid rather than stepping through every cell.
        const focusable = focusableIn(element);
        const edge = event.shiftKey ? element : focusable.at(-1);

        edge?.focus();

        return;
      }
      default:
        return;
    }
  };

  /** Where focus should land when it first enters the grid. */
  const entryTarget = (fromLater: boolean): GridFocusTarget => {
    const selected = fromLater ? selection.lastSelectedKey.value : selection.firstSelectedKey.value;
    const row = selected ?? (fromLater ? lastRow() : firstRow());

    return { columnKey: null, rowKey: row };
  };

  const onFocusin = (event: FocusEvent) => {
    const element = getElement();
    const target = event.target;
    const isInside = element && target instanceof Node && element.contains(target);

    // Already ours: whatever moved focus has decided where it goes, and picking an entry target
    // here would overwrite it.
    if (selection.isFocused.value) {
      if (!isInside) selection.setFocused(false);

      return;
    }

    if (!isInside) return;

    selection.setFocused(true);

    // While something else owns the keys — a column being resized — the grid still tracks that it
    // holds focus, but it must not decide where focus goes. React Aria swaps its whole collection
    // handler set for exactly this pair while keyboard navigation is off.
    if (toValue(options.isDisabled)) return;

    if (focused.value.rowKey != null || focused.value.columnKey != null) return;

    const from = event.relatedTarget;

    // Focus arriving from later in the document means Shift+Tab, which should land at the end.
    const fromLater = Boolean(
      element &&
      from instanceof Node &&
      element.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING,
    );

    claimFocus(entryTarget(fromLater));
  };

  const onFocusout = (event: FocusEvent) => {
    const element = getElement();
    const next = event.relatedTarget;

    // Focus moving between cells is not a departure.
    if (element && next instanceof Node && element.contains(next)) return;

    selection.setFocused(false);
  };

  /**
   * Real focus follows the focused position, so a position claimed without moving focus still
   * moves the caret. This is what makes tabbing into the grid land on a row rather than leaving
   * focus on the grid itself, and it is the counterpart of React Aria's focus effect in
   * `useSelectableCollection`.
   */
  watch(
    () => focused.value,
    (target) => {
      if (!selection.isFocused.value || toValue(options.isDisabled)) return;
      if (target.rowKey == null && target.columnKey == null) return;

      const element = elementFor(target);

      // Focus already **inside** the target is not focus to take away: tabbing to a checkbox in
      // a cell claims the row as the tab stop, and pulling focus onto the row would make that
      // checkbox unreachable. React Aria guards its entry focus with the same test.
      if (!element || element.contains(document.activeElement)) return;

      element.focus();
    },
    { flush: "post" },
  );

  // A row that goes away must not keep the tab stop with it, or the grid would have none.
  watch(
    () => collection.rows.size.value,
    () => {
      const { rowKey } = focused.value;

      if (rowKey != null && !collection.rows.getItem(rowKey)) focused.value = NO_FOCUS;
    },
  );

  const isFocusedCell = (rowKey: CollectionKey | null, columnKey: CollectionKey | null) =>
    focused.value.rowKey === rowKey && focused.value.columnKey === columnKey;

  return {
    cellTabIndex: (rowKey, columnKey) => (isFocusedCell(rowKey, columnKey) ? 0 : -1),
    claimFocus,
    collectionTabIndex: computed(() =>
      focused.value.rowKey == null && focused.value.columnKey == null ? 0 : -1,
    ),
    columnTabIndex: (columnKey) => (isFocusedCell(null, columnKey) ? 0 : -1),
    focusCell,
    focusedCell: computed(() => focused.value),
    getKeyForSearch,
    onFocusin,
    onFocusout,
    onKeydown,
    rowTabIndex: (rowKey) => {
      // A disabled row carries no tab index at all, rather than -1, matching React Aria.
      if (selection.isDisabled(rowKey)) return undefined;

      return isFocusedCell(rowKey, null) ? 0 : -1;
    },
  };
};
