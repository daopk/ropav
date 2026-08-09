/**
 * The vocabulary of drag and drop, ported from `@react-types/shared`'s `dnd.d.ts`.
 *
 * These live in `utils/` rather than beside a composable because the non-reactive machinery
 * — the drag manager, the data transfer codec, the drop target delegates — is written against
 * them and must not reach up into `composables/`.
 */

/**
 * The key identifying a draggable item.
 *
 * Structurally identical to `CollectionKey` and `VirtualizerKey`, and declared separately for
 * the same reason those two are: `utils/` never imports from `composables/`, so the key type a
 * drop target names cannot be the one `use-collection` declares. React Aria has a single `Key`
 * because it has no such layering to keep.
 */
export type DragKey = string | number;

/* -------------------------------------------------------------------------------------------------
 * Operations
 * -----------------------------------------------------------------------------------------------*/

/** What a drop should do with the dragged data. `"cancel"` means the drop is refused. */
export type DropOperation = "copy" | "link" | "move" | "cancel";

/**
 * The native `DataTransfer.dropEffect` vocabulary.
 *
 * Nearly `DropOperation`, but the two disagree on how they spell refusal — the DOM says
 * `"none"` where React Aria says `"cancel"` — which is the whole reason both types exist.
 */
export type DropEffect = "none" | "copy" | "link" | "move";

/* -------------------------------------------------------------------------------------------------
 * Items
 * -----------------------------------------------------------------------------------------------*/

/**
 * One dragged item, as a map of mime type to serialized value.
 *
 * A single item carries several representations of itself at once — `text/plain` for a foreign
 * app, a custom app type for a drop back into the same collection — and the drop side picks
 * whichever it understands.
 */
export interface DragItem {
  [type: string]: string;
}

/** A dropped item that came from text data rather than the file system. */
export interface TextDropItem {
  kind: "text";
  /** Mime types this item can be read as. Often mime types, but app-specific types are allowed. */
  types: Set<string>;
  getText: (type: string) => Promise<string>;
}

/** A dropped item backed by a real file. */
export interface FileDropItem {
  kind: "file";
  /** The file's mime type, or `GENERIC_TYPE` when the browser could not name one. */
  type: string;
  name: string;
  getFile: () => Promise<File>;
  getText: () => Promise<string>;
}

/** A dropped item backed by a directory. Its contents are read lazily. */
export interface DirectoryDropItem {
  kind: "directory";
  name: string;
  getEntries: () => AsyncIterable<FileDropItem | DirectoryDropItem>;
}

export type DropItem = DirectoryDropItem | FileDropItem | TextDropItem;

/* -------------------------------------------------------------------------------------------------
 * Types on the wire
 * -----------------------------------------------------------------------------------------------*/

/**
 * A type a drag can be asked about. A symbol because `DIRECTORY_DRAG_TYPE` has no mime type
 * of its own — a directory is only distinguishable from a file after the drop.
 */
export type DragType = string | symbol;

/**
 * What a drag carries, as far as a drop target is allowed to know **during** the drag.
 *
 * The browser withholds the data itself until drop, so this is the only question answerable
 * while the pointer is still moving.
 */
export interface DragTypes {
  has: (type: DragType | DragType[]) => boolean;
}

/* -------------------------------------------------------------------------------------------------
 * Preview
 * -----------------------------------------------------------------------------------------------*/

/**
 * Renders the image that follows the pointer during a drag.
 *
 * Callback-shaped rather than returning the node, because `setDragImage` only has effect while
 * the `dragstart` handler is still on the stack: the renderer must produce the node and hand it
 * back within the same tick, and the callback is what enforces that.
 */
export type DragPreviewRenderer = (
  items: DragItem[],
  callback: (node: HTMLElement | null, x?: number, y?: number) => void,
) => void;

/* -------------------------------------------------------------------------------------------------
 * Targets
 * -----------------------------------------------------------------------------------------------*/

/** Where a drop lands relative to an item: on it, or inserted to either side of it. */
export type DropPosition = "after" | "before" | "on";

/** A drop onto the collection as a whole rather than any item in it. */
export interface RootDropTarget {
  type: "root";
}

export interface ItemDropTarget {
  type: "item";
  key: DragKey;
  dropPosition: DropPosition;
}

export type DropTarget = ItemDropTarget | RootDropTarget;

/**
 * Resolves a point to the drop target under it.
 *
 * A collection knows its own geometry better than a generic hit test does — a virtualized list
 * can answer from its layout without the rows being in the DOM at all — so this is delegated
 * rather than computed centrally.
 */
export interface DropTargetDelegate {
  /**
   * @param x - Horizontal offset from the collection container's top left corner.
   * @param y - Vertical offset from the collection container's top left corner.
   * @param isValidDropTarget - Whether a candidate would accept the drag currently in flight.
   */
  getDropTargetFromPoint: (
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ) => DropTarget | null;
}

/* -------------------------------------------------------------------------------------------------
 * Events
 * -----------------------------------------------------------------------------------------------*/

/** Coordinates every drag and drop event carries, relative to the target element. */
export interface DragDropEvent {
  x: number;
  y: number;
}

export interface DragStartEvent extends DragDropEvent {
  type: "dragstart";
}

export interface DragMoveEvent extends DragDropEvent {
  type: "dragmove";
}

export interface DragEndEvent extends DragDropEvent {
  type: "dragend";
  dropOperation: DropOperation;
}

export interface DropEnterEvent extends DragDropEvent {
  type: "dropenter";
}

export interface DropMoveEvent extends DragDropEvent {
  type: "dropmove";
}

export interface DropActivateEvent extends DragDropEvent {
  type: "dropactivate";
}

export interface DropExitEvent extends DragDropEvent {
  type: "dropexit";
}

export interface DropEvent extends DragDropEvent {
  type: "drop";
  dropOperation: DropOperation;
  items: DropItem[];
}

/* -------------------------------------------------------------------------------------------------
 * Guards
 * -----------------------------------------------------------------------------------------------*/

/** Whether a drop item carries text data. */
export const isTextDropItem = (dropItem: DropItem): dropItem is TextDropItem =>
  dropItem.kind === "text";

/** Whether a drop item is a file. */
export const isFileDropItem = (dropItem: DropItem): dropItem is FileDropItem =>
  dropItem.kind === "file";

/** Whether a drop item is a directory. */
export const isDirectoryDropItem = (dropItem: DropItem): dropItem is DirectoryDropItem =>
  dropItem.kind === "directory";
