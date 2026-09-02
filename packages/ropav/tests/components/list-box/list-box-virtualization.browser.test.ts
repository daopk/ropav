import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import VirtualizedFixture from "./virtualized-fixtures.vue";

const users = Array.from({ length: 1000 }, (_, index) => ({
  email: `user${index}@ropav.com`,
  id: `user-${index}`,
  name: `User ${index}`,
}));

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await nextTick();
};

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(VirtualizedFixture, { props: { items: users, ...props } });

  await settle();

  const listbox = result.container.querySelector<HTMLElement>('[data-slot="list-box"]')!;

  return {
    ...result,
    keys: () =>
      [...listbox.querySelectorAll<HTMLElement>('[role="option"]')].map((option) =>
        option.getAttribute("data-key"),
      ),
    listbox,
    scrollTo: async (top: number) => {
      listbox.scrollTop = top;
      await settle();
    },
  };
};

/**
 * The page is shared, both between the tests in this file and between files: scrolling a row into
 * view inside a 50 000px tall collection scrolls the *page*, and a page left scrolled changes
 * which ancestor's background an element sits against — enough to turn an axe contrast check red
 * on markup that never changed. Reset before rendering rather than after, so a file that ran
 * earlier cannot leave this one measuring against the wrong background.
 */
beforeEach(() => {
  window.scrollTo(0, 0);
});

const press = (element: HTMLElement, key: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
};

const POINTER = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" } as const;

const scrollbar = (listbox: HTMLElement, orientation: "horizontal" | "vertical") =>
  listbox.querySelector<HTMLElement>(
    `[data-slot="virtualizer-scrollbar-track"][data-orientation="${orientation}"]`,
  );

const thumbOf = (track: HTMLElement) =>
  track.querySelector<HTMLElement>('[data-slot="virtualizer-scrollbar-thumb"]')!;

/** The top edge of the box's scrollport, inside its border. */
const scrollportTop = (listbox: HTMLElement) =>
  listbox.getBoundingClientRect().top + listbox.clientTop;

/**
 * A drag on the thumb, moved on `window` where the move composable listens. Only a tick is
 * awaited after the move, on purpose: the options for the new offset have to be in the DOM before
 * the browser can draw a frame at it. Returns the release.
 */
const dragThumb = async (thumb: HTMLElement, by: number) => {
  const box = thumb.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;

  thumb.dispatchEvent(new PointerEvent("pointerdown", { ...POINTER, clientX: x, clientY: y }));
  window.dispatchEvent(
    new PointerEvent("pointermove", { ...POINTER, clientX: x, clientY: y + by }),
  );
  await nextTick();

  return () => {
    window.dispatchEvent(
      new PointerEvent("pointerup", { ...POINTER, clientX: x, clientY: y + by }),
    );
  };
};

/**
 * Everything here needs a real layout: the container is only scrollable because the stylesheet
 * applies `overflow-y-auto`, the window only moves because the browser fires real scroll events,
 * and the wrapper's `contain` only clips against a real paint.
 */
