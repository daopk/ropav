import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./resizable-fixtures.vue";

/**
 * jsdom reports `clientWidth` as `0` for everything, and the whole layout is derived from the
 * container's width — so it is stubbed for the length of this suite. Without it every column
 * would come out at the default minimum and nothing about the division could be asserted.
 */
const CONTAINER_WIDTH = 600;

let restoreClientWidth: (() => void) | undefined;

beforeEach(() => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");

  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => CONTAINER_WIDTH,
  });

  restoreClientWidth = () => {
    if (original) Object.defineProperty(HTMLElement.prototype, "clientWidth", original);
  };
});

afterEach(() => restoreClientWidth?.());

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  await nextTick();

  const table = result.container.querySelector<HTMLTableElement>('[data-slot="table-content"]')!;

  return {
    ...result,
    columns: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column"]')],
    container: result.container,
    inputs: [...table.querySelectorAll<HTMLInputElement>('input[type="range"]')],
    resizers: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column-resizer"]')],
    table,
  };
};

const press = (target: HTMLElement, key: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
};

const widthOf = (column: HTMLElement) => parseFloat(column.style.width);

describe("Table column resizing", () => {
  describe("structure", () => {
    it("wraps the table in a container of its own", async () => {
      const { container } = await render();
      const wrapper = container.querySelector('[data-slot="table-resizable-container"]')!;

      expect(wrapper).toHaveClass("rp-table__resizable-container");
      expect(wrapper.querySelector('[data-slot="table-content"]')).not.toBeNull();
    });

    // The browser's own auto layout would ignore the widths the columns were given.
    it("takes the table off auto layout", async () => {
      const { table } = await render();

      expect(table.style.tableLayout).toBe("fixed");
      expect(table.style.width).toBe("min-content");
    });

    it("gives every column an explicit width", async () => {
      const { columns } = await render();

      expect(columns.map(widthOf)).toEqual([200, 200, 200]);
    });

    it("weights the division by the widths the columns asked for", async () => {
      const { columns } = await render({
        columns: [
          { defaultWidth: "2fr", id: "name", name: "Name" },
          { defaultWidth: "1fr", id: "role", name: "Role" },
        ],
      });

      expect(columns.map(widthOf)).toEqual([400, 200]);
    });

    it("resolves a fixed width before dividing the rest", async () => {
      const { columns } = await render({
        columns: [
          { defaultWidth: 200, id: "name", name: "Name" },
          { id: "role", name: "Role" },
          { id: "email", name: "Email" },
        ],
      });

      expect(columns.map(widthOf)).toEqual([200, 200, 200]);
    });
  });

  describe("the resizer", () => {
    it("renders a slider the width can be read and set through", async () => {
      const { columns, inputs, resizers } = await render();

      expect(resizers[0]).toHaveClass("rp-table__column-resizer");
      expect(resizers[0]).toHaveAttribute("role", "presentation");
      expect(inputs[0]).toHaveAttribute("type", "range");
      expect(inputs[0]).toHaveAttribute("aria-orientation", "horizontal");
      // The value a screen reader reads out is the width in pixels, not a bare number.
      expect(inputs[0]).toHaveAttribute("aria-valuetext", "200 pixels");
      expect(inputs[0]).toHaveAttribute("min", "100");
      // Named by itself and by the column it resizes, so it is clear which edge is moving.
      expect(inputs[0]).toHaveAttribute("aria-labelledby", `${inputs[0]!.id} ${columns[0]!.id}`);
    });

    it("says how to start resizing until resizing has started", async () => {
      const { inputs } = await render();
      const describedBy = inputs[0]!.getAttribute("aria-describedby")!;

      expect(document.getElementById(describedBy)).toHaveTextContent(
        "Press Enter to start resizing",
      );
    });

    it("only appears on the columns that asked for one", async () => {
      const { resizers } = await render();

      expect(resizers).toHaveLength(2);
    });

    it("reports which way the edge can still move", async () => {
      const { resizers } = await render({
        columns: [
          { id: "name", minWidth: 300, name: "Name", withResizer: true },
          { id: "role", name: "Role", withResizer: true },
        ],
      });

      // Already at its minimum, so the edge can only go one way.
      expect(resizers[0]).toHaveAttribute("data-resizable-direction", "left");
      expect(resizers[1]).toHaveAttribute("data-resizable-direction", "both");
    });
  });

  describe("resizing by keyboard", () => {
    it("opens and closes a resize on Enter", async () => {
      const { columns, resizers } = await render();

      press(resizers[0]!, "Enter");
      await nextTick();

      expect(resizers[0]).toHaveAttribute("data-resizing", "true");
      expect(columns[0]).toHaveAttribute("data-resizing", "true");

      press(resizers[0]!, "Enter");
      await nextTick();

      expect(resizers[0]).not.toHaveAttribute("data-resizing");
    });

    it("takes focus to the slider while resizing", async () => {
      const { inputs, resizers } = await render();

      press(resizers[0]!, "Enter");
      await nextTick();

      expect(document.activeElement).toBe(inputs[0]);
    });

    it("moves the edge by ten pixels an arrow press", async () => {
      const { columns, resizers } = await render();

      press(resizers[0]!, "Enter");
      press(resizers[0]!, "ArrowRight");
      await nextTick();

      expect(widthOf(columns[0]!)).toBe(210);

      press(resizers[0]!, "ArrowLeft");
      press(resizers[0]!, "ArrowLeft");
      await nextTick();

      expect(widthOf(columns[0]!)).toBe(190);
    });

    it("stops at the column's minimum", async () => {
      const { columns, resizers } = await render({
        columns: [
          { id: "name", minWidth: 190, name: "Name", withResizer: true },
          { id: "role", name: "Role", withResizer: true },
        ],
      });

      press(resizers[0]!, "Enter");
      for (let i = 0; i < 20; i++) press(resizers[0]!, "ArrowLeft");
      await nextTick();

      expect(widthOf(columns[0]!)).toBe(190);
    });

    it("stops at the column's maximum", async () => {
      const { columns, resizers } = await render({
        columns: [
          { id: "name", maxWidth: 320, name: "Name", withResizer: true },
          { id: "role", name: "Role", withResizer: true },
        ],
      });

      press(resizers[0]!, "Enter");
      for (let i = 0; i < 20; i++) press(resizers[0]!, "ArrowRight");
      await nextTick();

      expect(widthOf(columns[0]!)).toBe(320);
    });

    it.each(["Escape", " "])("closes the resize on %s", async (key) => {
      const { resizers } = await render();

      press(resizers[0]!, "Enter");
      await nextTick();
      press(resizers[0]!, key);
      await nextTick();

      expect(resizers[0]).not.toHaveAttribute("data-resizing");
    });

    // Only the columns to the **left** of the dragged edge are pinned; the ones to the right stay
    // fractional and divide what is left again, so the table itself never grows.
    it("takes the width it gained from the columns after it", async () => {
      const { columns, resizers } = await render();

      press(resizers[0]!, "Enter");
      press(resizers[0]!, "ArrowRight");
      await nextTick();

      expect(columns.map(widthOf)).toEqual([210, 195, 195]);
    });

    it("leaves a width the caller controls alone", async () => {
      const { columns, resizers } = await render({
        columns: [
          { id: "name", name: "Name", withResizer: true },
          { id: "role", name: "Role", width: 150 },
          { id: "email", name: "Email" },
        ],
      });

      press(resizers[0]!, "Enter");
      press(resizers[0]!, "ArrowRight");
      await nextTick();

      expect(widthOf(columns[1]!)).toBe(150);
    });
  });

  describe("reporting a resize", () => {
    it("reports the widths at the start, on every step and at the end", async () => {
      const onResize = vi.fn();
      const onResizeEnd = vi.fn();
      const onResizeStart = vi.fn();
      const { resizers } = await render({ onResize, onResizeEnd, onResizeStart });

      press(resizers[0]!, "Enter");
      await nextTick();

      expect(onResizeStart).toHaveBeenCalledTimes(1);

      press(resizers[0]!, "ArrowRight");
      await nextTick();

      expect(onResize).toHaveBeenCalledTimes(1);
      expect(onResize.mock.lastCall![0].get("name")).toBe(210);

      press(resizers[0]!, "Enter");
      await nextTick();

      expect(onResizeEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe("giving up the arrow keys", () => {
    /**
     * While a column is being resized the arrows belong to the resizer, so the grid must not also
     * move focus with them — React Aria turns its own navigation off for the duration.
     */
    it("stops the grid navigating while a column is being resized", async () => {
      const { resizers, table } = await render();

      table.focus();
      await nextTick();

      const focusedBefore = document.activeElement;

      press(resizers[0]!, "Enter");
      await nextTick();
      press(resizers[0]!, "ArrowDown");
      await nextTick();

      // Focus is on the slider and stayed there: the grid did not step to the next row.
      expect(document.activeElement).not.toBe(focusedBefore);
      expect(document.activeElement).toBe(
        resizers[0]!.querySelector<HTMLInputElement>('input[type="range"]'),
      );
    });
  });
});
