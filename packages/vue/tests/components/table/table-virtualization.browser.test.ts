import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {beforeEach, describe, expect, it} from "vitest";
import {nextTick} from "vue";

import VirtualizedFixture from "./virtualized-fixtures.vue";

const users = Array.from({length: 1000}, (_, index) => ({
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
  const result = renderVapor(VirtualizedFixture, {props: {items: users, ...props}});

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
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
};

/**
 * Everything here needs a real layout: the scroll box is only scrollable because the stylesheet
 * applies `overflow-auto`, the header only sticks because `position: sticky` resolves against a
 * real scroll container, and the column widths are only divided over a box that was measured.
 */
describe("Table virtualization (browser)", () => {
  it("measures the box itself and renders a window", async () => {
    const {grid, keys, unmount} = await render();

    // No mocked geometry: 500px of real box over 42px rows, plus the overscan.
    expect(getComputedStyle(grid).overflow).toBe("auto");
    expect(keys()[0]).toBe("1");
    expect(keys().length).toBeGreaterThan(11);
    expect(keys().length).toBeLessThan(24);

    unmount();
  });

  it("keeps the header above the rows that scroll under it", async () => {
    const {grid, keys, scrollTo, unmount} = await render();
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
    const {grid, unmount} = await render();
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
    const {grid, unmount} = await render();

    press(grid, "ArrowDown");
    await settle();
    press(grid, "PageDown");
    await settle();

    // A page is measured from the row's own bottom: 42 - 42 + 500 leaves 500, and row 12 is the
    // first that does not start before it. Reached through the layout's geometry rather than by
    // measuring elements, which could only ever answer for the window.
    expect(document.activeElement?.getAttribute("data-key")).toBe("12");

    press(grid, "End", {ctrlKey: true});
    await settle();

    expect(document.activeElement?.getAttribute("data-key")).toBe("1000");
    // Focus scrolled the box to the row, which is what moved the window with it.
    expect(grid.scrollTop).toBeGreaterThan(41_000);

    unmount();
  });

  it("paints the row's focus ring across cells inside contained wrappers", async () => {
    const {grid, unmount} = await render();

    press(grid, "ArrowDown");
    await settle();

    const row = document.activeElement as HTMLElement;
    const wrapper = row.parentElement!;
    const cell = row.querySelector<HTMLElement>('[data-slot="table-cell"]')!;

    expect(wrapper.getAttribute("role")).toBe("presentation");
    expect(getComputedStyle(wrapper).contain).toBe("size layout style");
    // The ring is a shadow split across the cells, and every wrapper between the row and them
    // lets content overflow so no part of it is clipped away.
    expect(getComputedStyle(wrapper).overflow).toBe("visible");
    expect(getComputedStyle(cell.parentElement!).overflow).toBe("visible");
    expect(getComputedStyle(cell).boxShadow).not.toBe("none");

    unmount();
  });

  it("drops the separator only after the last column, through its wrapper", async () => {
    const {grid, unmount} = await render();
    const columns = [...grid.querySelectorAll<HTMLElement>('[data-slot="table-column"]')];

    // `table.css` reaches the last column through `[role="row"] > [role="presentation"]`, so one
    // wrapper too many or too few here shows up as a separator on the wrong column.
    expect(getComputedStyle(columns[0]!, "::after").content).toBe('""');
    expect(getComputedStyle(columns[1]!, "::after").content).toBe('""');
    expect(getComputedStyle(columns.at(-1)!, "::after").content).toBe("none");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const {container, unmount} = await render({selectionMode: "multiple"});

    // The same palette shortfall the other grids scope out, and provably not this feature's: the
    // non-virtualized fixture reports it on all three column headers — `.table__column` paints its
    // label in `--muted` (#71717a) on `--surface-secondary` (#efeff0) at 12px for 4.2:1, under the
    // 4.5:1 WCAG AA floor. Every other rule still runs, which is where the risk of virtualizing
    // actually is: the roles, the counts and the `aria-rowindex`/`aria-colindex` pairs.
    await expectNoA11yViolations(container, {rules: {"color-contrast": {enabled: false}}});

    unmount();
  });
});
