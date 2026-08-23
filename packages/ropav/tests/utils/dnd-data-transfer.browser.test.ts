import {describe, expect, it} from "vitest";

import {CUSTOM_DRAG_TYPE, GENERIC_TYPE} from "@/utils/dnd-constants";
import {
  DataTransferDragTypes,
  readFromDataTransfer,
  writeToDataTransfer,
} from "@/utils/dnd-data-transfer";

/**
 * The codec against a real `DataTransfer`.
 *
 * What jsdom cannot settle: the stub in `@ropav/testing` is a store that answers the way the
 * spec says, so a test passing against it proves the codec agrees with *our reading* of the
 * spec. These prove it agrees with an actual browser — that `items.add` really refuses a
 * duplicate string type, that `types` really grows a `"Files"` entry, and that a `File` really
 * survives the round trip.
 */

const transfer = (): DataTransfer => new DataTransfer();

describe("data transfer codec (browser)", () => {
  describe("round trip", () => {
    it("restores several items of one type", async () => {
      const data = transfer();

      writeToDataTransfer(data, [{"text/plain": "first"}, {"text/plain": "second"}]);

      const items = readFromDataTransfer(data);

      expect(items).toHaveLength(2);

      const texts = await Promise.all(
        items.map((item) => (item.kind === "text" ? item.getText("text/plain") : null)),
      );

      expect(texts).toEqual(["first", "second"]);
    });

    it("restores every representation of a single item", async () => {
      const data = transfer();

      writeToDataTransfer(data, [{"text/html": "<b>a</b>", "text/plain": "a"}]);

      const [item] = readFromDataTransfer(data);

      if (item?.kind !== "text") throw new Error("expected a text item");

      expect([...item.types].sort()).toEqual(["text/html", "text/plain"]);
      await expect(item.getText("text/html")).resolves.toBe("<b>a</b>");
    });

    // The native entries have to stay readable alongside the custom payload, or a drop into a
    // foreign application would receive nothing.
    it("leaves the joined native value readable next to the custom payload", () => {
      const data = transfer();

      writeToDataTransfer(data, [{"text/plain": "first"}, {"text/plain": "second"}]);

      expect([...data.types]).toContain(CUSTOM_DRAG_TYPE);
      expect(data.getData("text/plain")).toBe("first\nsecond");
    });
  });

  describe("files", () => {
    /**
     * A constructed `DataTransfer` cannot carry a *readable* file, in any browser.
     *
     * Measured in Chromium: after `items.add(new File(...))`, the entry reports
     * `kind: "file"` and `getAsFile()` returns the file, but `webkitGetAsEntry()` returns
     * `null` — there is no file system behind it. `readFromDataTransfer` skips such an entry,
     * which is the Firefox phantom-item guard doing its job rather than a defect.
     *
     * So the read path for files is only reachable from a genuine OS drag, which no automated
     * layer here can produce. What is pinned below is the observable consequence, so that a
     * later change to the guard cannot pass unnoticed.
     */
    it("skips a file with no file system entry behind it", () => {
      const data = transfer();

      data.items.add(new File(["hello"], "note.txt", {type: "text/plain"}));

      expect(data.items[0]?.getAsFile()?.name).toBe("note.txt");
      expect(data.items[0]?.webkitGetAsEntry()).toBeNull();
      expect(readFromDataTransfer(data)).toHaveLength(0);
    });

    // Type inspection does not go through `webkitGetAsEntry`, so this half does work on a
    // constructed transfer — and it is the half a drop target uses mid-drag.
    it("still reports the types a file drag carries", () => {
      const data = transfer();

      data.items.add(new File(["x"], "a.bin", {type: ""}));

      const types = new DataTransferDragTypes(data);

      expect(types.has(GENERIC_TYPE)).toBe(true);
      expect([...data.types]).toContain("Files");
    });
  });

  describe("DragTypes", () => {
    it("hides the custom drag type from the caller", () => {
      const data = transfer();

      writeToDataTransfer(data, [{"text/html": "<b>a</b>", "text/plain": "a"}]);

      const types = new DataTransferDragTypes(data);

      expect(types.has(CUSTOM_DRAG_TYPE)).toBe(false);
      expect(types.has("text/plain")).toBe(true);
      expect(types.has("text/html")).toBe(true);
    });

    it("matches a wildcard suffix against a real transfer", () => {
      const data = transfer();

      data.items.add(new File(["x"], "a.png", {type: "image/png"}));

      const types = new DataTransferDragTypes(data);

      expect(types.has("image/*")).toBe(true);
      expect(types.has("video/*")).toBe(false);
    });
  });
});
