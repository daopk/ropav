import type {
  DirectoryDropItem,
  DragItem,
  DragType,
  DragTypes,
  DropItem,
  FileDropItem,
} from "./dnd-types";

import {
  CUSTOM_DRAG_TYPE,
  DIRECTORY_DRAG_TYPE,
  GENERIC_TYPE,
  NATIVE_DRAG_TYPES,
} from "./dnd-constants";

/**
 * Reading and writing the native `DataTransfer`, ported from React Aria's `dnd/utils.ts`.
 *
 * The native API is narrower than the one HeroUI exposes: a `DataTransfer` holds at most one
 * entry per mime type, and only a handful of types survive a drag between applications. Both
 * limits are worked around by serializing the full item list into `CUSTOM_DRAG_TYPE` whenever
 * the native representation would lose information.
 */

/** `DataTransferItemList` is array-like but not iterable in every engine's type surface. */
const toItemArray = (list: DataTransferItemList): DataTransferItem[] => {
  const items: DataTransferItem[] = [];

  for (let index = 0; index < list.length; index++) {
    const item = list[index];

    if (item) items.push(item);
  }

  return items;
};

/** Every mime type present across a set of drag items. */
export const getTypes = (items: DragItem[]): Set<string> => {
  const types = new Set<string>();

  for (const item of items) {
    for (const type of Object.keys(item)) types.add(type);
  }

  return types;
};

/**
 * Write drag items onto a native `DataTransfer`.
 *
 * The native API cannot hold two items of one type, nor one item in two representations, so
 * both cases fall back to a JSON blob under `CUSTOM_DRAG_TYPE`. That blob is written *in
 * addition to* the native entries rather than instead of them, so a foreign application still
 * receives something it understands.
 *
 * Note that files are never written: `DataTransferItemList.add` accepts a `File`, but no browser
 * actually carries it out of the page, so dragging binary data to the desktop is not supported.
 */
export const writeToDataTransfer = (dataTransfer: DataTransfer, items: DragItem[]): void => {
  const groupedByType = new Map<string, string[]>();
  const customData: Record<string, string>[] = [];
  let needsCustomData = false;

  for (const item of items) {
    const types = Object.keys(item);

    // More than one representation of a single item cannot be expressed natively.
    if (types.length > 1) needsCustomData = true;

    const dataByType: Record<string, string> = {};

    for (const type of types) {
      let typeItems = groupedByType.get(type);

      if (typeItems) {
        // A second item claiming a type the first already took cannot be expressed either.
        needsCustomData = true;
      } else {
        typeItems = [];
        groupedByType.set(type, typeItems);
      }

      const data = item[type] ?? "";

      dataByType[type] = data;
      typeItems.push(data);
    }

    customData.push(dataByType);
  }

  for (const [type, typeItems] of groupedByType) {
    if (NATIVE_DRAG_TYPES.has(type)) {
      // A foreign target reads one string per type, so join rather than drop the rest.
      dataTransfer.items.add(typeItems.join("\n"), type);
    } else {
      // App-private types are only a means of advertising what the drag holds; the real
      // payload travels in the custom type, so the first value is enough.
      const first = typeItems[0];

      if (first !== undefined) dataTransfer.items.add(first, type);
    }
  }

  if (needsCustomData) dataTransfer.items.add(JSON.stringify(customData), CUSTOM_DRAG_TYPE);
};

/**
 * What a drag carries, as far as a drop target may know while the drag is still moving.
 *
 * Ported from React Aria's `DragTypes`. Built once per `dragenter`/`dragover` because a
 * `DataTransfer` is only readable for types — never values — until the drop actually fires.
 */
export class DataTransferDragTypes implements DragTypes {
  private types: Set<string>;
  private includesUnknownTypes: boolean;

  constructor(dataTransfer: DataTransfer) {
    this.types = new Set<string>();

    let hasFiles = false;

    for (const item of toItemArray(dataTransfer.items)) {
      if (item.type === CUSTOM_DRAG_TYPE) continue;

      if (item.kind === "file") hasFiles = true;

      if (item.type) {
        this.types.add(item.type);
      } else {
        // A file whose extension maps to no known mime type is reported with an empty string.
        // There is no way to tell it apart from a directory until the drop, so both land here.
        this.types.add(GENERIC_TYPE);
      }
    }

    // Safari reports an empty `items` list while dragging files, but still lists "Files" in
    // `types`. That says nothing about *which* file types, so every question must be answered
    // yes. See https://bugs.webkit.org/show_bug.cgi?id=223517.
    this.includesUnknownTypes = !hasFiles && dataTransfer.types.includes("Files");
  }

