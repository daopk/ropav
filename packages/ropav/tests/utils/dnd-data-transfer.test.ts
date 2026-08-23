import { describe, expect, it } from "vitest";

import { CUSTOM_DRAG_TYPE, DIRECTORY_DRAG_TYPE, GENERIC_TYPE } from "@/utils/dnd-constants";
import {
  DataTransferDragTypes,
  getTypes,
  readFromDataTransfer,
  writeToDataTransfer,
} from "@/utils/dnd-data-transfer";

/**
 * Runs against the jsdom `DataTransfer` stub from `@ropav/testing` — see
 * `packages/testing/setup/data-transfer.ts`. The stub stores and reports; it does not simulate
 * a browser. Anything that needs the real object is in the sibling `.browser.test.ts`.
 */

const transfer = (): DataTransfer => new DataTransfer();

describe("getTypes", () => {
  it("collects every type across every item", () => {
    const types = getTypes([{ "text/plain": "a" }, { "text/html": "<b>b</b>", "text/plain": "b" }]);

    expect([...types].sort()).toEqual(["text/html", "text/plain"]);
  });

  it("is empty for no items", () => {
    expect(getTypes([]).size).toBe(0);
  });
});

describe("writeToDataTransfer", () => {
  // One item, one representation: the native API expresses this exactly, so nothing extra.
  it("writes a single simple item natively and adds no custom payload", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/plain": "hello" }]);

    expect(data.getData("text/plain")).toBe("hello");
    expect([...data.types]).not.toContain(CUSTOM_DRAG_TYPE);
  });

  // A `DataTransfer` holds one entry per type, so two items sharing a type would lose one.
  it("adds a custom payload when two items share a type", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/plain": "first" }, { "text/plain": "second" }]);

    expect([...data.types]).toContain(CUSTOM_DRAG_TYPE);
  });

  it("adds a custom payload when one item has several representations", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/html": "<b>a</b>", "text/plain": "a" }]);

    expect([...data.types]).toContain(CUSTOM_DRAG_TYPE);
  });

  // A foreign application reads one string per type, so the alternative to joining is losing
  // every item after the first.
  it("joins repeated native types with newlines so a foreign target sees all of them", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/plain": "first" }, { "text/plain": "second" }]);

    expect(data.getData("text/plain")).toBe("first\nsecond");
  });

  // An app-private type is only an advertisement of what the drag holds — the payload itself
  // travels in the custom type — so there is nothing to gain by joining.
  it("keeps only the first value for a repeated app-private type", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "app/thing": "first" }, { "app/thing": "second" }]);

    expect(data.getData("app/thing")).toBe("first");
  });
});

describe("round trip", () => {
  it("restores several items of one type through the custom payload", () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/plain": "first" }, { "text/plain": "second" }]);

    const items = readFromDataTransfer(data);

    expect(items).toHaveLength(2);
    expect(items[0]?.kind).toBe("text");
  });

  it("restores every representation of a single item", async () => {
    const data = transfer();

    writeToDataTransfer(data, [{ "text/html": "<b>a</b>", "text/plain": "a" }]);

    const [item] = readFromDataTransfer(data);

    expect(item?.kind).toBe("text");

    if (item?.kind !== "text") return;

    expect([...item.types].sort()).toEqual(["text/html", "text/plain"]);
    await expect(item.getText("text/plain")).resolves.toBe("a");
    await expect(item.getText("text/html")).resolves.toBe("<b>a</b>");
  });

  // Without a custom payload there is nothing to parse, so the native entries are read instead.
  it("collapses native string entries into one item with many types", async () => {
    const data = transfer();

    data.items.add("plain", "text/plain");
    data.items.add("<b>rich</b>", "text/html");

    const items = readFromDataTransfer(data);

    expect(items).toHaveLength(1);

    const [item] = items;

    if (item?.kind !== "text") throw new Error("expected a text item");

    expect([...item.types].sort()).toEqual(["text/html", "text/plain"]);
    await expect(item.getText("text/plain")).resolves.toBe("plain");
  });

  // A truncated or foreign payload under our type must not take the whole read down.
  it("falls back to the native entries when the custom payload will not parse", () => {
    const data = transfer();

    data.items.add("plain", "text/plain");
    data.items.add("{not json", CUSTOM_DRAG_TYPE);

    const items = readFromDataTransfer(data);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("text");
  });
});

describe("DragTypes", () => {
  const typesFor = (entries: [string, string][]): DataTransferDragTypes => {
    const data = transfer();

    for (const [type, value] of entries) data.items.add(value, type);

    return new DataTransferDragTypes(data);
  };

  it("answers for a type that is present and one that is not", () => {
    const types = typesFor([["text/plain", "a"]]);

    expect(types.has("text/plain")).toBe(true);
    expect(types.has("text/html")).toBe(false);
  });

  it("accepts an array and answers true when any member matches", () => {
    const types = typesFor([["text/plain", "a"]]);

    expect(types.has(["text/html", "text/plain"])).toBe(true);
    expect(types.has(["text/html", "image/png"])).toBe(false);
  });

  it("matches a wildcard suffix against every type sharing the prefix", () => {
    const types = typesFor([["image/png", "a"]]);

    expect(types.has("image/*")).toBe(true);
    expect(types.has("video/*")).toBe(false);
  });

  it("matches the full wildcard against anything", () => {
    expect(typesFor([["app/thing", "a"]]).has("*/*")).toBe(true);
  });

  // The custom payload is an implementation detail of the codec, not something a drop target
  // should be able to discover or key behaviour off.
  it("hides the custom drag type from the caller", () => {
    const types = typesFor([
      ["text/plain", "a"],
      [CUSTOM_DRAG_TYPE, "[]"],
    ]);

    expect(types.has(CUSTOM_DRAG_TYPE)).toBe(false);
    expect(types.has("text/plain")).toBe(true);
  });

  it("does not report a directory when the drag carries only known types", () => {
    expect(typesFor([["text/plain", "a"]]).has(DIRECTORY_DRAG_TYPE)).toBe(false);
  });

  // An unidentified file and a directory are indistinguishable until the drop, and both are
  // reported as the generic type.
  it("reports a possible directory when the drag carries an unidentified entry", () => {
    const types = typesFor([["", "a"]]);

    expect(types.has(GENERIC_TYPE)).toBe(true);
    expect(types.has(DIRECTORY_DRAG_TYPE)).toBe(true);
  });
});
