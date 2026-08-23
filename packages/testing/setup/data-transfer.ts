/**
 * A `DataTransfer` / `DragEvent` polyfill for jsdom.
 *
 * jsdom implements neither — `DataTransfer`, `DataTransferItem` and `DragEvent` are all
 * `undefined` — so without this, every drag and drop test would have to hand-assemble a payload
 * onto the event, and each one would be free to get the shape subtly wrong.
 *
 * This is deliberately a **faithful stub, not a simulation**: it stores what it is given and
 * reports it back the way the spec says, and it does not attempt to reproduce browser drag
 * behaviour. Anything that depends on real drag semantics — the actual `dragstart`/`drop`
 * sequence a browser emits, file entries, `setDragImage` having a visible effect — belongs in
 * `*.browser.test.ts`, where the real objects exist.
 *
 * Only the surface `ropav`'s drag and drop layer reads is implemented. The gaps that
 * matter are called out inline.
 */

interface StubEntry {
  kind: "string" | "file";
  type: string;
  data: string;
  file: File | null;
}

class DataTransferItemStub {
  #entry: StubEntry;

  constructor(entry: StubEntry) {
    this.#entry = entry;
  }

  get kind(): string {
    return this.#entry.kind;
  }

  get type(): string {
    return this.#entry.type;
  }

  getAsString(callback: ((data: string) => void) | null): void {
    if (!callback) return;
    // The spec queues this rather than running it inline.
    queueMicrotask(() => callback(this.#entry.data));
  }

  getAsFile(): File | null {
    return this.#entry.file;
  }

  /**
   * Always `null`.
   *
   * The real method returns a `FileSystemEntry`, which jsdom has no implementation of. Returning
   * `null` is a shape the production code already handles — it is the Firefox phantom-item case
   * — so directory traversal simply never runs under jsdom. Cover it in a browser test instead.
   */
  webkitGetAsEntry(): null {
    return null;
  }
}

class DataTransferItemListStub {
  #entries: StubEntry[] = [];

  get length(): number {
    return this.#entries.length;
  }

  /** The backing store, for `DataTransferStub` to read without going through the index props. */
  get entries(): StubEntry[] {
    return this.#entries;
  }

  add(data: File): DataTransferItemStub | null;
  add(data: string, type: string): DataTransferItemStub | null;
  add(data: File | string, type?: string): DataTransferItemStub | null {
    const entry: StubEntry =
      typeof data === "string"
        ? { data, file: null, kind: "string", type: type ?? "" }
        : { data: "", file: data, kind: "file", type: data.type };

    // The spec refuses a second string item of a type already present.
    if (
      entry.kind === "string" &&
      this.#entries.some((e) => e.kind === "string" && e.type === entry.type)
    ) {
      return null;
    }

    this.#entries.push(entry);
    this.#reindex();

    return new DataTransferItemStub(entry);
  }

  remove(index: number): void {
    this.#entries.splice(index, 1);
    this.#reindex();
  }

  clear(): void {
    this.#entries = [];
    this.#reindex();
  }

  /**
   * Republish numeric index properties.
   *
   * `DataTransferItemList` is indexable but not an array, and production code reads it by index
   * (`list[i]`) rather than iterating, so the indices have to be real own-properties.
   */
  #reindex(): void {
    let index = 0;

    while (Reflect.has(this, String(index))) {
      Reflect.deleteProperty(this, String(index));
      index++;
    }

    this.#entries.forEach((entry, i) => {
      Object.defineProperty(this, String(i), {
        configurable: true,
        enumerable: true,
        value: new DataTransferItemStub(entry),
        writable: false,
      });
    });
  }
}

class DataTransferStub {
  dropEffect = "none";
  effectAllowed = "uninitialized";
  readonly items = new DataTransferItemListStub();

  get types(): readonly string[] {
    const types = this.items.entries
      .filter((entry) => entry.kind === "string")
      .map((entry) => entry.type);

    // The spec appends "Files" — once — when the transfer carries any file.
    if (this.items.entries.some((entry) => entry.kind === "file")) types.push("Files");

    return types;
  }

  get files(): File[] {
    return this.items.entries
      .filter((entry): entry is StubEntry & { file: File } => entry.file != null)
      .map((entry) => entry.file);
  }

  getData(type: string): string {
    const entry = this.items.entries.find((e) => e.kind === "string" && e.type === type);

    return entry?.data ?? "";
  }

  setData(type: string, data: string): void {
    const existing = this.items.entries.find((e) => e.kind === "string" && e.type === type);

    if (existing) {
      existing.data = data;

      return;
    }

    this.items.add(data, type);
  }

  clearData(type?: string): void {
    if (type == null) {
      this.items.clear();

      return;
    }

    const index = this.items.entries.findIndex((e) => e.kind === "string" && e.type === type);

    if (index >= 0) this.items.remove(index);
  }

  /** No-op: there is nothing to paint in jsdom. Verify drag previews in a browser test. */
  setDragImage(): void {}
}

class DragEventStub extends MouseEvent {
  readonly dataTransfer: DataTransferStub | null;

  constructor(
    type: string,
    init: MouseEventInit & { dataTransfer?: DataTransferStub | null } = {},
  ) {
    super(type, init);
    this.dataTransfer = init.dataTransfer ?? null;
  }
}

/** Install the stubs, leaving any real implementation alone. */
export const installDataTransfer = (): void => {
  if (typeof globalThis.DataTransfer === "undefined") {
    globalThis.DataTransfer = DataTransferStub as unknown as typeof globalThis.DataTransfer;
  }

  if (typeof globalThis.DataTransferItem === "undefined") {
    globalThis.DataTransferItem =
      DataTransferItemStub as unknown as typeof globalThis.DataTransferItem;
  }

  if (typeof globalThis.DragEvent === "undefined") {
    globalThis.DragEvent = DragEventStub as unknown as typeof globalThis.DragEvent;
  }
};
