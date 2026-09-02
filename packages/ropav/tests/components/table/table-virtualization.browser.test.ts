import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import VirtualizedFixture from "./virtualized-fixtures.vue";

const users = Array.from({ length: 1000 }, (_, index) => ({
  email: `user${index}@acme.com`,
  id: index + 1,
  name: `User ${index}`,
  role: `Role ${index % 3}`,
}));

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await nextTick();
};

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(VirtualizedFixture, { props: { items: users, ...props } });

  await settle();

  const grid = result.container.querySelector<HTMLElement>('[data-slot="table-content"]')!;

  return {
    ...result,
    grid,
    keys: () =>
      [...grid.querySelectorAll<HTMLElement>('[data-slot="table-row"]')].map((row) =>
        row.getAttribute("data-key"),
      ),
    scrollTo: async (top: number) => {
      grid.scrollTop = top;
      await settle();
    },
  };
};

/**
 * The page is shared, both between the tests in this file and between files: a 42 000px tall table
 * scrolls the *page* when a row is brought into view, and a page left scrolled changes which
 * ancestor's background an element sits against. Reset before rendering rather than after, so a
 * file that ran earlier cannot leave this one measuring against the wrong background.
 */
beforeEach(() => {
  window.scrollTo(0, 0);
});

const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key, ...init }));
};

const POINTER = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" } as const;

