import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";
import ResizableFixture from "./resizable-fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  await nextTick();

  const root = result.container.querySelector<HTMLElement>('[data-slot="table"]')!;
  const table = root.querySelector<HTMLTableElement>('[data-slot="table-content"]')!;

  return {
    ...result,
    columns: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column"]')],
    root,
    rows: [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')],
    table,
  };
};

/** What holds focus, named the way the table's own attributes name it. */
const focusName = () => {
  const active = document.activeElement as HTMLElement | null;

  if (!active) return null;

  const slot = active.getAttribute("data-slot");

  return slot == null ? active.tagName.toLowerCase() : `${slot}:${active.getAttribute("data-key")}`;
};

/**
 * What jsdom cannot settle: a press from a real pointer, keys from a real keyboard, and a focus
 * ring the stylesheet paints with a shadow rather than an outline.
 */
describe("Table (browser)", () => {
  describe("pointer", () => {
    it("selects a row from a real press", async () => {
      const { rows, unmount } = await render({ selectionMode: "multiple" });

      await userEvent.click(rows[0]!);

      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      unmount();
    });

    // The checkbox sits inside the row, so a press it did not claim would reach the row too and
    // the two toggles would cancel out.
    it("selects exactly once when the checkbox itself is pressed", async () => {
      const { rows, unmount } = await render({
        selectionMode: "multiple",
        withSelectionColumn: true,
      });
      const control = rows[0]!.querySelector<HTMLElement>('[data-slot="checkbox-control"]')!;

      await userEvent.click(control);

      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      await userEvent.click(control);

      expect(rows[0]).toHaveAttribute("aria-selected", "false");

      unmount();
    });

    it("leaves the row alone when a control inside a cell is pressed", async () => {
      const { rows, unmount } = await render({ selectionMode: "multiple" });
      const button = document.createElement("button");

      button.textContent = "Edit";
      rows[0]!.querySelector("td")!.append(button);

      await userEvent.click(button);

      expect(rows[0]).toHaveAttribute("aria-selected", "false");

      unmount();
    });

    it("reports hover on the row a real pointer is over", async () => {
      const { rows, unmount } = await render();

      await userEvent.hover(rows[0]!);

      expect(rows[0]).toHaveAttribute("data-hovered", "true");

      unmount();
    });
  });

  describe("keyboard", () => {
    it("walks the grid in both directions from a real keyboard", async () => {
      const { table, unmount } = await render({ selectionMode: "multiple" });

      table.focus();
      await nextTick();

      expect(focusName()).toBe("table-row:4586932");

      await userEvent.keyboard("{ArrowRight}");
      expect(focusName()).toBe("table-cell:4586932:name");

      await userEvent.keyboard("{ArrowDown}");
      expect(focusName()).toBe("table-cell:5273849:name");

      await userEvent.keyboard("{ArrowUp}{ArrowUp}");
      expect(focusName()).toBe("table-column:name");

      unmount();
    });

    it("selects the focused row from a real Space", async () => {
      const { rows, table, unmount } = await render({ selectionMode: "multiple" });

      table.focus();
      await nextTick();
      await userEvent.keyboard(" ");

      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      unmount();
    });

    // Entering the grid claims a row as the tab stop, and doing that by moving focus would make
    // every control inside a cell unreachable by keyboard.
    it("leaves focus on a control inside a cell", async () => {
      const { rows, unmount } = await render({
        selectionMode: "multiple",
        withSelectionColumn: true,
      });
      const checkbox = rows[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

      checkbox.focus();
      await nextTick();
      await nextTick();

      expect(document.activeElement).toBe(checkbox);

      unmount();
    });

    it("leaves a real Space to the checkbox it landed on", async () => {
      const { rows, unmount } = await render({
        selectionMode: "multiple",
        withSelectionColumn: true,
      });
      const checkbox = rows[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

      checkbox.focus();
      await userEvent.keyboard(" ");

      // The checkbox toggled its own row exactly once — the grid did not treat the key as a
      // second selection on top of it.
      expect(rows[0]).toHaveAttribute("aria-selected", "true");

      unmount();
    });
  });

  describe("focus ring", () => {
    // The stylesheet draws every table ring with an inset shadow, so asserting an outline width
    // would pass while nothing was painted at all.
    it("paints a row's ring with a shadow rather than an outline", async () => {
      const { rows, unmount } = await render();

      rows[0]!.setAttribute("data-focus-visible", "true");
      await nextTick();

      const cell = rows[0]!.querySelector<HTMLElement>('[data-slot="table-cell"]')!;

      expect(getComputedStyle(cell).boxShadow).not.toBe("none");
      expect(getComputedStyle(cell).outlineStyle).toBe("none");

      unmount();
    });

    it("paints a cell's own ring with a shadow", async () => {
      const { rows, unmount } = await render();
      const cell = rows[0]!.querySelector<HTMLElement>('[data-slot="table-cell"]')!;

      cell.setAttribute("data-focus-visible", "true");
      await nextTick();

      expect(getComputedStyle(cell).boxShadow).not.toBe("none");

      unmount();
    });

    it("paints a column header's ring with a shadow", async () => {
      const { columns, unmount } = await render();

      columns[0]!.setAttribute("data-focus-visible", "true");
      await nextTick();

      expect(getComputedStyle(columns[0]!).boxShadow).not.toBe("none");

      unmount();
    });
  });

  describe("accessibility", () => {
    // A grid with a header row, row header cells and a selection column is the shape axe checks
    // hardest: every role has to nest the way the table markup claims it does.
    it("has no violations as a selectable grid", async () => {
      const { container, unmount } = await render({
        selectionMode: "multiple",
        withSelectionColumn: true,
      });

      // `color-contrast` is scoped out, not silenced: `.table__column` paints its label in
      // `--muted` (#71717a) on `--surface-secondary` (#efeff0) at 12px for 4.2:1, under the
      // 4.5:1 WCAG AA floor. Both colours come out of `@ropav/styles` and measure identical on
      // React at 6006, so the shortfall belongs to the palette rather than to this port.
      await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

      unmount();
    });

    it("has no violations while sorted", async () => {
      const { container, unmount } = await render({
        sortDescriptor: { column: "name", direction: "ascending" },
        sortableColumns: ["name", "role"],
        withSortableHeader: true,
      });

      // Same palette shortfall as above; every other rule still runs.
      await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

      unmount();
    });

    it("has no violations with the empty state showing", async () => {
      const { container, unmount } = await render({ users: [] });

      // Same palette shortfall as above; every other rule still runs.
      await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

      unmount();
    });
  });
});

describe("Table load more (browser)", () => {
  // jsdom has no `IntersectionObserver` at all, so whether the sentinel is actually watched — and
  // against which box — can only be settled here.
  it("asks for more as soon as the end is within reach", async () => {
    const onLoadMore = vi.fn();
    const { unmount } = await render({ onLoadMore, withLoadMore: true });

    await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());

    unmount();
  });

  it("waits until the end is scrolled into view", async () => {
    const onLoadMore = vi.fn();
    const { root, unmount } = await render({
      onLoadMore,
      scrollContainerStyle: { height: "60px", overflowY: "auto" },
      scrollOffset: 0,
      users: Array.from({ length: 40 }, (_, index) => ({
        email: `user${index}@acme.com`,
        id: index + 1,
        name: `User ${index}`,
        role: "Engineer",
      })),
      withLoadMore: true,
    });
    const scroll = root.querySelector<HTMLElement>('[data-slot="table-scroll-container"]')!;

    // Give the observer a frame to report the sentinel far below the fold.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(onLoadMore).not.toHaveBeenCalled();

    scroll.scrollTop = scroll.scrollHeight;

    await vi.waitFor(() => expect(onLoadMore).toHaveBeenCalled());

    unmount();
  });
});

describe("Table column resizing (browser)", () => {
  const renderResizable = async (props: Record<string, unknown> = {}) => {
    const result = renderVapor(ResizableFixture, { props });

    await nextTick();

    const table = result.container.querySelector<HTMLTableElement>('[data-slot="table-content"]')!;

    return {
      ...result,
      columns: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column"]')],
      resizers: [...table.querySelectorAll<HTMLElement>('[data-slot="table-column-resizer"]')],
      table,
    };
  };

  const widthOf = (column: HTMLElement) => parseFloat(column.style.width);

  it("divides a real container width between the columns", async () => {
    const { columns, container, unmount } = await renderResizable();
    const box = container.querySelector<HTMLElement>('[data-slot="table-resizable-container"]')!;
    const total = columns.reduce((sum, column) => sum + widthOf(column), 0);

    // Measured from the scrollable box rather than from the table, which is what lets a table
    // wider than its container keep its columns and scroll.
    expect(box.clientWidth).toBeGreaterThan(0);
    expect(total).toBe(box.clientWidth);

    unmount();
  });

  /**
   * The handle is translated half-way out of its own column header, so its centre lands exactly on
   * the boundary where the next header covers it. Every pointer position here is inside the half
   * that belongs to this column — which is also the half a user can reach in React.
   */
  it("moves the edge under a real pointer drag", async () => {
    const { columns, resizers, unmount } = await renderResizable();
    const before = widthOf(columns[0]!);

    await userEvent.dragAndDrop(resizers[0]!, resizers[1]!, {
      sourcePosition: { x: 4, y: 8 },
      targetPosition: { x: 4, y: 8 },
    });

    expect(widthOf(columns[0]!)).toBeGreaterThan(before);
    // The drag closed on release, so the resizer is not left in edit mode.
    expect(resizers[0]).not.toHaveAttribute("data-resizing");

    unmount();
  });

  it("shows the handle under a real pointer", async () => {
    const { resizers, unmount } = await renderResizable();

    await userEvent.hover(resizers[0]!, { position: { x: 4, y: 8 } });

    expect(resizers[0]).toHaveAttribute("data-hovered", "true");

    await settled(resizers[0]!);

    // The hairline separator becomes a full-height accent bar, which is the only affordance
    // saying the edge can be dragged.
    expect(getComputedStyle(resizers[0]!).width).toBe("2px");

    unmount();
  });

  it("has no violations as a resizable grid", async () => {
    const { container, unmount } = await renderResizable();

    // Same palette shortfall as the other grids; every other rule still runs.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
