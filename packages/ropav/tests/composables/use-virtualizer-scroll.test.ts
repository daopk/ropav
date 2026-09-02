import type { UseVirtualizerScrollReturn } from "@/composables/use-virtualizer-scroll";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, shallowRef } from "vue";

import { useVirtualizerScroll } from "@/composables/use-virtualizer-scroll";
import { Point, Rect, Size } from "@/utils/virtualizer-geometry";

/**
 * jsdom lays nothing out, so the container's measurements are defined on the element itself
 * rather than on `HTMLElement.prototype` — a prototype stub would make the content wrapper and
 * every row claim the same size, and the test would agree with itself while proving nothing.
 */
const mockGeometry = (element: HTMLElement, size: { width: number; height: number }) => {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: size.width });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: size.height });
};

/** What the browser reports for the wrapper it is scrolling, which is what an over-scroll clamps to. */
const mockScrollExtent = (element: HTMLElement, size: { width: number; height: number }) => {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: size.width });
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: size.height });
};

interface SetupOptions {
  container?: { width: number; height: number };
  contentSize?: Size;
}

const setups: (() => void)[] = [];

const setup = (options: SetupOptions = {}) => {
  const element = document.createElement("div");

  document.body.appendChild(element);
  mockGeometry(element, options.container ?? { height: 400, width: 300 });

  const contentSize = shallowRef(options.contentSize ?? new Size(300, 50_000));

  mockScrollExtent(element, contentSize.value);
  const isScrolling = shallowRef(false);
  const rects: Rect[] = [];
  const sizes: Size[] = [];
  const scrollStart = vi.fn(() => {
    isScrolling.value = true;
  });
  const scrollEnd = vi.fn(() => {
    isScrolling.value = false;
  });

  const scope = effectScope();
  const scroll = scope.run(() =>
    useVirtualizerScroll({
      contentSize: () => contentSize.value,
      element,
      isScrolling: () => isScrolling.value,
      onScrollEnd: scrollEnd,
      onScrollStart: scrollStart,
      onSizeChange: (size) => sizes.push(size),
      onVisibleRectChange: (rect) => rects.push(rect),
    }),
  ) as UseVirtualizerScrollReturn;

  setups.push(() => {
    scope.stop();
    element.remove();
  });

  const scrollTo = (top: number) => {
    element.scrollTop = top;
    element.dispatchEvent(new Event("scroll", { bubbles: false }));
  };

  return { contentSize, element, rects, scroll, scrollEnd, scrollStart, scrollTo, sizes };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  setups.splice(0).forEach((teardown) => teardown());
  vi.useRealTimers();
});

