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
 * Collections
 * -----------------------------------------------------------------------------------------------*/

/**
 * What the drag and drop state layer needs to know about one item.
 *
 * React Aria reads a full `Node` off its collection, which it can do because it builds the whole
 * tree by rendering into a hidden pass. This package has no such pass — items register themselves
 * — so instead of forcing every collection into a common node shape, the state layer names only
 * the four facts it actually uses and each collection supplies them its own way.
 */
export interface DragCollectionNode<T = unknown> {
  key: DragKey;
  /**
   * What the node is.
   *
   * Only `"item"` is a drop target. A collection may also hold rows that are not items — a
   * load-more sentinel, a section header — and every traversal has to step over them rather
   * than offer them as somewhere to drop.
   */
  type?: "item" | (string & {});
  /** Depth in a tree, counting from 0. Flat collections may leave it undefined. */
  level?: number;
  /** The containing item in a tree, or `null` at the top level. */
  parentKey?: DragKey | null;
  /** The previous sibling, used to recognise two ways of naming the same gap between items. */
  prevKey?: DragKey | null;
  nextKey?: DragKey | null;
  /** The last child, for stepping past a whole expanded subtree. */
  lastChildKey?: DragKey | null;
  /** The first child, for dropping at the top of an expanded subtree. */
  firstChildKey?: DragKey | null;
  /**
   * Whether the item can contain others at all.
   *
   * Distinct from having any right now: a collapsed row's children are absent from the
   * collection, and an empty expandable row still accepts a drop into it.
   */
  hasChildItems?: boolean;
  /** The item's text, used to name it in a drop indicator's label. */
  textValue?: string;
  /** The caller's own data for this item, handed back when building drag items. */
  value?: T;
}

/**
 * The slice of a collection the drag and drop layer reads.
 *
 * `getKeyAfter`/`getKeyBefore` walk the collection in **document order**, descending into
 * expanded children — which is a different question from `nextKey`/`prevKey` on a node, and both
 * are needed: document order is how a drag steps down the list, sibling order is how it decides
 * where a subtree ends.
 */
export interface DragCollection<T = unknown> {
  getItem: (key: DragKey) => DragCollectionNode<T> | null | undefined;
  getKeyAfter: (key: DragKey) => DragKey | null;
  getKeyBefore: (key: DragKey) => DragKey | null;
  /** Every key in document order. */
  getKeys: () => Iterable<DragKey>;
}

/**
 * Where the keyboard would move focus from a given key.
 *
 * Satisfied by this package's `useListKeyboard` and `useGridKeyboard`. Drag navigation asks it
 * rather than walking the collection itself, so a drag moves through a grid the same way focus
 * does — down a column, not along a row.
 */
export interface DragKeyboardDelegate {
  getKeyBelow?: (key: DragKey) => DragKey | null;
  getKeyAbove?: (key: DragKey) => DragKey | null;
  getKeyLeftOf?: (key: DragKey) => DragKey | null;
  getKeyRightOf?: (key: DragKey) => DragKey | null;
  getFirstKey?: () => DragKey | null;
  getLastKey?: () => DragKey | null;
}

/* -------------------------------------------------------------------------------------------------
 * Collection events
 * -----------------------------------------------------------------------------------------------*/

export interface DroppableCollectionEnterEvent extends DropEnterEvent {
  target: DropTarget;
}

export interface DroppableCollectionMoveEvent extends DropMoveEvent {
  target: DropTarget;
}

export interface DroppableCollectionActivateEvent extends DropActivateEvent {
  target: DropTarget;
}

export interface DroppableCollectionExitEvent extends DropExitEvent {
  target: DropTarget;
}

export interface DroppableCollectionDropEvent extends DropEvent {
  target: DropTarget;
}

/** Items from elsewhere dropped into a gap between two items. */
export interface DroppableCollectionInsertDropEvent {
  items: DropItem[];
  dropOperation: DropOperation;
  target: ItemDropTarget;
}

/** Items from elsewhere dropped on the collection itself rather than any item. */
export interface DroppableCollectionRootDropEvent {
  items: DropItem[];
  dropOperation: DropOperation;
}

/** Items dropped onto an item — a folder, say — rather than between two. */
export interface DroppableCollectionOnItemDropEvent {
  items: DropItem[];
  dropOperation: DropOperation;
  isInternal: boolean;
  target: ItemDropTarget;
}

/** Items from this same collection moved to a new position. */
export interface DroppableCollectionReorderEvent {
  keys: Set<DragKey>;
  dropOperation: DropOperation;
  target: ItemDropTarget;
}

export interface DraggableCollectionStartEvent extends DragStartEvent {
  keys: Set<DragKey>;
}

export interface DraggableCollectionMoveEvent extends DragMoveEvent {
  keys: Set<DragKey>;
}

export interface DraggableCollectionEndEvent extends DragEndEvent {
  keys: Set<DragKey>;
  /** Whether the drop landed in the collection the drag started from. */
  isInternal: boolean;
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