const centreOf = (element: Element) => {
  const box = element.getBoundingClientRect();

  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

const scrollbar = (grid: HTMLElement, orientation: "horizontal" | "vertical") =>
  grid.querySelector<HTMLElement>(
    `[data-slot="virtualizer-scrollbar-track"][data-orientation="${orientation}"]`,
  );

const thumbOf = (bar: HTMLElement) =>
  bar.querySelector<HTMLElement>('[data-slot="virtualizer-scrollbar-thumb"]')!;

/**
 * A drag on a thumb, moved on `window` where the move composable listens.
 *
 * Only a tick is awaited after the move, on purpose. The rows for the new offset have to be in the
 * DOM before the browser can draw a frame at it, or the compositor would draw one without them —
 * which is the whole reason the table draws its own scrollbar. Returns the release.
 */
const dragThumb = async (thumb: HTMLElement, by: { x?: number; y?: number }) => {
  const from = centreOf(thumb);
  const to = { x: from.x + (by.x ?? 0), y: from.y + (by.y ?? 0) };

  thumb.dispatchEvent(
    new PointerEvent("pointerdown", { ...POINTER, clientX: from.x, clientY: from.y }),
  );
  window.dispatchEvent(
    new PointerEvent("pointermove", { ...POINTER, clientX: to.x, clientY: to.y }),
  );
  await nextTick();

  return () => {
    window.dispatchEvent(
      new PointerEvent("pointerup", { ...POINTER, clientX: to.x, clientY: to.y }),
    );
  };
};

/**
 * Everything here needs a real layout: the scroll box is only scrollable because the stylesheet
 * applies `overflow-auto`, the header only sticks because `position: sticky` resolves against a
 * real scroll container, and the column widths are only divided over a box that was measured.
 */
describe("Table virtualization (browser)", () => {
  it("measures the box itself and renders a window", async () => {
    const { grid, keys, unmount } = await render();

    // No mocked geometry: 500px of real box over 42px rows, plus the overscan.
    expect(getComputedStyle(grid).overflow).toBe("auto");
    expect(keys()[0]).toBe("1");
    expect(keys().length).toBeGreaterThan(11);
    expect(keys().length).toBeLessThan(24);

    unmount();
  });

  it("keeps the header above the rows that scroll under it", async () => {
    const { grid, keys, scrollTo, unmount } = await render();
    const header = grid.querySelector<HTMLElement>('[data-slot="table-header"]')!.parentElement!;
    const before = header.getBoundingClientRect().top;

    await scrollTo(2_000);

    // Sticky, so the header has not moved while a thousand rows went past behind it.
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(header.getBoundingClientRect().top).toBeCloseTo(before, 0);
    expect(keys()[0]).not.toBe("1");

    unmount();
  });

  it("lays the columns out over the real width of the box", async () => {
    const { grid, unmount } = await render();
    const columns = [...grid.querySelectorAll<HTMLElement>('[data-slot="table-column"]')];
    const cells = [
      ...grid.querySelectorAll<HTMLElement>('[data-slot="table-row"]:first-of-type'),
    ][0]!;

    // Each cell is exactly as wide as its column and starts at the same offset — which is the
    // whole point of the layout being told the widths rather than measuring them.
    const columnRects = columns.map((column) => column.getBoundingClientRect());
    const cellRects = [...cells.querySelectorAll<HTMLElement>('[data-slot="table-cell"]')].map(
      (cell) => cell.getBoundingClientRect(),
    );

    expect(cellRects).toHaveLength(3);
    for (const [index, cellRect] of cellRects.entries()) {
      expect(cellRect.left).toBeCloseTo(columnRects[index]!.left, 0);
      expect(cellRect.width).toBeCloseTo(columnRects[index]!.width, 0);
    }

    unmount();
  });

  it("pages by a viewport of the collection, most of which is not rendered", async () => {
    const { grid, unmount } = await render();

    press(grid, "ArrowDown");
    await settle();
    press(grid, "PageDown");
    await settle();

    // A page is measured from the row's own bottom: 42 - 42 + 500 leaves 500, and row 12 is the
    // first that does not start before it. Reached through the layout's geometry rather than by
    // measuring elements, which could only ever answer for the window.
    expect(document.activeElement?.getAttribute("data-key")).toBe("12");

    press(grid, "End", { ctrlKey: true });
    await settle();

    expect(document.activeElement?.getAttribute("data-key")).toBe("1000");
    // Focus scrolled the box to the row, which is what moved the window with it.
    expect(grid.scrollTop).toBeGreaterThan(41_000);

    unmount();
  });

  it("paints the row's focus ring across the cells of a contained row", async () => {
    const { grid, unmount } = await render();

    press(grid, "ArrowDown");
    await settle();

    const row = document.activeElement as HTMLElement;
    const cell = row.querySelector<HTMLElement>('[data-slot="table-cell"]')!;

    // The row and its cells carry the layout's geometry themselves, with nothing between them.
    expect(cell.parentElement).toBe(row);
    expect(getComputedStyle(row).contain).toBe("size layout style");
    // The ring is a shadow split across the cells, and the row lets content overflow so no part
    // of it is clipped away.
    expect(getComputedStyle(row).overflow).toBe("visible");
    expect(getComputedStyle(cell).overflow).toBe("visible");
    expect(getComputedStyle(cell).boxShadow).not.toBe("none");

    unmount();
  });

  it("drops the separator only after the last column, through its wrapper", async () => {
    const { grid, unmount } = await render();
    const columns = [...grid.querySelectorAll<HTMLElement>('[data-slot="table-column"]')];

    // `table.css` reaches the last column through `[role="row"] > [role="presentation"]`, so one
    // wrapper too many or too few here shows up as a separator on the wrong column.
    expect(getComputedStyle(columns[0]!, "::after").content).toBe('""');
    expect(getComputedStyle(columns[1]!, "::after").content).toBe('""');
    expect(getComputedStyle(columns.at(-1)!, "::after").content).toBe("none");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = await render({ selectionMode: "multiple" });

    // The same palette shortfall the other grids scope out, and provably not this feature's: the
    // non-virtualized fixture reports it on all three column headers — `.table__column` paints its
    // label in `--muted` (#71717a) on `--surface-secondary` (#efeff0) at 12px for 4.2:1, under the
    // 4.5:1 WCAG AA floor. Every other rule still runs, which is where the risk of virtualizing
    // actually is: the roles, the counts and the `aria-rowindex`/`aria-colindex` pairs.
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });

  /**
   * The scrollbar is the table's own. A native thumb is moved by the compositor, which draws each
   * frame at the new offset with whatever rows were last committed — across a long collection
   * always the wrong ones. Everything below is about the bar standing in for the native one
   * completely, and about the rows arriving with the offset rather than a frame after it.
   */
  describe("scrollbar", () => {
    it("hides the native scrollbar and draws its own along the inline end", async () => {
      const { grid, unmount } = await render();
      const bar = scrollbar(grid, "vertical")!;
      const box = grid.getBoundingClientRect();
      const track = bar.getBoundingClientRect();

      expect(getComputedStyle(grid).scrollbarWidth).toBe("none");
      // Not exposed, as the native one is not: the grid stays the focusable scroller.
      expect(bar.closest('[aria-hidden="true"]')).not.toBeNull();
      // The whole height of the box, on its inline end.
      expect(track.right).toBeCloseTo(box.right, 0);
      expect(track.top).toBeCloseTo(box.top, 0);
      expect(track.height).toBeCloseTo(box.height, 0);
      // A thousand rows would leave a thumb under a pixel tall, so it is held to a graspable floor.
      expect(thumbOf(bar).getBoundingClientRect().height).toBe(32);
      // The columns fit, so there is nothing to scroll sideways.
      expect(scrollbar(grid, "horizontal")).toBeNull();

      unmount();
    });

    it("sizes the thumb by how much of the content the box shows", async () => {
      const { grid, unmount } = await render({ items: users.slice(0, 100) });

      // A hundred rows and the header under a 500px box: the thumb is that share of the track.
      expect(thumbOf(scrollbar(grid, "vertical")!).getBoundingClientRect().height).toBeCloseTo(
        (500 * 500) / 4_242,
        0,
      );

      unmount();
    });

    it("moves the rows with the thumb in the same tick, with no frame in between", async () => {
      const { grid, keys, unmount } = await render();
      const release = await dragThumb(thumbOf(scrollbar(grid, "vertical")!), { y: 100 });

      // A hundred pixels of the thumb's travel — the track less the thumb — in content: the
      // content less the box.
      expect(grid.scrollTop).toBeCloseTo((100 / (500 - 32)) * (42_042 - 500), -1);

      // The rows already in the DOM cover the box at the new offset: the first starts at or above
      // its top edge and the last ends at or below its bottom edge.
      const rendered = keys().map(Number);
      const topOf = (key: number) => 42 + (key - 1) * 42;

      expect(topOf(Math.min(...rendered))).toBeLessThanOrEqual(grid.scrollTop);
      expect(topOf(Math.max(...rendered)) + 42).toBeGreaterThanOrEqual(grid.scrollTop + 500);

      release();
      unmount();
    });

    it("follows a scroll the box made on its own", async () => {
      const { grid, scrollTo, unmount } = await render();
      const thumb = thumbOf(scrollbar(grid, "vertical")!);

      await scrollTo(41_542);

      // At the end of the content, the thumb is at the end of the track.
      expect(thumb.getBoundingClientRect().bottom).toBeCloseTo(
        grid.getBoundingClientRect().bottom,
        0,
      );

      unmount();
    });

    it("pages towards a press on the track", async () => {
      const { grid, unmount } = await render();
      const bar = scrollbar(grid, "vertical")!;
      const track = bar.getBoundingClientRect();

      bar.dispatchEvent(
        new PointerEvent("pointerdown", {
          ...POINTER,
          clientX: track.left + 5,
          clientY: track.bottom - 5,
        }),
      );
      await nextTick();

      // Below the thumb: forward by most of a box, so what was at the bottom edge is still there.
      expect(grid.scrollTop).toBeCloseTo(500 * 0.875, -1);

      bar.dispatchEvent(
        new PointerEvent("pointerdown", {
          ...POINTER,
          clientX: track.left + 5,
          clientY: track.top + 1,
        }),
      );
      await nextTick();

      expect(grid.scrollTop).toBe(0);

      unmount();
    });

    it("draws a second bar when the columns outgrow the box, and leaves the two a corner", async () => {
      const { grid, unmount } = await render({ isWide: true });
      const horizontal = scrollbar(grid, "horizontal")!;
      const vertical = scrollbar(grid, "vertical")!;
      const box = grid.getBoundingClientRect();
      const track = horizontal.getBoundingClientRect();

      expect(track.bottom).toBeCloseTo(box.bottom, 0);
      expect(track.left).toBeCloseTo(box.left, 0);
      expect(track.width).toBeCloseTo(box.width - 10, 0);
      expect(vertical.getBoundingClientRect().height).toBeCloseTo(box.height - 10, 0);

      const release = await dragThumb(thumbOf(horizontal), { x: 100 });

      expect(grid.scrollLeft).toBeGreaterThan(0);

      release();
      unmount();
    });

    it("runs the other way in a right-to-left box", async () => {
      document.documentElement.dir = "rtl";

      try {
        const { grid, unmount } = await render({ isWide: true });
        const box = grid.getBoundingClientRect();
        const horizontal = scrollbar(grid, "horizontal")!;
        const thumb = thumbOf(horizontal);

        // The inline end is now the left.
        expect(scrollbar(grid, "vertical")!.getBoundingClientRect().left).toBeCloseTo(box.left, 0);
        // The content starts at the right, so the thumb does too.
        expect(thumb.getBoundingClientRect().right).toBeCloseTo(
          horizontal.getBoundingClientRect().right,
          0,
        );

        const release = await dragThumb(thumb, { x: -100 });

        // Leftwards, into the negative offsets a right-to-left box scrolls through — and the thumb
        // has gone exactly as far as the pointer took it.
        expect(grid.scrollLeft).toBeLessThan(0);
        expect(thumb.getBoundingClientRect().right).toBeCloseTo(
          horizontal.getBoundingClientRect().right - 100,
          0,
        );

        release();
        unmount();
      } finally {
        document.documentElement.dir = "";
      }
    });

    it("leaves a plain table its native scrollbar", async () => {
      const { container, grid, unmount } = await render({ withoutVirtualizer: true });

      expect(container.querySelector('[data-slot="virtualizer-scrollbar"]')).toBeNull();
      expect(getComputedStyle(grid).scrollbarWidth).not.toBe("none");

      unmount();
    });
  });
});
