import { describe, expect, it } from "vitest";

import { usePageSize } from "@/composables/use-page-size";

import { withScope } from "../harness/scope";

describe("usePageSize", () => {
  /** The scrolling element jsdom resolves to, with a size a test can choose. */
  const setPageSize = (
    scroll: { height: number; width: number },
    rect = { height: 0, width: 0 },
  ) => {
    const element = document.scrollingElement ?? document.documentElement;

    Object.defineProperty(element, "scrollWidth", { configurable: true, value: scroll.width });
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: scroll.height });
    element.getBoundingClientRect = () =>
      ({
        ...rect,
        bottom: 0,
        left: 0,
        right: 0,
        toJSON: () => ({}),
        top: 0,
        x: 0,
        y: 0,
      }) as DOMRect;
  };

  it("measures the whole scrollable page", () => {
    setPageSize({ height: 2000, width: 1024 });

    const [size, dispose] = withScope(() => usePageSize());

    expect(size.value).toEqual({ height: 2000, width: 1024 });

    dispose();
  });

  /*
   * A page whose width is not a whole number would otherwise round up, and Firefox adds a
   * scrollbar for the fraction.
   */
  it("drops the fractional remainder", () => {
    setPageSize({ height: 2000, width: 1024 }, { height: 768.5, width: 1023.25 });

    const [size, dispose] = withScope(() => usePageSize());

    expect(size.value.width).toBeCloseTo(1023.75, 5);
    expect(size.value.height).toBeCloseTo(1999.5, 5);

    dispose();
  });

  it("follows the window resizing", () => {
    setPageSize({ height: 2000, width: 1024 });

    const [size, dispose] = withScope(() => usePageSize());

    expect(size.value.height).toBe(2000);

    setPageSize({ height: 3000, width: 1024 });
    window.dispatchEvent(new Event("resize"));

    expect(size.value.height).toBe(3000);

    dispose();
  });

  it("stops listening once the component is gone", () => {
    setPageSize({ height: 2000, width: 1024 });

    const [size, dispose] = withScope(() => usePageSize());

    dispose();
    setPageSize({ height: 4000, width: 1024 });
    window.dispatchEvent(new Event("resize"));

    expect(size.value.height).toBe(2000);
  });
});