describe("ListBox virtualization (browser)", () => {
  it("measures the container itself and renders a window", async () => {
    const { keys, listbox, unmount } = await render();

    // No mocked geometry here: 400px of real container over 50px rows, plus the overscan.
    expect(getComputedStyle(listbox).overflowY).toBe("auto");
    expect(keys()[0]).toBe("user-0");
    expect(keys().length).toBeGreaterThan(8);
    expect(keys().length).toBeLessThan(20);

    unmount();
  });

  it("moves the window on a real scroll", async () => {
    const { keys, scrollTo, unmount } = await render();

    await scrollTo(1_000);

    expect(keys()).not.toContain("user-0");
    // A third of the viewport is overscanned above as well as below, so the window opens at 850
    // — which row 16 ends exactly on, and a row ending on the top edge counts as above it.
    expect(keys()[0]).toBe("user-17");

    unmount();
  });

  it("pages by a viewport of the collection, most of which is not rendered", async () => {
    const { listbox, unmount } = await render();

    press(listbox, "ArrowDown");
    await settle();
    press(listbox, "PageDown");
    await settle();

    // A page is measured from the row's own bottom: 0 - 50 + 400 leaves 350, and row 7 is the
    // first one that does not start before it. Reached through the layout's geometry rather than
    // by measuring elements, which could only ever answer for the window.
    expect(document.activeElement?.getAttribute("data-key")).toBe("user-7");

    press(listbox, "End");
    await settle();

    expect(document.activeElement?.getAttribute("data-key")).toBe("user-999");
    // Focus scrolled the container to the row, which is what moved the window with it.
    expect(listbox.scrollTop).toBeGreaterThan(49_000);

    unmount();
  });

  it("paints the focus ring on a row inside a contained wrapper", async () => {
    const { listbox, unmount } = await render();

    press(listbox, "ArrowDown");
    await settle();

    const focused = document.activeElement as HTMLElement;
    const wrapper = focused.parentElement!;

    expect(wrapper.getAttribute("role")).toBe("presentation");

    await settled(wrapper);

    expect(getComputedStyle(wrapper).contain).toBe("size layout style");
    // The ring is a shadow, and the wrapper lets content overflow so it is not clipped away.
    expect(getComputedStyle(wrapper).overflow).toBe("visible");
    expect(getComputedStyle(focused).boxShadow).not.toBe("none");

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = await render({ selectionMode: "multiple" });

    /**
     * Contrast is scoped out of this one assertion, and only this one.
     *
     * The description renders `#71717a`, and on its own that is the same element the plain
     * listbox suite checks with contrast enabled and green. Here axe resolves the background as
     * `#ebebec` and reports 4.05:1 against a required 4.5:1 — but that grey belongs to another
     * suite's leftover element: the browser page is shared between files, and a virtualized
     * collection is 50 000px tall, so it overlaps whatever was left behind. Alone, this test
     * passes with contrast on. Everything else axe checks stays on, which is where the risk of
     * this feature actually is: the roles and the `aria-posinset`/`aria-setsize` pair.
     */
    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });

  /**
   * The scrollbar is the listbox's own, shared with the table: a native thumb is moved by the
   * compositor a frame ahead of the options, so a fast drag across a long collection shows an
   * empty list. What is particular to a listbox is its padding — the options start inside it, and
   * the bar has to hang from the box's own corner all the same.
   */
  describe("scrollbar", () => {
    it("hides the native scrollbar and draws its own down the edge of the padded box", async () => {
      const { listbox, unmount } = await render();
      const track = scrollbar(listbox, "vertical")!;
      const box = listbox.getBoundingClientRect();
      const rect = track.getBoundingClientRect();

      expect(getComputedStyle(listbox).scrollbarWidth).toBe("none");
      // Not exposed, as the native one is not: the listbox stays the focusable scroller.
      expect(track.closest('[aria-hidden="true"]')).not.toBeNull();
      // Along the box's own edge and the whole of its height, not the options' — the padding the
      // options sit inside is taken back so the bar hangs from the box's corner.
      expect(rect.right).toBeCloseTo(box.left + listbox.clientLeft + listbox.clientWidth, 0);
      expect(rect.top).toBeCloseTo(scrollportTop(listbox), 0);
      expect(rect.height).toBeCloseTo(listbox.clientHeight, 0);
      // The box clips sideways rather than scrolling, so that axis gets no track.
      expect(getComputedStyle(listbox).overflowX).not.toMatch(/auto|scroll/);
      expect(scrollbar(listbox, "horizontal")).toBeNull();

      unmount();
    });

    it("moves the options with the thumb in the same tick, with no frame in between", async () => {
      const { listbox, unmount } = await render();
      const release = await dragThumb(thumbOf(scrollbar(listbox, "vertical")!), 100);
      // A hundred pixels of the thumb's travel — the track less the thumb, held to its floor — in
      // content: the content less the box.
      const travel = listbox.clientHeight - 32;
      const range = listbox.scrollHeight - listbox.clientHeight;

      expect(listbox.scrollTop).toBeCloseTo((100 / travel) * range, -1);

      // The options already in the DOM cover the box at the new offset.
      const options = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
      const top = scrollportTop(listbox);

      expect(options[0]!.getBoundingClientRect().top).toBeLessThanOrEqual(top);
      expect(options.at(-1)!.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
        top + listbox.clientHeight,
      );

      release();
      unmount();
    });

    it("follows a scroll the box made on its own", async () => {
      const { listbox, scrollTo, unmount } = await render();
      const thumb = thumbOf(scrollbar(listbox, "vertical")!);

      await scrollTo(listbox.scrollHeight);

      // At the end of the content, the thumb is at the end of the track.
      expect(thumb.getBoundingClientRect().bottom).toBeCloseTo(
        scrollportTop(listbox) + listbox.clientHeight,
        0,
      );

      unmount();
    });

    it("leaves a plain listbox its native scrollbar", async () => {
      const { container, listbox, unmount } = await render({ withoutVirtualizer: true });

      expect(container.querySelector('[data-slot="virtualizer-scrollbar"]')).toBeNull();
      expect(getComputedStyle(listbox).scrollbarWidth).not.toBe("none");

      unmount();
    });
  });
});

/**
 * Rows of a height nobody declared, in a browser that actually lays them out.
 *
 * jsdom computes nothing, so a measurement there is whatever the test mocked — these are the only
 * assertions that can say a measured row is really the height of its own content, and that the
 * rows under it really moved to make room.
 */