  has(type: DragType | DragType[]): boolean {
    if (Array.isArray(type)) return type.some((candidate) => this.has(candidate));

    if (
      this.includesUnknownTypes ||
      (type === DIRECTORY_DRAG_TYPE && this.types.has(GENERIC_TYPE)) ||
      type === "*/*"
    ) {
      return true;
    }

    if (typeof type === "string") {
      if (type.endsWith("/*")) {
        const prefix = type.slice(0, -2);

        for (const key of this.types) {
          if (key.startsWith(prefix)) return true;
        }

        return false;
      }

      return this.types.has(type);
    }

    return false;
  }
}

/**
 * Read drop items back off a native `DataTransfer`.
 *
 * Must be called synchronously from the `drop` handler: the browser empties the transfer as
 * soon as the handler returns, so every value is read here and handed out as a resolved promise
 * afterwards.
 */
export const readFromDataTransfer = (dataTransfer: DataTransfer): DropItem[] => {
  const items: DropItem[] = [];

  if (!dataTransfer) return items;

  // Prefer the custom type: it is the only representation that survived multiple items or
  // multiple representations intact.
  let hasCustomType = false;

  if (dataTransfer.types.includes(CUSTOM_DRAG_TYPE)) {
    try {
      const parsed: Record<string, string>[] = JSON.parse(dataTransfer.getData(CUSTOM_DRAG_TYPE));

      for (const item of parsed) {
        items.push({
          getText: (type: string) => Promise.resolve(item[type] ?? ""),
          kind: "text",
          types: new Set(Object.keys(item)),
        });
      }

      hasCustomType = true;
    } catch {
      // Not ours, or truncated. Fall through to the native representation.
    }
  }

  if (!hasCustomType) {
    const stringItems = new Map<string, string>();

    for (const item of toItemArray(dataTransfer.items)) {
      if (item.kind === "string") {
        stringItems.set(item.type || GENERIC_TYPE, dataTransfer.getData(item.type));
      } else if (item.kind === "file") {
        // Despite the name, `webkitGetAsEntry` is implemented in Firefox and Edge too.
        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();

          // Firefox reports a phantom `image/png` item when copying any file or directory, and
          // returns `null` from both `getAsFile()` and `webkitGetAsEntry()` for it.
          // See https://bugzilla.mozilla.org/show_bug.cgi?id=1699743.
          if (!entry) continue;

          if (entry.isFile) {
            items.push(createFileItem(item.getAsFile()));
          } else if (entry.isDirectory) {
            items.push(createDirectoryItem(entry as FileSystemDirectoryEntry));
          }
        } else {
          items.push(createFileItem(item.getAsFile()));
        }
      }
    }

    // Every string entry is another representation of one item — the native API has no way to
    // carry two distinct string items at once — so they collapse into a single drop item.
    if (stringItems.size > 0) {
      items.push({
        getText: (type: string) => Promise.resolve(stringItems.get(type) ?? ""),
        kind: "text",
        types: new Set(stringItems.keys()),
      });
    }
  }

  return items;
};

const blobToString = (blob: Blob): Promise<string> => {
  if (typeof blob.text === "function") return blob.text();

  // Older Safari has no `Blob#text()`.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
};

const createFileItem = (file: File | null): FileDropItem => {
  if (!file) throw new Error("No file provided");

  return {
    getFile: () => Promise.resolve(file),
    getText: () => blobToString(file),
    kind: "file",
    name: file.name,
    type: file.type || GENERIC_TYPE,
  };
};

const createDirectoryItem = (entry: FileSystemDirectoryEntry): DirectoryDropItem => ({
  getEntries: () => getEntries(entry),
  kind: "directory",
  name: entry.name,
});

/**
 * Walk a dropped directory.
 *
 * `readEntries` returns a bounded batch rather than the whole directory, so it is called until
 * it comes back empty — a single call silently truncates a large directory.
 */
async function* getEntries(
  item: FileSystemDirectoryEntry,
): AsyncIterable<DirectoryDropItem | FileDropItem> {
  const reader = item.createReader();
  let entries: FileSystemEntry[];

  do {
    entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });

    for (const entry of entries) {
      if (entry.isFile) {
        yield createFileItem(await getEntryFile(entry as FileSystemFileEntry));
      } else if (entry.isDirectory) {
        yield createDirectoryItem(entry as FileSystemDirectoryEntry);
      }
    }
  } while (entries.length > 0);
}

const getEntryFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => entry.file(resolve, reject));
