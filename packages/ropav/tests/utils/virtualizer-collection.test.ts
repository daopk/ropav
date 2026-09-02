import { describe, expect, it } from "vitest";

import {
  createListCollection,
  createTableCollection,
  defaultItemKey,
} from "@/utils/virtualizer-collection";

const users = [
  { id: "a", name: "Ada" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Cleo" },
];

describe("defaultItemKey", () => {
  it("prefers id, then key, then the index", () => {
    expect(defaultItemKey({ id: "x" }, 3)).toBe("x");
    expect(defaultItemKey({ key: 7 }, 3)).toBe(7);
    expect(defaultItemKey({ name: "no key" }, 3)).toBe(3);
    expect(defaultItemKey("a string", 3)).toBe(3);
    // An object id has no business being a key, so the index wins over it.
    expect(defaultItemKey({ id: {} }, 3)).toBe(3);
  });
});

describe("createListCollection", () => {
  it("builds one item node per datum, in order", () => {
    const collection = createListCollection({ items: users });

    expect(collection.keys).toEqual(["a", "b", "c"]);
    expect(collection.rootKeys).toEqual(["a", "b", "c"]);
    expect(collection.itemCount).toBe(3);
    expect(collection.getNode("b")).toEqual({
      childKeys: [],
      content: users[1],
      index: 1,
      isDisabled: false,
      key: "b",
      parentKey: null,
      textValue: undefined,
      type: "item",
    });
  });

  it("carries text and disabled state read from the data", () => {
    const collection = createListCollection({
      getTextValue: (user) => user.name,
      isDisabled: (user) => user.id === "b",
      items: users,
    });

    expect(collection.getNode("c")?.textValue).toBe("Cleo");
    expect(collection.getNode("b")?.isDisabled).toBe(true);
    expect(collection.getNode("a")?.isDisabled).toBe(false);
  });

  it("builds row nodes for a table body", () => {
    const collection = createListCollection({ items: users, type: "row" });

    expect(collection.getNode("a")?.type).toBe("row");
  });

  it("has no children, being flat", () => {
    const collection = createListCollection({ items: users });

    expect(collection.getChildNodes("a")).toEqual([]);
    expect(collection.getNode("missing")).toBeUndefined();
  });
});

describe("createTableCollection", () => {
  const columnKeys = ["name", "role", "email"];

  const tableOf = (rowCount: number) =>
    createTableCollection({
      columnKeys,
      idPrefix: "t",
      items: Array.from({ length: rowCount }, (_, index) => ({ id: index })),
    });

  it("holds a node per row rather than a node per cell", () => {
    const collection = tableOf(1000);

    // The header, its row, the columns, the body, and one node per row. A cell is not among them:
    // holding one per column per row is the one count that grows with the data, and it would be
    // paid before the first paint.
    expect(collection.keys).toHaveLength(1000 + columnKeys.length + 3);
    expect(collection.getNode(collection.cellKey(0, "name"))).toBeUndefined();
    expect(collection.getChildNodes(0)).toEqual([]);
  });

  it("names the cell where a row and a column meet without holding one", () => {
    const collection = tableOf(2);

    expect(collection.cellKey(1, "role")).toBe("1:role");
    expect(collection.getNode(1)?.type).toBe("row");
  });

  it("grows by a node per row as the data grows", () => {
    // What the count used to be multiplied by: three columns meant four nodes a row, not one.
    expect(tableOf(2000).keys.length - tableOf(1000).keys.length).toBe(1000);
  });
});
