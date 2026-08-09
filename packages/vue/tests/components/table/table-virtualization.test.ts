import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import VirtualizedFixture from "./virtualized-fixtures.vue";

const users = Array.from({length: 1000}, (_, index) => ({
  email: `user${index}@acme.com`,
  id: index + 1,
  name: `User ${index}`,
  role: `Role ${index % 3}`,
}));

/**
 * jsdom lays nothing out. The measurements are defined on the grid element itself — not on
 * `HTMLElement.prototype`, which would make every wrapper claim to be 500px tall and let the
 * window agree with a layout that is wrong.
 */
const measure = async (grid: HTMLElement, size = {height: 500, width: 700}) => {
  Object.defineProperty(grid, "clientWidth", {configurable: true, value: size.width});
  Object.defineProperty(grid, "clientHeight", {configurable: true, value: size.height});
  window.dispatchEvent(new Event("resize"));
  await nextTick();
  await nextTick();
};

const scrollTo = async (grid: HTMLElement, top: number) => {
  grid.scrollTop = top;
  grid.dispatchEvent(new Event("scroll"));
  await nextTick();
};

const renderVirtualized = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(VirtualizedFixture, {props: {items: users, ...props}});
  const grid = rendered.getByRole("grid");

  await measure(grid);

  return {...rendered, grid};
};

const rowsOf = (grid: HTMLElement) => [
  ...grid.querySelectorAll<HTMLElement>('[data-slot="table-row"]'),
];

const rowKeys = (grid: HTMLElement) =>
  rowsOf(grid).map((row) => row.getAttribute("data-key") ?? "");

/** The wrapper the layout positions a part with, which is the part's parent when virtualized. */
const wrapperOf = (element: Element) => element.parentElement!;

const cellsOf = (row: HTMLElement) => [
  ...row.querySelectorAll<HTMLElement>('[data-slot="table-cell"]'),
];

const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
};