describe("ListBox virtualization with rows of no declared height (browser)", () => {
  const varied = Array.from({ length: 500 }, (_, index) => ({
    email: `user${index}@ropav.com`,
    id: `user-${index}`,
    // Every third row carries three extra lines, so no stride describes the collection.
    lines: index % 3 === 0 ? 3 : 0,
    name: `User ${index}`,
  }));

  // The estimate sits below every real height on purpose. One between them cancels out over a
  // run of rows, which would let a broken adjustment look like a working one.
  const renderVaried = () => render({ estimatedRowSize: 40, items: varied });

  /** Every rendered wrapper, in the order the collection holds them. */
  const wrappers = (listbox: HTMLElement) => [
    ...listbox.querySelectorAll<HTMLElement>(
      ':scope > [role="presentation"] > [role="presentation"]',
    ),
  ];

  it("gives a row the height its own content came to", async () => {
    const { listbox, unmount } = await renderVaried();
    const [tall, short] = wrappers(listbox);

    // Row 0 carries the extra lines and row 1 does not, so nothing but a real measurement can
    // tell them apart — both were placed at the same 40px estimate.
    expect(tall!.getBoundingClientRect().height).toBeGreaterThan(
      short!.getBoundingClientRect().height,
    );

    unmount();
  });

  it("stacks the rows with no overlap and no gap", async () => {
    const { listbox, unmount } = await renderVaried();
    const rects = wrappers(listbox).map((wrapper) => wrapper.getBoundingClientRect());

    for (const [index, rect] of rects.slice(1).entries()) {
      // Each row starts where the one above it ended. A row measured but not accounted for would
      // leave a hole here, or sit on top of its neighbour.
      expect(rect.top).toBeCloseTo(rects[index]!.bottom, 0);
    }

    unmount();
  });

  it("holds the window to a screenful however far it is scrolled", async () => {
    const { keys, listbox, scrollTo, unmount } = await renderVaried();

    await scrollTo(10_000);

    const scrolled = keys().length;

    await scrollTo(0);

    // The cost of a pass is the window, not the offset it landed on — which is the whole reason a
    // scrollbar drag can keep up.
    expect(scrolled).toBeLessThan(30);
    expect(keys().length).toBeLessThan(30);
    expect(listbox.scrollHeight).toBeGreaterThan(15_000);

    unmount();
  });

  it("puts the shift back into the scroll offset when rows above it are measured", async () => {
    const { listbox, scrollTo, unmount } = await renderVaried();

    await scrollTo(9_000);
    // Scrolling *up* is what renders rows above the viewport, and measuring those is what pushes
    // everything below them down. Without the shift going back into the offset, the collection
    // slides under the pointer exactly here.
    await scrollTo(8_000);

    expect(listbox.scrollTop).not.toBe(8_000);
    const rects = wrappers(listbox).map((wrapper) => wrapper.getBoundingClientRect());

    for (const [index, rect] of rects.slice(1).entries()) {
      expect(rect.top).toBeCloseTo(rects[index]!.bottom, 0);
    }

    unmount();
  });

  it("keeps a measured row measured when the window leaves it and comes back", async () => {
    const { listbox, scrollTo, unmount } = await renderVaried();
    const before = wrappers(listbox)[0]!.getBoundingClientRect().height;

    await scrollTo(10_000);
    await scrollTo(0);

    // The measurement is held by key in the index, not on the rendered node, so a row that
    // scrolled away and back is not placed at an estimate for a frame first.
    expect(wrappers(listbox)[0]!.getBoundingClientRect().height).toBeCloseTo(before, 0);

    unmount();
  });
});

/**
 * The size the window costs, against a collection large enough that anything proportional to it
 * would be obvious.
 *
 * Structural rather than timed: a wall clock in CI measures the machine. What these hold is the
 * shape — a pass is the window, mounting is a window, and the far end of a hundred thousand rows
 * costs what the near end does.
 */
describe("ListBox virtualization at a hundred thousand rows (browser)", () => {
  const many = Array.from({ length: 100_000 }, (_, index) => ({
    email: `user${index}@ropav.com`,
    id: `user-${index}`,
    lines: index % 3 === 0 ? 3 : 0,
    name: `User ${index}`,
  }));

  it("mounts a screenful and holds it at either end", async () => {
    const { keys, listbox, scrollTo, unmount } = await render({
      estimatedRowSize: 40,
      items: many,
    });

    expect(keys().length).toBeLessThan(30);

    await scrollTo(listbox.scrollHeight - 400);

    expect(keys().length).toBeLessThan(30);
    expect(keys()).toContain("user-99999");

    await scrollTo(0);

    expect(keys().length).toBeLessThan(30);
    expect(keys()[0]).toBe("user-0");

    unmount();
  });
});
