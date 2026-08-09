/**
 * Announcements and descriptions for drag and drop, ported from React Aria's
 * `intl/dnd/en-US.json`.
 *
 * Hardcoded English, like `live-announcer.ts` — React Aria resolves these through the RAC intl
 * system, which this package has no equivalent of yet (debt #12). Kept in one module so that
 * wiring a locale layer later is a matter of swapping the lookup, not hunting string literals
 * through a dozen composables.
 *
 * Pluralization is spelled out rather than run through `Intl.PluralRules`: only the English
 * strings exist, and English needs exactly the one/other split written here.
 */

const plural = (count: number, one: string, other: string): string =>
  count === 1 ? one : other.replace("{count}", String(count));

/* -------------------------------------------------------------------------------------------------
 * Labels
 * -----------------------------------------------------------------------------------------------*/

/** Label for the hidden drag button on a single item. */
export const dragItemLabel = (itemText: string): string => `Drag ${itemText}`;

/** Label for the hidden drag button when the press lands on part of a multi-item selection. */
export const dragSelectedItemsLabel = (count: number): string =>
  `Drag ${plural(count, "1 selected item", "{count} selected items")}`;

/* -------------------------------------------------------------------------------------------------
 * Descriptions — how to start a drag
 * -----------------------------------------------------------------------------------------------*/

/**
 * How a drag is started, by input modality.
 *
 * `Alt` variants belong to items that already do something on Enter: a list box item with an
 * action would otherwise have no way to distinguish "activate me" from "drag me".
 */
export const DRAG_DESCRIPTION = {
  keyboard: "Press Enter to start dragging.",
  keyboardAlt: "Press Alt + Enter to start dragging.",
  longPress: "Long press to start dragging.",
  touch: "Double tap to start dragging.",
  virtual: "Click to start dragging.",
} as const;

export const dragSelectedKeyboard = (count: number): string =>
  `Press Enter to drag ${plural(count, "1 selected item", "{count} selected items")}.`;

export const dragSelectedKeyboardAlt = (count: number): string =>
  `Press Alt + Enter to drag ${plural(count, "1 selected item", "{count} selected items")}.`;

export const dragSelectedLongPress = (count: number): string =>
  `Long press to drag ${plural(count, "1 selected item", "{count} selected items")}.`;

/* -------------------------------------------------------------------------------------------------
 * Announcements — during a drag
 * -----------------------------------------------------------------------------------------------*/

/** Announced assertively the moment a drag session begins. */
export const DRAG_STARTED = {
  keyboard:
    "Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.",
  touch: "Started dragging. Navigate to a drop target, then double tap to drop.",
  virtual: "Started dragging. Navigate to a drop target, then click or press Enter to drop.",
} as const;

/** Description on the drag source itself while its own drag is in flight. */
export const END_DRAG_DESCRIPTION = {
  keyboard: "Dragging. Press Enter to cancel drag.",
  touch: "Dragging. Double tap to cancel drag.",
  virtual: "Dragging. Click to cancel drag.",
} as const;

/** Description on a drop target while a drag is in flight. */
export const DROP_DESCRIPTION = {
  keyboard: "Press Enter to drop. Press Escape to cancel drag.",
  touch: "Double tap to drop.",
  virtual: "Click to drop.",
} as const;

export const DROP_CANCELED = "Drop canceled.";
export const DROP_COMPLETE = "Drop complete.";

/* -------------------------------------------------------------------------------------------------
 * Drop indicator
 * -----------------------------------------------------------------------------------------------*/

/** `aria-roledescription` on every drop indicator. */
export const DROP_INDICATOR = "drop indicator";

export const DROP_ON_ROOT = "Drop on";
export const dropOnItem = (itemText: string): string => `Drop on ${itemText}`;
export const insertBefore = (itemText: string): string => `Insert before ${itemText}`;
export const insertAfter = (itemText: string): string => `Insert after ${itemText}`;
export const insertBetween = (beforeItemText: string, afterItemText: string): string =>
  `Insert between ${beforeItemText} and ${afterItemText}`;
