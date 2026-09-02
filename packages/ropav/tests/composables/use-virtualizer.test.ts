import type { UseVirtualizerReturn } from "@/composables/use-virtualizer";
import type { VirtualizerKey } from "@/utils/virtualizer-layout-info";

import { describe, expect, it } from "vitest";
import { effectScope, shallowRef } from "vue";

import { useVirtualizer } from "@/composables/use-virtualizer";
import { createListCollection } from "@/utils/virtualizer-collection";
import { Rect, Size } from "@/utils/virtualizer-geometry";
import { ListLayout } from "@/utils/virtualizer-list-layout";

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` }));

interface SetupOptions {
  itemCount?: number;
  persistedKeys?: VirtualizerKey[];
  rowSize?: number | null;
  estimatedRowSize?: number;
  size?: Size;
}

const setup = (options: SetupOptions = {}) => {
  const scope = effectScope();
  const collection = createListCollection({ items: makeItems(options.itemCount ?? 1000) });
  const persistedKeys = shallowRef(new Set<VirtualizerKey>(options.persistedKeys ?? []));
  const layout = shallowRef(
    new ListLayout({
      estimatedRowSize: options.estimatedRowSize,
      rowSize: options.rowSize === null ? undefined : (options.rowSize ?? 50),
    }),
  );

  const virtualizer = scope.run(() =>
    useVirtualizer({
      collection: () => collection,
      layout: () => layout.value,
      persistedKeys: () => persistedKeys.value,
    }),
  ) as UseVirtualizerReturn;

  virtualizer.setSize(options.size ?? new Size(300, 400));
  virtualizer.setVisibleRect(new Rect(0, 0, 300, 400));

  return { collection, persistedKeys, stop: () => scope.stop(), virtualizer };
};

const keysOf = (virtualizer: UseVirtualizerReturn) =>
  virtualizer.visibleViews.value.map((view) => view.key);

describe("useVirtualizer", () => {
  it("renders a window of the collection and reports the whole content size", () => {
    const { stop, virtualizer } = setup();

    // 400px of viewport plus a third overscanned is 533.33, which the layout grows to 550:
    // rows 0 through 11, the last one counting because it starts exactly on the bottom edge.
    expect(keysOf(virtualizer)).toEqual(Array.from({ length: 12 }, (_, i) => `item-${i}`));
    expect(virtualizer.contentSize.value).toEqual(new Size(300, 50_000));

    stop();
  });

  it("moves the window when the visible rectangle moves", () => {
    const { stop, virtualizer } = setup();

    virtualizer.setVisibleRect(new Rect(0, 1_000, 300, 400));

    const keys = keysOf(virtualizer);

    // The window is 1000 to 1550: row 19 ends exactly on the top edge, which counts as above it,
    // and row 31 starts on the bottom one, which counts as in it. Nothing further above is kept —
    // scrolling down overscans below only.
    expect(keys[0]).toBe("item-20");
    expect(keys.at(-1)).toBe("item-31");
    expect(keys).not.toContain("item-0");

    stop();
  });

  it("overscans behind the scroll once the direction reverses", () => {
    const { stop, virtualizer } = setup();

    virtualizer.setVisibleRect(new Rect(0, 1_000, 300, 400));
    virtualizer.setVisibleRect(new Rect(0, 900, 300, 400));

    // Arrived from below, so the extra third is added above the viewport rather than under it:
    // the window is 750 to 1300 instead of 900 to 1433, and starts four rows before row 18.
    expect(keysOf(virtualizer)[0]).toBe("item-15");

    stop();
  });

  it("renders nothing until the container has been measured", () => {
    const scope = effectScope();
    const collection = createListCollection({ items: makeItems(1000) });
    const layout = shallowRef(new ListLayout({ rowSize: 50 }));
    const virtualizer = scope.run(() =>
      useVirtualizer({ collection: () => collection, layout: () => layout.value }),
    ) as UseVirtualizerReturn;

    // jsdom reports no layout, and a virtualizer that guessed here would render every row.
    expect(keysOf(virtualizer)).toEqual([]);

    scope.stop();
  });

  it("keeps a persisted key rendered from outside the window", () => {
    const { persistedKeys, stop, virtualizer } = setup({ persistedKeys: ["item-500"] });

    expect(keysOf(virtualizer)).toContain("item-500");

    persistedKeys.value = new Set();

    expect(keysOf(virtualizer)).not.toContain("item-500");

    stop();
  });

  it("lays out again when a row reports a size that moves the rows below it", () => {
    const { stop, virtualizer } = setup({ estimatedRowSize: 40, rowSize: null });

    expect(virtualizer.getLayoutInfo("item-2")?.rect.y).toBe(80);

    virtualizer.updateItemSize("item-1", new Size(300, 90));

    expect(virtualizer.getLayoutInfo("item-1")?.rect.height).toBe(90);
    expect(virtualizer.getLayoutInfo("item-2")?.rect.y).toBe(130);

    stop();
  });

  it("does not lay out again when a measurement changes nothing", () => {
    const { stop, virtualizer } = setup({ estimatedRowSize: 40, rowSize: null });
    const before = virtualizer.visibleViews.value;

    virtualizer.updateItemSize("item-1", new Size(300, 40));

    // Same computed result, so no element is touched: this is what stops measurement looping.
    expect(virtualizer.visibleViews.value).toBe(before);

    stop();
  });

  it("tracks the scrolling state the content wrapper turns into pointer-events", () => {
    const { stop, virtualizer } = setup();

    expect(virtualizer.isScrolling.value).toBe(false);
    virtualizer.startScrolling();
    expect(virtualizer.isScrolling.value).toBe(true);
    virtualizer.endScrolling();
    expect(virtualizer.isScrolling.value).toBe(false);

    stop();
  });

  it("hands each view the node it was built from", () => {
    const { stop, virtualizer } = setup({ itemCount: 3 });
    const [first] = virtualizer.visibleViews.value;

    expect(first?.node?.index).toBe(0);
    expect(first?.node?.content).toEqual({ id: "item-0", name: "Item 0" });
    expect(first?.children).toEqual([]);
    expect(first?.parentKey).toBeNull();

    stop();
  });

  it("re-renders the window when the collection is replaced", () => {
    const scope = effectScope();
    const collection = shallowRef(createListCollection({ items: makeItems(1000) }));
    const layout = shallowRef(new ListLayout({ rowSize: 50 }));
    const virtualizer = scope.run(() =>
      useVirtualizer({ collection: () => collection.value, layout: () => layout.value }),
    ) as UseVirtualizerReturn;

    virtualizer.setSize(new Size(300, 400));
    virtualizer.setVisibleRect(new Rect(0, 0, 300, 400));

    expect(virtualizer.contentSize.value.height).toBe(50_000);

    collection.value = createListCollection({ items: makeItems(4) });

    expect(virtualizer.contentSize.value.height).toBe(200);
    expect(keysOf(virtualizer)).toEqual(["item-0", "item-1", "item-2", "item-3"]);

    scope.stop();
  });
});

/**
 * Putting a measurement back into the scroll offset.
 *
 * A row measured **above** the window moves every row below it, the window's own content
 * included — so a collection of rows nobody declared a height for slides under the pointer as it
 * is scrolled through, and the row a reader was looking at is not where they left it. The delta
 * has to go back into the scroll offset, which is what holds the content still.
 */
describe("useVirtualizer scroll anchoring", () => {
  /**
   * Scrolled up, so the overscan sits above the viewport rather than under it — which is the only
   * way a row above the window is rendered at all, and so the only way one gets measured.
   */
  const scrolled = () => {
    const result = setup({ estimatedRowSize: 50, rowSize: null });

    result.virtualizer.setVisibleRect(new Rect(0, 1_000, 300, 400));
    result.virtualizer.setVisibleRect(new Rect(0, 900, 300, 400));
    // Rows 15 to 17 are rendered above the viewport's own top edge at 900.
    expect(keysOf(result.virtualizer)[0]).toBe("item-15");

    return result;
  };

  it("reports the shift a row measured above the window caused", () => {
    const { stop, virtualizer } = scrolled();

    // Row 15 sits at 750..800, entirely above a viewport starting at 900.
    virtualizer.updateItemSize("item-15", new Size(300, 130));

    expect(virtualizer.scrollAdjustment.value).toBe(80);

    stop();
  });

  it("reports nothing for a row measured inside the window", () => {
    const { stop, virtualizer } = scrolled();

    // Row 18 starts at 900, which is the viewport's own top edge. Growing it moves what is below
    // it, and what is below it is what the reader is already looking at.
    virtualizer.updateItemSize("item-18", new Size(300, 130));

    expect(virtualizer.scrollAdjustment.value).toBe(0);

    stop();
  });

  it("adds up the shifts until something takes them", () => {
    const { stop, virtualizer } = scrolled();

    virtualizer.updateItemSize("item-15", new Size(300, 130));
    virtualizer.updateItemSize("item-16", new Size(300, 70));

    expect(virtualizer.scrollAdjustment.value).toBe(100);
    expect(virtualizer.takeScrollAdjustment()).toBe(100);
    // Taken once and once only: applying the same shift twice would move the collection itself.
    expect(virtualizer.scrollAdjustment.value).toBe(0);

    stop();
  });
});
