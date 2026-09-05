import type { DragCollection, DropTarget } from "@/utils/dnd-types";
import type { VirtualizerLayoutHost } from "@/utils/virtualizer-layout";

import { describe, expect, it } from "vitest";
import { shallowRef } from "vue";

import { ListDropTargetDelegate } from "@/utils/dnd-list-drop-target-delegate";
import { createListCollection } from "@/utils/virtualizer-collection";
import { Rect, Size } from "@/utils/virtualizer-geometry";
import { ListLayout } from "@/utils/virtualizer-list-layout";

/**
 * Why a windowed collection needs its layout to resolve a drop, and not the DOM.
 *
 * Both delegates answer the same question. The difference is what they can see: one searches for
 * elements, and in a windowed collection all but a screenful of them are absent. This pins the
 * failure rather than just asserting the replacement works — the whole point is that the DOM
 * answer is wrong here, and a test that only exercises the new path would pass just as well
 * against the old one.
 */

const ROW_SIZE = 50;
const COUNT = 1000;
/** Where the window sits: rows 490–500, which is what a scroll of 24 500px shows. */
const FIRST_RENDERED = 490;
const RENDERED = 10;
const SCROLL_TOP = FIRST_RENDERED * ROW_SIZE;

const items = Array.from({ length: COUNT }, (_, index) => ({ id: `item-${index}` }));

const collection: DragCollection = {
  getItem: (key) => ({ key, type: "item" }),
  getKeyAfter: (key) => {
    const index = items.findIndex((item) => item.id === key);

    return items[index + 1]?.id ?? null;
  },
  getKeyBefore: (key) => {
    const index = items.findIndex((item) => item.id === key);

    return index > 0 ? (items[index - 1]?.id ?? null) : null;
  },
  getKeys: () => items.map((item) => item.id),
};

/**
 * The DOM as a virtualizer leaves it: a container holding only the rows inside the window, each
 * placed absolutely at its own offset.
 */
const renderWindow = () => {
  const container = document.createElement("div");

  container.dataset["collection"] = "list";
  container.getBoundingClientRect = () => new DOMRect(0, -SCROLL_TOP, 300, COUNT * ROW_SIZE);

  for (let index = FIRST_RENDERED; index < FIRST_RENDERED + RENDERED; index += 1) {
    const row = document.createElement("div");
    const top = index * ROW_SIZE - SCROLL_TOP;

    row.dataset["collection"] = "list";
    row.dataset["key"] = `item-${index}`;
    row.getBoundingClientRect = () => new DOMRect(0, top, 300, ROW_SIZE);
    container.append(row);
  }

  document.body.append(container);

  return container;
};

const buildLayout = () => {
  const layout = new ListLayout({ rowSize: ROW_SIZE });

  layout.host = {
    collection: createListCollection({ items }),
    isPersistedKey: () => false,
    persistedKeys: new Set(),
    size: new Size(300, 500),
    visibleRect: new Rect(0, SCROLL_TOP, 300, 500),
  } satisfies VirtualizerLayoutHost;
  layout.update({});

  return layout;
};

const keyOf = (target: DropTarget | null) => (target?.type === "item" ? target.key : target?.type);

describe("resolving a drop over a windowed collection", () => {
  /**
   * The point is 20px into the first rendered row, which is row 490 — the answer both delegates
   * should give.
   */
  const POINT_Y = 20;

  it("the layout names the row the pointer is actually over", () => {
    expect(keyOf(buildLayout().getDropTargetFromPoint(10, POINT_Y, () => true))).toBe("item-490");
  });

  /**
   * The DOM delegate bisects over **every** key while only a screenful have elements, so its
   * first probe lands on a key that is not rendered, the search gives up, and it falls back to
   * the nearest end. That is the bug, and it is silent — a plausible row, just the wrong one.
   */
  it("the DOM delegate names a row that is nowhere near it", () => {
    const container = renderWindow();
    const delegate = new ListDropTargetDelegate(collection, shallowRef(container));
    const target = delegate.getDropTargetFromPoint(10, POINT_Y, () => true);

    container.remove();

    expect(keyOf(target)).not.toBe("item-490");
  });

  /**
   * Resolving a drop is a question *about* the rendered set, not a new window for it.
   *
   * The point arrives as a one-pixel sliver. Laying the collection out for that sliver would
   * shrink the rendered set to it and prune every other row away, so the next pass would rebuild
   * rows it already had — which is why identity is what this asserts. Equal rectangles would pass
   * either way.
   */
  it("leaves the rows already laid out where they are", () => {
    const layout = buildLayout();
    const before = layout.getVisibleLayoutInfos(layout.host!.visibleRect);

    layout.getDropTargetFromPoint(10, POINT_Y, () => true);

    const after = layout.getVisibleLayoutInfos(layout.host!.visibleRect);

    expect(after).toHaveLength(before.length);
    expect(after.every((info, index) => info === before[index])).toBe(true);
  });

  // Not merely different — off by hundreds of rows, which is what makes it a wrong drop rather
  // than an imprecise one.
  it("and it is off by the whole distance to the window", () => {
    const container = renderWindow();
    const delegate = new ListDropTargetDelegate(collection, shallowRef(container));
    const target = delegate.getDropTargetFromPoint(10, POINT_Y, () => true);

    container.remove();

    expect(keyOf(target)).toBe("item-0");
  });
});
