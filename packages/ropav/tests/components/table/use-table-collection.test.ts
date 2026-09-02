import type {
  TableCellMeta,
  TableColumnMeta,
  TableRegistry,
  UseTableCollectionReturn,
} from "@/components/table/use-table-collection";
import type { CollectionKey } from "@/composables/use-collection";

import { afterEach, describe, expect, it } from "vitest";
import { computed, effectScope } from "vue";

import {
  createTableRegistry,
  normalizeIdKey,
  tableCellId,
  tableColumnHeaderId,
  useTableCollection,
} from "@/components/table/use-table-collection";

const scopes: (() => void)[] = [];
const containers: HTMLElement[] = [];

const inScope = <T>(create: () => T): T => {
  const scope = effectScope();

  scopes.push(() => scope.stop());

  return scope.run(create) as T;
};

/** Appends an element per key to a fresh container, so document order is the key order. */
const elementsFor = (keys: CollectionKey[]) => {
  const container = document.createElement("div");

  containers.push(container);
  document.body.appendChild(container);

  const elements = new Map<CollectionKey, HTMLElement>();

  for (const key of keys) {
    const element = document.createElement("div");

    container.appendChild(element);
    elements.set(key, element);
  }

  return { container, elements };
};

/** A column that leaves every width to the browser, which is every column outside a resize. */
const NO_WIDTHS = {
  defaultWidth: () => undefined,
  maxWidth: () => undefined,
  minWidth: () => undefined,
  width: () => undefined,
};

const registerColumns = (
  columns: TableRegistry<TableColumnMeta>,
  keys: CollectionKey[],
  options: { rowHeaders?: CollectionKey[]; registerOrder?: CollectionKey[] } = {},
) => {
  const { elements } = elementsFor(keys);
  const cleanups = new Map<CollectionKey, () => void>();

  for (const key of options.registerOrder ?? keys) {
    cleanups.set(
      key,
      columns.register(key, {
        ...NO_WIDTHS,
        element: () => elements.get(key) ?? null,
        isRowHeader: () => Boolean(options.rowHeaders?.includes(key)),
        textValue: () => String(key),
      }),
    );
  }

  return { cleanups, elements };
};

afterEach(() => {
  scopes.splice(0).forEach((stop) => stop());
  containers.splice(0).forEach((container) => container.remove());
});

describe("createTableRegistry", () => {
  it("starts empty", () => {
    const registry = inScope(() => createTableRegistry<TableCellMeta>());

    expect(registry.size.value).toBe(0);
    expect(registry.orderedKeys.value).toEqual([]);
    expect(registry.indexOf("a")).toBe(-1);
    expect(registry.keyAt(0)).toBeNull();
  });

  // Registration order is deliberately not the answer: a cell rendered by `v-for` inside a
  // `v-if` can register after a sibling that sits to its right.
  it("orders entries by where they sit rather than when they registered", () => {
    const registry = inScope(() => createTableRegistry<TableColumnMeta>());

    registerColumns(registry, ["name", "role", "status"], {
      registerOrder: ["status", "name", "role"],
    });

    expect(registry.orderedKeys.value).toEqual(["name", "role", "status"]);
    expect(registry.indexOf("role")).toBe(1);
    expect(registry.keyAt(2)).toBe("status");
    expect(registry.size.value).toBe(3);
  });

  it("re-runs a computed that read an index when a registration changes", () => {
    const registry = inScope(() => createTableRegistry<TableColumnMeta>());
    const index = inScope(() => computed(() => registry.indexOf("status")));

    const { cleanups } = registerColumns(registry, ["name", "role", "status"]);

    expect(index.value).toBe(2);

    cleanups.get("role")!();

    expect(index.value).toBe(1);
  });

  it("leaves a detached entry out, so the comparator stays transitive", () => {
    const registry = inScope(() => createTableRegistry<TableColumnMeta>());
    const { elements } = registerColumns(registry, ["name", "role", "status"]);

    elements.get("role")!.remove();

    expect(registry.orderedKeys.value).toEqual(["name", "status"]);
    expect(registry.indexOf("status")).toBe(1);
  });

  it("keeps a re-registration when the stale cleanup runs", () => {
    const registry = inScope(() => createTableRegistry<TableColumnMeta>());
    const { cleanups, elements } = registerColumns(registry, ["name"]);

    const replace = registry.register("name", {
      ...NO_WIDTHS,
      element: () => elements.get("name") ?? null,
      isRowHeader: () => true,
      textValue: () => "Name",
    });

    cleanups.get("name")!();

    expect(registry.orderedKeys.value).toEqual(["name"]);
    expect(registry.getItem("name")?.isRowHeader()).toBe(true);

    replace();

    expect(registry.orderedKeys.value).toEqual([]);
  });
});

describe("useTableCollection", () => {
  const createCollection = () => inScope(() => useTableCollection()) as UseTableCollectionReturn;

  it("takes the row headers a column asked for", () => {
    const collection = createCollection();

    registerColumns(collection.columns, ["select", "name", "role"], { rowHeaders: ["name"] });

    expect([...collection.rowHeaderColumnKeys.value]).toEqual(["name"]);
  });

  it("supports more than one row header column", () => {
    const collection = createCollection();

    registerColumns(collection.columns, ["first", "last", "role"], {
      rowHeaders: ["first", "last"],
    });

    expect([...collection.rowHeaderColumnKeys.value]).toEqual(["first", "last"]);
  });

  // Ported from react-stately: a row without an accessible name is worse than one named by a
  // column that never asked for the job.
  it("falls back to the first column when no column asked", () => {
    const collection = createCollection();

    registerColumns(collection.columns, ["name", "role"]);

    expect([...collection.rowHeaderColumnKeys.value]).toEqual(["name"]);
  });

  it("has no row header column while the header is empty", () => {
    const collection = createCollection();

    expect([...collection.rowHeaderColumnKeys.value]).toEqual([]);
  });

  it("exposes rows as a plain collection, so the selection manager can take them", () => {
    const collection = createCollection();
    const { elements } = elementsFor(["1", "2"]);

    collection.rows.register("1", {
      element: () => elements.get("1") ?? null,
      isDisabled: () => false,
      textValue: () => "Kate",
    });

    expect(collection.rows.size.value).toBe(1);
    expect(collection.rows.getFirstKey()).toBe("1");
  });
});

describe("table ids", () => {
  // A key with a space in it would otherwise read as two references inside
  // `aria-labelledby`, which is a space-separated list.
  it("strips whitespace out of a key", () => {
    expect(normalizeIdKey("first name")).toBe("firstname");
    expect(normalizeIdKey("  padded  ")).toBe("padded");
    expect(normalizeIdKey(42)).toBe("42");
  });

  it("builds the ids a column header and a row header cell carry", () => {
    expect(tableColumnHeaderId("table-1", "name")).toBe("table-1-name");
    expect(tableCellId("table-1", 4586932, "name")).toBe("table-1-4586932-name");
    expect(tableCellId("table-1", "row 1", "first name")).toBe("table-1-row1-firstname");
  });
});
