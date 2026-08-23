import type {UseVirtualizerScrollReturn} from "@/composables/use-virtualizer-scroll";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {useVirtualizerScroll} from "@/composables/use-virtualizer-scroll";
import {Rect, Size} from "@/utils/virtualizer-geometry";

/**
 * jsdom lays nothing out, so the container's measurements are defined on the element itself
 * rather than on `HTMLElement.prototype` — a prototype stub would make the content wrapper and
 * every row claim the same size, and the test would agree with itself while proving nothing.
 */
const mockGeometry = (element: HTMLElement, size: {width: number; height: number}) => {
  Object.defineProperty(element, "clientWidth", {configurable: true, value: size.width});
  Object.defineProperty(element, "clientHeight", {configurable: true, value: size.height});
};

interface SetupOptions {
  container?: {width: number; height: number};
  contentSize?: Size;
}

const setups: (() => void)[] = [];

const setup = (options: SetupOptions = {}) => {
  const element = document.createElement("div");

  document.body.appendChild(element);
  mockGeometry(element, options.container ?? {height: 400, width: 300});

  const contentSize = shallowRef(options.contentSize ?? new Size(300, 50_000));
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
    element.dispatchEvent(new Event("scroll", {bubbles: false}));
  };

  return {contentSize, element, rects, scroll, scrollEnd, scrollStart, scrollTo, sizes};
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
    const {rects, sizes} = setup();

    expect(sizes).toEqual([new Size(300, 400)]);
    expect(rects).toEqual([new Rect(0, 0, 300, 400)]);
  });

  it("bounds the visible rectangle by the window viewport", () => {
    // jsdom's window is 1024x768, and the container is taller than that.
    const {rects} = setup({container: {height: 5_000, width: 300}});

    expect(rects.at(-1)).toEqual(new Rect(0, 0, 300, 768));
  });

  it("says nothing while the container has no size", () => {
    const {rects, sizes} = setup({container: {height: 0, width: 0}});

    // The size is still reported — that is how the virtualizer learns it has no room yet — but
    // the visible rectangle is withheld while it would be empty, so nothing keys off a zero rect.
    expect(sizes).toEqual([new Size(0, 0)]);
    expect(rects).toEqual([]);
  });

  it("follows the container's own scrolling", () => {
    const {rects, scrollTo} = setup();

    scrollTo(500);

    expect(rects.at(-1)).toEqual(new Rect(0, 500, 300, 400));
  });

  it("clamps an over-scroll to the content", () => {
    const {rects, scrollTo} = setup({contentSize: new Size(300, 1_000)});

    scrollTo(999_999);

    // 1000 of content less the 400 on screen: an elastic bounce past the end must not shake
    // the window back and forth.
    expect(rects.at(-1)).toEqual(new Rect(0, 600, 300, 400));
  });

  it("follows the page scrolling the container out of the viewport", () => {
    const {element, rects} = setup({container: {height: 5_000, width: 300}});

    element.getBoundingClientRect = () => ({x: 0, y: -200}) as DOMRect;
    document.dispatchEvent(new Event("scroll"));

    // The container did not scroll inside itself; 200px of it is above the viewport, so the
    // window moves down and shortens by what is left below.
    expect(rects.at(-1)).toEqual(new Rect(0, 200, 300, 768));
  });

  it("reports the start and the settling of a scroll once each", () => {
    const {scrollEnd, scrollStart, scrollTo} = setup();

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
    const {contentSize, scroll, scrollTo} = setup();

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
    const {rects, scroll, scrollTo} = setup();
    const before = rects.length;

    void scroll;
    setups.splice(0).forEach((teardown) => teardown());
    scrollTo(500);

    expect(rects).toHaveLength(before);
  });
});
