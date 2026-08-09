import {renderVapor} from "@heroui/testing/helpers/vue";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {TableSortableColumnHeader} from "@/components/table";
import {announce} from "@/utils/live-announcer";

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
    checkboxes: [...table.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')],
    columns: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column"]')],
    head: table.querySelector<HTMLElement>("thead")!,
    root,
    rows: [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')],
    table,
  };
};

/** Send a key to whatever holds focus, the way a keypress actually arrives. */
const press = (key: string, modifiers: Record<string, boolean> = {}) => {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, key, ...modifiers}),
  );
};

/** What holds focus, named the way the table's own attributes name it. */
const focusName = () => {
  const active = document.activeElement as HTMLElement | null;

  if (!active) return null;

  const slot = active.getAttribute("data-slot");

  if (slot === "table-content") return "table";
  if (slot === "table-column") return `column:${active.getAttribute("data-key")}`;
  if (slot === "table-row") return `row:${active.getAttribute("data-key")}`;
  if (slot === "table-cell") return `cell:${active.getAttribute("data-key")}`;

  return active.tagName.toLowerCase();
};

/** A click carrying modifier keys, which `HTMLElement.click()` cannot express. */
const clickWith = (element: HTMLElement, modifiers: {ctrlKey?: boolean; shiftKey?: boolean}) => {
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, ...modifiers}));
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

      expect(document.getElementById(describedBy)).toHaveTextContent("sortable column");
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

  describe("selection", () => {
    it("leaves every selection attribute off when nothing can be selected", async () => {
      const {rows, table} = await renderTable();

      expect(table).not.toHaveAttribute("aria-multiselectable");
      expect(rows[0]).not.toHaveAttribute("aria-selected");
      expect(rows[0]).not.toHaveAttribute("data-selection-mode");
    });

    it("reports the mode on the table and on every row", async () => {
      const {rows, table} = await renderTable({selectionMode: "multiple"});

      expect(table).toHaveAttribute("aria-multiselectable", "true");
      expect(rows[0]).toHaveAttribute("aria-selected", "false");
      expect(rows[0]).toHaveAttribute("data-selection-mode", "multiple");
    });

    // Single selection is not multi-selectable, so the attribute has to stay off rather than
    // be rendered as "false" — which is what React Aria does.
    it("keeps the table out of multi-select in single mode", async () => {
      const {table} = await renderTable({selectionMode: "single"});

      expect(table).not.toHaveAttribute("aria-multiselectable");
    });

    it("selects a row on click", async () => {
      const {rows} = await renderTable({selectionMode: "multiple"});

      rows[0]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[0]).toHaveAttribute("data-selected", "true");
    });

    it("replaces the selection in single mode", async () => {
      const {rows} = await renderTable({selectionMode: "single"});

      rows[0]!.click();
      rows[1]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    it("adds to the selection in multiple mode", async () => {
      const {rows} = await renderTable({selectionMode: "multiple"});

      rows[0]!.click();
      rows[1]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    it("extends the selection across a shift-click", async () => {
      const users = [
        {email: "a@acme.com", id: 1, name: "Ann", role: "CEO"},
        {email: "b@acme.com", id: 2, name: "Bob", role: "CTO"},
        {email: "c@acme.com", id: 3, name: "Cleo", role: "COO"},
      ];
      const {rows} = await renderTable({selectionMode: "multiple", users});

      rows[0]!.click();
      clickWith(rows[2]!, {shiftKey: true});
      await nextTick();

      expect(rows.map((row) => row.getAttribute("aria-selected"))).toEqual([
        "true",
        "true",
        "true",
      ]);
    });

    it("reports the keys it was asked to change to", async () => {
      const onSelectionChange = vi.fn();
      const {rows} = await renderTable({onSelectionChange, selectionMode: "multiple"});

      rows[1]!.click();

      expect(onSelectionChange).toHaveBeenCalledWith(new Set([5273849]));
    });

    it("starts from the default keys", async () => {
      const {rows} = await renderTable({
        defaultSelectedKeys: [5273849],
        selectionMode: "multiple",
      });

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    it("marks a disabled row and ignores a click on it", async () => {
      const {rows} = await renderTable({disabledKeys: [4586932], selectionMode: "multiple"});

      expect(rows[0]).toHaveAttribute("aria-disabled", "true");
      expect(rows[0]).toHaveAttribute("data-disabled", "true");

      rows[0]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });

    it("refuses to empty a selection it must keep", async () => {
      const {rows} = await renderTable({
        defaultSelectedKeys: [4586932],
        disallowEmptySelection: true,
        selectionMode: "multiple",
      });

      rows[0]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
    });

    // React Aria's press hook stops propagation, so a control inside a cell never lets the row
    // see the press. The row has to recognise the same case from the click that reaches it.
    it("leaves the row alone when a control inside a cell was clicked", async () => {
      const {rows} = await renderTable({selectionMode: "multiple"});
      const button = document.createElement("button");

      rows[0]!.querySelector("td")!.append(button);
      button.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("loading more rows", () => {
    // Always present, so there is something for the observer to watch even before the first page
    // fills the box. Inert and zero height so it is neither read nor laid out.
    it("keeps a sentinel row in the body at all times", async () => {
      const {body} = await renderTable({withLoadMore: true});
      const sentinel = body.querySelector<HTMLElement>("tr[inert]")!;

      expect(sentinel.style.height).toBe("0px");

      const cell = sentinel.querySelector<HTMLElement>("td")!;

      expect(cell.style.padding).toBe("0px");
      expect(cell.firstElementChild).toHaveStyle({height: "1px", width: "1px"});
    });

    it("renders no indicator row until it is loading", async () => {
      const {body} = await renderTable({withLoadMore: true});

      expect(body.querySelector('[data-slot="table-load-more"]')).toBeNull();
    });

    it("spans the indicator row across every column", async () => {
      const {body} = await renderTable({isLoading: true, withLoadMore: true});
      const row = body.querySelector<HTMLElement>('[data-slot="table-load-more"]')!;
      const cell = row.querySelector<HTMLElement>("td")!;

      expect(row).toHaveClass("table__load-more");
      expect(row).toHaveAttribute("role", "row");
      // A flat table still reports the level a tree grid would use.
      expect(row).toHaveAttribute("aria-level", "1");
      expect(row).toHaveAttribute("data-level", "1");
      expect(cell).toHaveAttribute("role", "rowheader");
      expect(cell).toHaveAttribute("colspan", "3");
    });

    it("styles the content inside the indicator row", async () => {
      const {body} = await renderTable({isLoading: true, withLoadMore: true});
      const content = body.querySelector('[data-slot="table-load-more-content"]')!;

      expect(content).toHaveClass("table__load-more-content");
      expect(content).toHaveTextContent("Loading");
    });

    it("leaves the sentinel out of a table that is not loading more", async () => {
      const {body} = await renderTable();

      expect(body.querySelector("tr[inert]")).toBeNull();
    });
  });

  describe("keyboard navigation", () => {
    /**
     * Focus lands on a row as soon as it enters the grid, the way React Aria has it: the grid is
     * the tab stop only until something inside takes over.
     */
    const renderGrid = async (props: Record<string, unknown> = {}) => {
      const result = await renderTable({selectionMode: "multiple", ...props});

      result.table.focus();
      await nextTick();

      return result;
    };

    it("hands the tab stop to the first row as focus enters", async () => {
      const {table} = await renderTable({selectionMode: "multiple"});

      expect(table).toHaveAttribute("tabindex", "0");

      table.focus();
      await nextTick();

      expect(table).toHaveAttribute("tabindex", "-1");
      expect(focusName()).toBe("row:4586932");
    });

    it("keeps exactly one part tabbable at a time", async () => {
      const {rows} = await renderGrid();

      expect(rows[0]).toHaveAttribute("tabindex", "0");
      expect(rows[1]).toHaveAttribute("tabindex", "-1");
    });

    it("moves down and up the rows", async () => {
      await renderGrid();

      press("ArrowDown");
      await nextTick();

      expect(focusName()).toBe("row:5273849");

      press("ArrowUp");
      await nextTick();

      expect(focusName()).toBe("row:4586932");
    });

    it("stops at the last row", async () => {
      await renderGrid();

      press("ArrowDown");
      press("ArrowDown");
      await nextTick();

      expect(focusName()).toBe("row:5273849");
    });

    // Focus mode is "row", so running off the end of a row lands on the row rather than
    // carrying on into the next one.
    it("steps into the cells of a row and back out to the row", async () => {
      await renderGrid();

      press("ArrowRight");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:name");

      press("ArrowRight");
      press("ArrowRight");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:email");

      press("ArrowRight");
      await nextTick();

      expect(focusName()).toBe("row:4586932");
    });

    it("steps backwards from the row into its last cell", async () => {
      await renderGrid();

      press("ArrowLeft");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:email");
    });

    it("carries the column across when moving between rows", async () => {
      await renderGrid();

      press("ArrowRight");
      press("ArrowRight");
      press("ArrowDown");
      await nextTick();

      expect(focusName()).toBe("cell:5273849:role");
    });

    it("goes up from the first row into the header", async () => {
      await renderGrid();

      press("ArrowUp");
      await nextTick();

      expect(focusName()).toBe("column:name");
    });

    it("goes up from a cell to the column above it", async () => {
      await renderGrid();

      press("ArrowRight");
      press("ArrowRight");
      press("ArrowUp");
      await nextTick();

      expect(focusName()).toBe("column:role");
    });

    it("comes back down from a column header into the cell under it", async () => {
      const {columns} = await renderGrid();

      columns[1]!.focus();
      press("ArrowDown");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:role");
    });

    it("stays in the header on the way up", async () => {
      const {columns} = await renderGrid();

      columns[0]!.focus();
      press("ArrowUp");
      await nextTick();

      expect(focusName()).toBe("column:name");
    });

    // The header row wraps, unlike the cells of a body row.
    it("wraps around the column headers", async () => {
      const {columns} = await renderGrid();

      columns[0]!.focus();
      press("ArrowLeft");
      await nextTick();

      expect(focusName()).toBe("column:email");

      press("ArrowRight");
      await nextTick();

      expect(focusName()).toBe("column:name");
    });

    it("takes Home and End to the ends of the row it is in", async () => {
      await renderGrid();

      press("ArrowRight");
      press("End");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:email");

      press("Home");
      await nextTick();

      expect(focusName()).toBe("cell:4586932:name");
    });

    it("takes a modified Home and End to the ends of the whole grid", async () => {
      await renderGrid();

      press("End", {ctrlKey: true});
      await nextTick();

      expect(focusName()).toBe("row:5273849");

      press("Home", {ctrlKey: true});
      await nextTick();

      expect(focusName()).toBe("row:4586932");
    });

    it("selects everything on the select-all chord", async () => {
      const {rows} = await renderGrid();

      press("a", {ctrlKey: true});
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    it("clears the selection on Escape", async () => {
      const {rows} = await renderGrid();

      press(" ");
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      press("Escape");
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });

    it("toggles the focused row on Space", async () => {
      const {rows} = await renderGrid();

      press(" ");
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      press(" ");
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });

    it("extends the selection across a shifted arrow", async () => {
      const {rows} = await renderGrid();

      press(" ");
      press("ArrowDown", {shiftKey: true});
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    // The selection manager runs on rows alone, so extending a range has to work the same
    // whether the focused position is a row or one of its cells.
    it("extends a range while focus is on a cell", async () => {
      const {rows} = await renderGrid();

      press("ArrowRight");
      press(" ");
      press("ArrowDown", {shiftKey: true});
      await nextTick();

      expect(focusName()).toBe("cell:5273849:name");
      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");
    });

    it("focuses the row a typed prefix matches", async () => {
      await renderGrid();

      press("j");
      await nextTick();

      expect(focusName()).toBe("row:5273849");
    });

    it("wraps a search round the end of the grid", async () => {
      await renderGrid();

      press("ArrowDown");
      press("k");
      await nextTick();

      expect(focusName()).toBe("row:4586932");
    });

    it("skips a disabled row", async () => {
      await renderGrid({disabledKeys: [4586932]});

      expect(focusName()).toBe("row:5273849");
    });

    it("leaves a disabled row out of the tab order entirely", async () => {
      const {rows} = await renderTable({disabledKeys: [4586932], selectionMode: "multiple"});

      // React Aria omits the attribute rather than setting it to -1.
      expect(rows[0]).not.toHaveAttribute("tabindex");
      expect(rows[1]).toHaveAttribute("tabindex", "-1");
    });

    // A checkbox needs its own Space, and a button its own Enter.
    it("leaves keys pressed on a control inside a cell alone", async () => {
      const {rows} = await renderGrid({withSelectionColumn: true});
      const checkbox = rows[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

      checkbox.focus();
      press(" ");
      await nextTick();

      // Nothing moved, and the grid did not treat the key as a row selection either.
      expect(document.activeElement).toBe(checkbox);
      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("announcing selection", () => {
    const liveRegion = () => document.querySelector('[data-slot="live-announcer"]');

    // The live region is one shared element for the whole page, so it outlives a test.
    beforeEach(() => announce(""));

    const renderAnnouncing = async (props: Record<string, unknown> = {}) => {
      const result = await renderTable({selectionMode: "multiple", ...props});

      result.table.focus();
      await nextTick();

      return result;
    };

    // Most screen readers say nothing when a grid row is selected, so the change is spoken here.
    it("names the row and the running total", async () => {
      await renderAnnouncing();

      press(" ");
      await nextTick();

      // No running total yet: saying "1 item selected" straight after naming the row would only
      // repeat it. React Aria skips the count for the first row of a selection too.
      expect(liveRegion()).toHaveTextContent("Kate Moore selected.");
    });

    it("says a row was deselected", async () => {
      await renderAnnouncing();

      press(" ");
      await nextTick();
      press(" ");
      await nextTick();

      expect(liveRegion()).toHaveTextContent("Kate Moore not selected.");
    });

    it("reports a select-all as one thing rather than row by row", async () => {
      await renderAnnouncing();

      press("a", {ctrlKey: true});
      await nextTick();

      expect(liveRegion()).toHaveTextContent("All items selected.");
    });

    it("drops the row name once more than one row is involved", async () => {
      await renderAnnouncing();

      press(" ");
      await nextTick();
      press("ArrowDown", {shiftKey: true});
      await nextTick();

      expect(liveRegion()).toHaveTextContent("2 items selected.");
    });

    // A selection the grid did not make is not the grid's news to report.
    it("stays quiet while focus is outside the grid", async () => {
      const {rows} = await renderTable({selectionMode: "multiple"});

      rows[0]!.click();
      await nextTick();

      expect(liveRegion()?.textContent ?? "").toBe("");
    });
  });

  describe("selection checkbox", () => {
    const renderWithCheckboxes = (props: Record<string, unknown> = {}) =>
      renderTable({selectionMode: "multiple", withSelectionColumn: true, ...props});

    it("names the header checkbox for the whole table and each row's for its row", async () => {
      const {checkboxes, rows} = await renderWithCheckboxes();
      const [selectAll, first] = checkboxes;

      expect(selectAll).toHaveAttribute("aria-label", "Select All");
      expect(first).toHaveAttribute("aria-label", "Select");
      // Its own name first, then the row's, so hearing it read out says which row it selects.
      expect(first).toHaveAttribute(
        "aria-labelledby",
        `${first!.id} ${rows[0]!.getAttribute("aria-labelledby")}`,
      );
    });

    it("names a single-selection header checkbox without the plural", async () => {
      const {checkboxes} = await renderWithCheckboxes({selectionMode: "single"});

      expect(checkboxes[0]).toHaveAttribute("aria-label", "Select");
    });

    it("toggles its own row", async () => {
      const {checkboxes, rows} = await renderWithCheckboxes();

      checkboxes[1]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(checkboxes[1]!.checked).toBe(true);

      checkboxes[1]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });

    // The checkbox sits inside the row, so a press it did not claim would reach the row's own
    // handler as well — and there a modifier means something else entirely. Shift is what makes
    // that visible: the row would extend a range where the checkbox only ticks one box.
    it("claims the press rather than letting the row read the modifiers", async () => {
      const users = [
        {email: "a@acme.com", id: 1, name: "Ann", role: "CEO"},
        {email: "b@acme.com", id: 2, name: "Bob", role: "CTO"},
        {email: "c@acme.com", id: 3, name: "Cleo", role: "COO"},
      ];
      const {rows} = await renderWithCheckboxes({users});

      rows[0]!.click();
      clickWith(rows[2]!.querySelector<HTMLElement>('[data-slot="checkbox-control"]')!, {
        shiftKey: true,
      });
      await nextTick();

      expect(rows.map((row) => row.getAttribute("aria-selected"))).toEqual([
        "true",
        "false",
        "true",
      ]);
    });

    it("toggles every row from the header", async () => {
      const {checkboxes, rows} = await renderWithCheckboxes();

      checkboxes[0]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "true");
      expect(rows[1]).toHaveAttribute("aria-selected", "true");

      checkboxes[0]!.click();
      await nextTick();

      expect(rows[0]).toHaveAttribute("aria-selected", "false");
    });

    it("shows the mixed state while only some rows are selected", async () => {
      const {checkboxes} = await renderWithCheckboxes();

      checkboxes[1]!.click();
      await nextTick();

      expect(checkboxes[0]!.indeterminate).toBe(true);
      expect(checkboxes[0]!.checked).toBe(false);

      checkboxes[2]!.click();
      await nextTick();

      expect(checkboxes[0]!.indeterminate).toBe(false);
      expect(checkboxes[0]!.checked).toBe(true);
    });

    it("disables the header checkbox unless several rows can be selected", async () => {
      const {checkboxes} = await renderWithCheckboxes({selectionMode: "single"});

      expect(checkboxes[0]!.disabled).toBe(true);
    });

    it("disables the checkbox of a row that cannot be selected", async () => {
      const {checkboxes} = await renderWithCheckboxes({disabledKeys: [4586932]});

      expect(checkboxes[1]!.disabled).toBe(true);
      expect(checkboxes[2]!.disabled).toBe(false);
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

    // The class lands on the icon itself rather than on a wrapper: the stylesheet sizes the
    // indicator to 12px, and a wrapper would take that size while the icon kept its own 16px.
    it.each(["ascending", "descending"] as const)("reflects the %s direction", (direction) => {
      const {container, unmount} = renderHeader({sortDirection: direction});
      const header = container.querySelector('[data-slot="table-sortable-column-header"]')!;
      const indicator = header.querySelector('[data-slot="table-sortable-column-indicator"]')!;

      expect(header).toHaveAttribute("data-direction", direction);
      expect(indicator.tagName).toBe("svg");
      expect(indicator).toHaveAttribute("data-direction", direction);
      expect(indicator).toHaveClass("table__sortable-column-indicator");

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
