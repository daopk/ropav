import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import {TableSortableColumnHeader} from "@/components/table";

import Fixture from "./fixtures.vue";
import SortableFixture from "./sortable-fixtures.vue";

/**
 * Attributes derived from the registries settle at the post-flush of the first tick, which is
 * why every query waits a tick first — the same shape every other Vue collection has.
 */
const renderTable = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  await nextTick();

  const root = result.container.querySelector<HTMLElement>('[data-slot="table"]')!;
  const table = root.querySelector<HTMLTableElement>('[data-slot="table-content"]')!;

  return {
    ...result,
    body: table.querySelector<HTMLElement>("tbody")!,
    columns: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column"]')],
    head: table.querySelector<HTMLElement>("thead")!,
    root,
    rows: [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')],
    table,
  };
};

const cellsOf = (row: HTMLElement) => [...row.querySelectorAll<HTMLElement>("td")];

describe("Table", () => {
  describe("structure", () => {
    // Native table elements rather than divs: the stylesheet keys on `th.table__column`,
    // `tbody`, and `tr:first-child td:first-child`.
    it("renders native table elements with a grid role", async () => {
      const {body, head, root, table} = await renderTable();

      expect(root.tagName).toBe("DIV");
      expect(root).toHaveClass("table-root", "table-root--primary");
      expect(table.tagName).toBe("TABLE");
      expect(table).toHaveAttribute("role", "grid");
      expect(table).toHaveClass("table__content");
      expect(head.tagName).toBe("THEAD");
      expect(head).toHaveAttribute("role", "rowgroup");
      expect(body.tagName).toBe("TBODY");
      expect(body).toHaveAttribute("role", "rowgroup");
    });

    it("wraps the columns in a header row of its own", async () => {
      const {head} = await renderTable();
      const headerRow = head.querySelector("tr")!;

      expect(headerRow).toHaveAttribute("role", "row");
      // The generated header row is structural, so it carries neither a slot nor a class.
      expect(headerRow).not.toHaveAttribute("data-slot");
      expect(headerRow.className).toBe("");
      expect(headerRow.querySelectorAll("th")).toHaveLength(3);
    });

    it("renders the scroll container and the footer outside the table", async () => {
      const {root} = await renderTable({withFooter: true});
      const scroll = root.querySelector('[data-slot="table-scroll-container"]')!;
      const footer = root.querySelector('[data-slot="table-footer"]')!;

      expect(scroll).toHaveClass("table__scroll-container");
      expect(footer).toHaveClass("table__footer");
      expect(scroll.contains(footer)).toBe(false);
      expect(footer.previousElementSibling).toBe(scroll);
    });

    it.each(["primary", "secondary"] as const)("renders the %s variant", async (variant) => {
      const {root} = await renderTable({variant});

      expect(root).toHaveClass(`table-root--${variant}`);
    });

    it("merges a caller class through the variants", async () => {
      const {columns, root} = await renderTable({class: "mt-4", columnClass: "text-end"});

      expect(root).toHaveClass("table-root", "mt-4");
      expect(columns[0]).toHaveClass("table__column", "text-end");
    });
  });

  describe("columns", () => {
    it("numbers the columns from one, the way a grid reports them", async () => {
      const {columns} = await renderTable();

      expect(columns.map((column) => column.getAttribute("aria-colindex"))).toEqual([
        "1",
        "2",
        "3",
      ]);
      expect(columns.map((column) => column.getAttribute("data-key"))).toEqual([
        "name",
        "role",
        "email",
      ]);
      expect(columns[0]).toHaveAttribute("role", "columnheader");
    });

    it("derives each column header id from the table and the column key", async () => {
      const {columns, table} = await renderTable();

      expect(columns[1]!.id).toBe(`${table.id}-role`);
    });

    it("shares one collection marker across every part", async () => {
      const {columns, rows, table} = await renderTable();
      const marker = table.getAttribute("data-collection");

      expect(marker).toBeTruthy();
      expect(columns[0]).toHaveAttribute("data-collection", marker);
      expect(rows[0]).toHaveAttribute("data-collection", marker);
      expect(cellsOf(rows[0]!)[0]).toHaveAttribute("data-collection", marker);
    });
  });

  describe("rows and cells", () => {
    it("keys a row by its id and a cell by the column it landed under", async () => {
      const {rows} = await renderTable();

      expect(rows[0]).toHaveAttribute("data-key", "4586932");
      expect(cellsOf(rows[0]!).map((cell) => cell.getAttribute("data-key"))).toEqual([
        "4586932:name",
        "4586932:role",
        "4586932:email",
      ]);
    });

    it("numbers cells from zero, unlike the columns above them", async () => {
      const {rows} = await renderTable();

      expect(cellsOf(rows[0]!).map((cell) => cell.getAttribute("data-column-index"))).toEqual([
        "0",
        "1",
        "2",
      ]);
    });

    it("gives the row header cell a rowheader role and leaves the rest as grid cells", async () => {
      const {rows} = await renderTable({rowHeaders: ["role"]});
      const cells = cellsOf(rows[0]!);

      expect(cells.map((cell) => cell.getAttribute("role"))).toEqual([
        "gridcell",
        "rowheader",
        "gridcell",
      ]);
    });

    // Only the row header cell is pointed at, so only it needs an id. React Aria puts a
    // generated id on every other cell that nothing reads.
    it("names the row from its row header cell", async () => {
      const {rows, table} = await renderTable();
      const cells = cellsOf(rows[0]!);

      expect(cells[0]!.id).toBe(`${table.id}-4586932-name`);
      expect(rows[0]).toHaveAttribute("aria-labelledby", `${table.id}-4586932-name`);
      expect(cells[1]!.id).toBe("");
    });

    it("points at every row header cell when more than one column asks", async () => {
      const {rows, table} = await renderTable({rowHeaders: ["name", "role"]});

      expect(rows[0]).toHaveAttribute(
        "aria-labelledby",
        `${table.id}-4586932-name ${table.id}-4586932-role`,
      );
    });

    // With no column asking, the first one names the row rather than leaving it unnamed.
    it("falls back to the first column as the row header", async () => {
      const {rows, table} = await renderTable({rowHeaders: []});

      expect(rows[0]).toHaveAttribute("aria-labelledby", `${table.id}-4586932-name`);
      expect(cellsOf(rows[0]!)[0]).toHaveAttribute("role", "rowheader");
    });

    it("exposes the nesting level a tree grid would use", async () => {
      const {rows} = await renderTable();

      expect(rows[0]).toHaveAttribute("data-level", "1");
      expect(rows[0]!.style.getPropertyValue("--table-row-level")).toBe("1");
      expect(cellsOf(rows[0]!)[0]).toHaveAttribute("data-level", "1");
    });
  });

  describe("empty state", () => {
    it("marks the body empty and spans the placeholder across every column", async () => {
      const {body} = await renderTable({users: []});

      expect(body).toHaveAttribute("data-empty", "true");

      const placeholder = body.querySelector("td")!;

      expect(placeholder).toHaveAttribute("colspan", "3");
      expect(placeholder).toHaveAttribute("role", "rowheader");
      expect(placeholder).toHaveTextContent("Nothing here");
      // Structural, so it carries no slot of its own.
      expect(placeholder).not.toHaveAttribute("data-slot");
    });

    it("keeps the placeholder out of a table that has rows", async () => {
      const {body} = await renderTable();

      expect(body).not.toHaveAttribute("data-empty");
      expect(body.querySelectorAll("td")).toHaveLength(6);
    });
  });

  describe("sorting", () => {
    const SORTABLE = ["name", "role"];

    it("reports a sort state on every sortable column and none on the rest", async () => {
      const {columns} = await renderTable({sortableColumns: SORTABLE});

      expect(columns.map((column) => column.getAttribute("aria-sort"))).toEqual([
        "none",
        "none",
        null,
      ]);
      expect(columns.map((column) => column.getAttribute("data-allows-sorting"))).toEqual([
        "true",
        "true",
        null,
      ]);
    });

    it("marks only the sorted column with its direction", async () => {
      const {columns} = await renderTable({
        sortDescriptor: {column: "role", direction: "descending"},
        sortableColumns: SORTABLE,
      });

      expect(columns[0]).toHaveAttribute("aria-sort", "none");
      expect(columns[0]).not.toHaveAttribute("data-sort-direction");
      expect(columns[1]).toHaveAttribute("aria-sort", "descending");
      expect(columns[1]).toHaveAttribute("data-sort-direction", "descending");
    });

    it("starts a new column ascending", async () => {
      const onSortChange = vi.fn();
      const {columns} = await renderTable({onSortChange, sortableColumns: SORTABLE});

      columns[1]!.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await nextTick();

      expect(onSortChange).toHaveBeenCalledWith({column: "role", direction: "ascending"});
    });

    it("flips the column that is already sorted", async () => {
      const onSortChange = vi.fn();
      const {columns} = await renderTable({
        onSortChange,
        sortDescriptor: {column: "name", direction: "ascending"},
        sortableColumns: SORTABLE,
      });

      columns[0]!.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await nextTick();

      expect(onSortChange).toHaveBeenCalledWith({column: "name", direction: "descending"});
    });

    it("leaves a column that does not allow sorting alone", async () => {
      const onSortChange = vi.fn();
      const {columns} = await renderTable({onSortChange, sortableColumns: SORTABLE});

      columns[2]!.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await nextTick();

      expect(onSortChange).not.toHaveBeenCalled();
    });

    // A `th` is not a button, so neither key reaches it as a click.
    it.each(["Enter", " "])("sorts on %s from the keyboard", async (key) => {
      const onSortChange = vi.fn();
      const {columns} = await renderTable({onSortChange, sortableColumns: SORTABLE});

      const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key});

      columns[0]!.dispatchEvent(event);
      await nextTick();

      expect(onSortChange).toHaveBeenCalledWith({column: "name", direction: "ascending"});
      // Space would scroll the table, and either key would reach the grid's own handler.
      expect(event.defaultPrevented).toBe(true);
    });

    it("ignores other keys", async () => {
      const onSortChange = vi.fn();
      const {columns} = await renderTable({onSortChange, sortableColumns: SORTABLE});

      columns[0]!.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "a"}));
      await nextTick();

      expect(onSortChange).not.toHaveBeenCalled();
    });

    it("says a sortable column can be pressed", async () => {
      const {columns} = await renderTable({sortableColumns: SORTABLE});
      const describedBy = columns[0]!.getAttribute("aria-describedby")!;

      expect(document.getElementById(describedBy)).toHaveTextContent("sortable");
      expect(columns[2]).not.toHaveAttribute("aria-describedby");
    });

    it("describes the table by the order it is sorted in", async () => {
      const {table} = await renderTable({
        sortDescriptor: {column: "role", direction: "descending"},
        sortableColumns: SORTABLE,
      });
      const describedBy = table.getAttribute("aria-describedby")!;

      expect(document.getElementById(describedBy)).toHaveTextContent(
        "sorted by column Role in descending order",
      );
    });

    it("leaves the table undescribed while nothing is sorted", async () => {
      const {table} = await renderTable({sortableColumns: SORTABLE});

      // Absent rather than empty: React Aria renders `aria-describedby=""` here.
      expect(table).not.toHaveAttribute("aria-describedby");
    });

    it("reports hover and press only where a press does something", async () => {
      const {columns} = await renderTable({sortableColumns: SORTABLE});
      const sortable = columns[0]!;
      const plain = columns[2]!;

      for (const column of [sortable, plain]) {
        column.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true}));
        column.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      }
      await nextTick();

      expect(sortable).toHaveAttribute("data-hovered", "true");
      expect(sortable).toHaveAttribute("data-pressed", "true");
      expect(plain).not.toHaveAttribute("data-hovered");
      expect(plain).not.toHaveAttribute("data-pressed");

      window.dispatchEvent(new PointerEvent("pointerup"));
    });

    // The stylesheet's only focus branch is the attribute one, so a column with no
    // `data-focus-visible` has no ring at all.
    it("reports focus on every column, sortable or not", async () => {
      const {columns} = await renderTable({sortableColumns: SORTABLE});

      columns[2]!.dispatchEvent(new FocusEvent("focus", {bubbles: false}));
      await nextTick();

      expect(columns[2]).toHaveAttribute("data-focused", "true");
    });

    it("hands the sort state to the column slot", async () => {
      const {columns} = await renderTable({
        sortDescriptor: {column: "name", direction: "ascending"},
        sortableColumns: SORTABLE,
        withSortableHeader: true,
      });

      const indicator = columns[0]!.querySelector('[data-slot="table-sortable-column-indicator"]');

      expect(indicator).toHaveAttribute("data-direction", "ascending");
      expect(columns[1]!.querySelector('[data-slot="table-sortable-column-indicator"]')).toBeNull();
    });
  });

  describe("sortable column header", () => {
    const renderHeader = (props: Record<string, unknown> = {}) =>
      renderVapor(SortableFixture, {props});

    it("renders no indicator until a direction is set", () => {
      const {container, unmount} = renderHeader();
      const header = container.querySelector('[data-slot="table-sortable-column-header"]')!;

      expect(header).toHaveClass("table__sortable-column-header");
      expect(header).not.toHaveAttribute("data-direction");
      expect(header.querySelector('[data-slot="table-sortable-column-indicator"]')).toBeNull();

      unmount();
    });

    it.each(["ascending", "descending"] as const)("reflects the %s direction", (direction) => {
      const {container, unmount} = renderHeader({sortDirection: direction});
      const header = container.querySelector('[data-slot="table-sortable-column-header"]')!;
      const indicator = header.querySelector('[data-slot="table-sortable-column-indicator"]')!;

      expect(header).toHaveAttribute("data-direction", direction);
      expect(indicator).toHaveAttribute("data-direction", direction);
      expect(indicator).toHaveClass("table__sortable-column-indicator");
      expect(indicator.querySelector("svg")).not.toBeNull();

      unmount();
    });

    it("can be asked for the label without the indicator", () => {
      const {container, unmount} = renderHeader({
        showIndicator: false,
        sortDirection: "ascending",
      });
      const header = container.querySelector('[data-slot="table-sortable-column-header"]')!;

      expect(header).toHaveAttribute("data-direction", "ascending");
      expect(header.querySelector('[data-slot="table-sortable-column-indicator"]')).toBeNull();

      unmount();
    });

    it("is a part of the compound component", () => {
      expect(TableSortableColumnHeader).toBeDefined();
    });
  });
});