describe("useVirtualizerScroll", () => {
  it("measures the container on mount", () => {
    const { rects, sizes } = setup();

    expect(sizes).toEqual([new Size(300, 400)]);
    expect(rects).toEqual([new Rect(0, 0, 300, 400)]);
  });

  it("bounds the visible rectangle by the window viewport", () => {
    // jsdom's window is 1024x768, and the container is taller than that.
    const { rects } = setup({ container: { height: 5_000, width: 300 } });

    expect(rects.at(-1)).toEqual(new Rect(0, 0, 300, 768));
  });

  it("says nothing while the container has no size", () => {
    const { rects, sizes } = setup({ container: { height: 0, width: 0 } });

    // The size is still reported — that is how the virtualizer learns it has no room yet — but
    // the visible rectangle is withheld while it would be empty, so nothing keys off a zero rect.
    expect(sizes).toEqual([new Size(0, 0)]);
    expect(rects).toEqual([]);
  });

  it("follows the container's own scrolling", () => {
    const { rects, scrollTo } = setup();

    scrollTo(500);

    expect(rects.at(-1)).toEqual(new Rect(0, 500, 300, 400));
  });

  it("clamps an over-scroll to the content", () => {
    const { rects, scrollTo } = setup({ contentSize: new Size(300, 1_000) });

    scrollTo(999_999);

    // 1000 of content less the 400 on screen: an elastic bounce past the end must not shake
    // the window back and forth.
    expect(rects.at(-1)).toEqual(new Rect(0, 600, 300, 400));
  });

  it("scrolls the container itself and moves the window before any scroll event", () => {
    const { element, rects, scroll } = setup();

    scroll.scrollTo({ top: 1_000 });

    // Read back at once, with no event dispatched: the rows for the new offset go into the same
    // flush as the offset, which is what keeps a frame from being drawn without them.
    expect(element.scrollTop).toBe(1_000);
    expect(rects.at(-1)).toEqual(new Rect(0, 1_000, 300, 400));
    expect(scroll.scrollOffset.value).toEqual(new Point(0, 1_000));
  });

  it("reports how far the container is scrolled and how far it can go", () => {
    const { element, rects, scroll, scrollTo } = setup({ contentSize: new Size(600, 50_000) });

    expect(scroll.scrollSize.value).toEqual(new Size(600, 50_000));

    scrollTo(500);

    expect(scroll.scrollOffset.value).toEqual(new Point(0, 500));

    // A right-to-left box scrolls into negative inline offsets, and the offset keeps the sign —
    // while the window itself stays clamped into the content, as it always was.
    element.scrollLeft = -20;
    element.dispatchEvent(new Event("scroll", { bubbles: false }));

    expect(scroll.scrollOffset.value).toEqual(new Point(-20, 500));
    expect(rects.at(-1)!.x).toBe(0);
  });

  it("re-reads how far the container can go once new content has been laid out", async () => {
    const { contentSize, element, scroll } = setup();

    mockScrollExtent(element, { height: 80_000, width: 300 });
    contentSize.value = new Size(300, 80_000);
    await nextTick();

    expect(scroll.scrollSize.value).toEqual(new Size(300, 80_000));
  });

  it("follows the page scrolling the container out of the viewport", () => {
    const { element, rects } = setup({ container: { height: 5_000, width: 300 } });

    element.getBoundingClientRect = () => ({ x: 0, y: -200 }) as DOMRect;
    document.dispatchEvent(new Event("scroll"));

    // The container did not scroll inside itself; 200px of it is above the viewport, so the
    // window moves down and shortens by what is left below.
    expect(rects.at(-1)).toEqual(new Rect(0, 200, 300, 768));
  });

  it("reports the start and the settling of a scroll once each", () => {
    const { scrollEnd, scrollStart, scrollTo } = setup();

    scrollTo(100);
    scrollTo(200);
    scrollTo(300);

    expect(scrollStart).toHaveBeenCalledTimes(1);
    expect(scrollEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(scrollEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(scrollEnd).toHaveBeenCalledTimes(1);

    scrollTo(400);
    expect(scrollStart).toHaveBeenCalledTimes(2);
  });

  it("styles the wrapper that gives the container something to scroll", () => {
    const { contentSize, scroll, scrollTo } = setup();

    expect(scroll.contentStyle.value).toEqual({
      height: "50000px",
      pointerEvents: "auto",
      position: "relative",
      width: "300px",
    });

    scrollTo(100);

    // Pointers are dropped mid-scroll, so a fast scroll does not hover every row it passes.
    expect(scroll.contentStyle.value["pointerEvents"]).toBe("none");

    vi.advanceTimersByTime(300);
    contentSize.value = new Size(300, Infinity);

    // An unbounded dimension is left off rather than written as an invalid declaration.
    expect(scroll.contentStyle.value["height"]).toBeUndefined();
  });

  it("stops listening once its scope is gone", () => {
    const { rects, scroll, scrollTo } = setup();
    const before = rects.length;

    void scroll;
    setups.splice(0).forEach((teardown) => teardown());
    scrollTo(500);

    expect(rects).toHaveLength(before);
  });
});

/**
 * What a scroll event is allowed to touch.
 *
 * The content size the handler clamps against comes from the layout, and reading it pulls a whole
 * layout pass forward — for the offset the handler is about to replace. So every scroll event runs
 * the layout twice, once against the old offset and once against the new one. The browser already
 * knows how tall the thing it is scrolling is; that is what the clamp should ask.
 */
describe("useVirtualizerScroll and the layout", () => {
  it("does not ask the layout for its content size while handling a scroll", () => {
    const element = document.createElement("div");

    document.body.appendChild(element);
    mockGeometry(element, { height: 400, width: 300 });
    mockScrollExtent(element, { height: 1_000, width: 300 });

    const rects: Rect[] = [];
    let reads = 0;

    const scope = effectScope();

    scope.run(() =>
      useVirtualizerScroll({
        contentSize: () => {
          reads += 1;

          return new Size(300, 1_000);
        },
        element,
        isScrolling: () => false,
        onScrollEnd: () => {},
        onScrollStart: () => {},
        onSizeChange: () => {},
        onVisibleRectChange: (rect) => rects.push(rect),
      }),
    );

    setups.push(() => {
      scope.stop();
      element.remove();
    });

    reads = 0;
    element.scrollTop = 999_999;
    element.dispatchEvent(new Event("scroll", { bubbles: false }));

    expect(reads).toBe(0);
    // Still clamped: 1000 of content less the 400 on screen.
    expect(rects.at(-1)).toEqual(new Rect(0, 600, 300, 400));
  });
});