describe("Table virtualization", () => {
  describe("the rendered set", () => {
    it("renders a window of the rows rather than all of them", async () => {
      const {grid, unmount} = await renderVirtualized();

      // 500px of viewport plus a third overscanned, snapped up to 16 whole rows of 42.
      expect(rowsOf(grid)).toHaveLength(16);
      expect(rowKeys(grid)[0]).toBe("1");
      expect(rowKeys(grid).at(-1)).toBe("16");

      unmount();
    });

    it("gives the scroll box something the size of the whole collection", async () => {
      const {grid, unmount} = await renderVirtualized();
      const content = grid.firstElementChild as HTMLElement;

      expect(content.getAttribute("role")).toBe("presentation");
      // A 42px header plus 1000 rows of 42, so the scrollbar describes the collection.
      expect(content.style.height).toBe("42042px");
      expect(content.style.position).toBe("relative");

      unmount();
    });

    it("moves the window when the box scrolls", async () => {
      const {grid, unmount} = await renderVirtualized();

      await scrollTo(grid, 5_000);

      // Snapped back to 4998, which row 118 ends exactly on — and a row ending on the top edge
      // counts as being above the window.
      expect(rowKeys(grid)[0]).toBe("119");
      expect(rowKeys(grid)).not.toContain("1");
      expect(wrapperOf(rowsOf(grid)[0]!).style.top).toBe(`${118 * 42}px`);

      unmount();
    });

    it("renders nothing until the box has been measured", () => {
      const {getByRole, unmount} = renderVapor(VirtualizedFixture, {props: {items: users}});
      const grid = getByRole("grid");

      // A virtualizer that guessed here would put a thousand rows in the DOM.
      expect(rowsOf(grid)).toEqual([]);

      unmount();
    });
  });

  describe("the elements", () => {
    it("renders the whole table out of divs, keeping every role", async () => {
      const {grid, unmount} = await renderVirtualized();
      const row = rowsOf(grid)[0]!;

      expect(grid.tagName).toBe("DIV");
      expect(grid.querySelector('[data-slot="table-header"]')?.tagName).toBe("DIV");
      expect(grid.querySelector('[data-slot="table-header"]')?.getAttribute("role")).toBe(
        "rowgroup",
      );
      expect(grid.querySelector('[data-slot="table-body"]')?.tagName).toBe("DIV");
      expect(grid.querySelector('[data-slot="table-column"]')?.tagName).toBe("DIV");
      expect(row.tagName).toBe("DIV");
      expect(row.getAttribute("role")).toBe("row");
      expect(cellsOf(row)[0]?.tagName).toBe("DIV");
      // The row header cell keeps naming its row, which is what `aria-labelledby` points at.
      expect(cellsOf(row)[0]?.getAttribute("role")).toBe("rowheader");
      expect(cellsOf(row)[1]?.getAttribute("role")).toBe("gridcell");

      unmount();
    });

    it("leaves a table without a virtualizer exactly as it was", async () => {
      const {getByRole, unmount} = renderVapor(VirtualizedFixture, {
        props: {items: users.slice(0, 3), withoutVirtualizer: true},
      });

      await nextTick();

      const grid = getByRole("grid");

      expect(grid.tagName).toBe("TABLE");
      expect(grid.querySelector('[data-slot="table-body"]')?.tagName).toBe("TBODY");
      expect(rowsOf(grid)[0]?.tagName).toBe("TR");
      expect(grid.querySelector('[data-slot="table-cell"]')?.tagName).toBe("TD");
      expect(grid.querySelector('[role="presentation"]')).toBeNull();
      expect(grid.getAttribute("aria-rowcount")).toBeNull();

      unmount();
    });
  });

  describe("the geometry", () => {
    it("sticks the header above the rows that scroll under it", async () => {
      const {grid, unmount} = await renderVirtualized();
      const header = wrapperOf(grid.querySelector('[data-slot="table-header"]')!);

      expect(header.style.position).toBe("sticky");
      expect(header.style.top).toBe("0px");
      expect(header.style.zIndex).toBe("1");
      // Laid out in normal flow, so `inline-block` is what keeps it from taking a row of its own.
      expect(header.style.display).toBe("inline-block");

      unmount();
    });

    it("places each column at the width it was given, back to front", async () => {
      const {grid, unmount} = await renderVirtualized();
      const columns = [...grid.querySelectorAll('[data-slot="table-column"]')].map(wrapperOf);

      // 700px divided over three `1fr` columns, with `email`'s 240px minimum taking its share
      // first and the other two splitting what is left.
      expect(columns.map((column) => column.style.left)).toEqual(["0px", "230px", "460px"]);
      expect(columns.map((column) => column.style.width)).toEqual(["230px", "230px", "240px"]);
      expect(columns.map((column) => column.style.zIndex)).toEqual(["4", "3", "2"]);

      unmount();
    });

    it("stacks the rows at the offsets the layout worked out", async () => {
      const {grid, unmount} = await renderVirtualized();
      const [first, second] = rowsOf(grid).map(wrapperOf);

      expect(first!.style.position).toBe("absolute");
      expect(first!.style.top).toBe("0px");
      expect(first!.style.height).toBe("42px");
      expect(second!.style.top).toBe("42px");
      // Sized by the layout; a focus ring drawn inside it is not clipped by that.
      expect(first!.style.overflow).toBe("visible");
      expect(first!.style.contain).toBe("size layout style");

      unmount();
    });

    it("lines each cell up under its own column", async () => {
      const {grid, unmount} = await renderVirtualized();
      const cells = cellsOf(rowsOf(grid)[0]!).map(wrapperOf);

      expect(cells.map((cell) => cell.style.left)).toEqual(["0px", "230px", "460px"]);
      expect(cells.map((cell) => cell.style.width)).toEqual(["230px", "230px", "240px"]);
      // Relative to the row's own wrapper, so every cell of a row sits at its top.
      expect(cells.map((cell) => cell.style.top)).toEqual(["0px", "0px", "0px"]);

      unmount();
    });
  });

  describe("what it reports", () => {
    it("counts the whole collection rather than the window", async () => {
      const {grid, unmount} = await renderVirtualized();

      // A thousand rows plus the header row, which a grid counts as one of them.
      expect(grid.getAttribute("aria-rowcount")).toBe("1001");
      expect(grid.getAttribute("aria-colcount")).toBe("3");

      unmount();
    });

    it("numbers the header row first and the body rows after it", async () => {
      const {grid, unmount} = await renderVirtualized();

      expect(
        grid
          .querySelector('[data-slot="table-header"] [role="row"]')
          ?.getAttribute("aria-rowindex"),
      ).toBe("1");
      expect(rowsOf(grid)[0]?.getAttribute("aria-rowindex")).toBe("2");
      expect(rowsOf(grid).at(-1)?.getAttribute("aria-rowindex")).toBe("17");

      unmount();
    });

    it("numbers each cell's column, since most of the table is absent", async () => {
      const {grid, unmount} = await renderVirtualized();

      expect(cellsOf(rowsOf(grid)[0]!).map((cell) => cell.getAttribute("aria-colindex"))).toEqual([
        "1",
        "2",
        "3",
      ]);

      unmount();
    });

    it("reports being empty with a placeholder that spans the columns", async () => {
      const {grid, unmount} = await renderVirtualized({items: []});
      const body = grid.querySelector('[data-slot="table-body"]')!;
      const placeholder = body.querySelector('[role="rowheader"]') as HTMLElement;

      expect(body.getAttribute("data-empty")).toBe("true");
      expect(placeholder.textContent).toBe("No users");
      // Divs cannot span table columns, so the span is stated rather than laid out, and the
      // placeholder takes itself out of a layout that has no place for it.
      expect(placeholder.getAttribute("aria-colspan")).toBe("3");
      expect(placeholder.getAttribute("colspan")).toBeNull();
      expect(placeholder.style.display).toBe("contents");

      unmount();
    });
  });

  describe("loading more", () => {
    it("keeps the sentinel rendered at the top of a thousand rows", async () => {
      const {grid, unmount} = await renderVirtualized({withLoadMore: true});
      const sentinel = grid.querySelector("[inert]") as HTMLElement;

      // A sentinel that is not in the DOM can never report that it came into view, so the next
      // page would never be asked for.
      expect(sentinel).not.toBeNull();
      // Its wrapper sits after the last row, which is where the layout reserved a place for it.
      expect(wrapperOf(sentinel).style.top).toBe(`${1000 * 42}px`);

      unmount();
    });

    it("spans the columns with the indicator row while loading", async () => {
      const {grid, unmount} = await renderVirtualized({isLoading: true, withLoadMore: true});
      const indicator = grid.querySelector('[data-slot="table-load-more"]')!;
      const cell = indicator.querySelector('[role="rowheader"]') as HTMLElement;

      expect(indicator.tagName).toBe("DIV");
      expect(cell.getAttribute("aria-colspan")).toBe("3");
      expect(cell.style.display).toBe("contents");

      unmount();
    });
  });

  describe("keyboard navigation", () => {
    it("reaches the last row, which was never rendered", async () => {
      const {grid, unmount} = await renderVirtualized();

      press(grid, "End", {ctrlKey: true});
      await nextTick();
      // One more tick: the key becomes persisted first, which is what puts it in the DOM.
      await nextTick();

      expect(document.activeElement?.getAttribute("data-key")).toBe("1000");
      expect(document.activeElement?.getAttribute("aria-rowindex")).toBe("1001");

      unmount();
    });

    it("keeps the focused row rendered after the window has scrolled past it", async () => {
      const {grid, unmount} = await renderVirtualized();

      press(grid, "ArrowDown");
      await nextTick();
      await scrollTo(grid, 5_000);

      // The roving tab stop lives on that element; letting it go would drop focus to the document.
      expect(rowKeys(grid)).toContain("1");
      expect(document.activeElement?.getAttribute("data-key")).toBe("1");

      unmount();
    });

    it("finds a row by typing, even one that never rendered", async () => {
      const {grid, unmount} = await renderVirtualized();

      for (const key of [..."User 999"]) press(grid, key);
      await nextTick();
      await nextTick();

      // The text comes from `itemTextValue`: a row outside the window has no cells to read.
      expect(document.activeElement?.getAttribute("data-key")).toBe("1000");

      unmount();
    });

    it("steps into a cell of a row that is only there because it is focused", async () => {
      const {grid, unmount} = await renderVirtualized();

      press(grid, "ArrowDown");
      await nextTick();
      press(grid, "ArrowRight");
      await nextTick();

      // A cell is found by the column it renders under, not by its place among the row's children
      // — virtualized, it is a grandchild.
      expect(document.activeElement?.getAttribute("data-slot")).toBe("table-cell");
      expect(document.activeElement?.getAttribute("data-column-index")).toBe("0");

      unmount();
    });

    it("selects the whole collection rather than the window", async () => {
      const {grid, unmount} = await renderVirtualized({selectionMode: "multiple"});

      press(grid, "a", {ctrlKey: true});
      await nextTick();

      const rows = rowsOf(grid);

      expect(rows.every((row) => row.getAttribute("aria-selected") === "true")).toBe(true);
      expect(rows).toHaveLength(16);

      unmount();
    });

    it("pages to the end while nothing reports being scrollable", async () => {
      const {grid, unmount} = await renderVirtualized();

      press(grid, "ArrowDown");
      await nextTick();
      press(grid, "PageDown");
      await nextTick();
      await nextTick();

      // No stylesheet is loaded here, so `overflow-auto` never applies and the box does not look
      // scrollable. Paging then collapses to the ends, which is the honest answer for a table
      // with no page to move by. Paging by real geometry is asserted in the browser suite.
      expect(document.activeElement?.getAttribute("data-key")).toBe("1000");

      unmount();
    });
  });
});
