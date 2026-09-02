import { afterEach, describe, expect, it } from "vitest";

import { usePageSize, useViewportSize } from "@/composables/use-viewport-size";

import { withScope } from "../harness/scope";

interface FakeViewport {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  height: number;
  scale: number;
  width: number;
  emitResize: () => void;
  listenerCount: () => number;
}

/** jsdom has no `visualViewport`, so the tests supply one and drive its resize themselves. */
const fakeViewport = (size: { height: number; scale?: number; width: number }): FakeViewport => {
  const listeners = new Set<() => void>();

  return {
    addEventListener: (_type, listener) => listeners.add(listener),
    emitResize: () => listeners.forEach((listener) => listener()),
    height: size.height,
    listenerCount: () => listeners.size,
    removeEventListener: (_type, listener) => listeners.delete(listener),
    scale: size.scale ?? 1,
    width: size.width,
  };
};

const install = (viewport: FakeViewport | undefined) =>
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });

/** jsdom reports 0 for both, so a test that cares has to say what the document element is. */
const setDocumentSize = (width: number, height: number) => {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: height,
  });
};

afterEach(() => {
  install(undefined);
  setDocumentSize(0, 0);
});

describe("useViewportSize", () => {
  describe("measuring", () => {
    /*
     * The reason this exists: a software keyboard does not resize the window, it covers part of
     * it, and only `visualViewport` reports what is left.
     */
    it("reads the visual viewport rather than the window", () => {
      setDocumentSize(400, 900);
      install(fakeViewport({ height: 320, width: 400 }));

      const [size, dispose] = withScope(() => useViewportSize());

      expect(size.value).toEqual({ height: 320, width: 400 });

      dispose();
    });

    it("falls back to the document element when there is no visual viewport", () => {
      setDocumentSize(1024, 768);
      install(undefined);

      const [size, dispose] = withScope(() => useViewportSize());

      expect(size.value).toEqual({ height: 768, width: 1024 });

      dispose();
    });

    /* Multiplied by the scale to undo pinch zoom and get the natural size back. */
    it("undoes pinch zoom", () => {
      setDocumentSize(400, 900);
      install(fakeViewport({ height: 200, scale: 2, width: 200 }));

      const [size, dispose] = withScope(() => useViewportSize());

      expect(size.value).toEqual({ height: 400, width: 400 });

      dispose();
    });

    /* The visual viewport's width can include the scrollbar gutter, so the document is a ceiling. */
    it("caps the width at the document element", () => {
      setDocumentSize(380, 900);
      install(fakeViewport({ height: 320, width: 400 }));

      const [size, dispose] = withScope(() => useViewportSize());

      expect(size.value.width).toBe(380);

      dispose();
    });
  });

  describe("resize", () => {
    it("follows the visual viewport changing", () => {
      setDocumentSize(400, 900);

      const viewport = fakeViewport({ height: 800, width: 400 });

      install(viewport);

      const [size, dispose] = withScope(() => useViewportSize());

      expect(size.value.height).toBe(800);

      viewport.height = 320;
      viewport.emitResize();

      expect(size.value.height).toBe(320);

      dispose();
    });

    /*
     * Pinch zoom shrinks the visual viewport without anything having moved, and a modal that
     * followed it would shrink away from the content the user zoomed in to read.
     */
    it("ignores a resize while pinch zoomed", () => {
      setDocumentSize(400, 900);

      const viewport = fakeViewport({ height: 800, width: 400 });

      install(viewport);

      const [size, dispose] = withScope(() => useViewportSize());
      const before = size.value;

      viewport.height = 300;
      viewport.scale = 2;
      viewport.emitResize();

      expect(size.value).toBe(before);

      dispose();
    });

    it("holds the same object when the size has not changed", () => {
      setDocumentSize(400, 900);

      const viewport = fakeViewport({ height: 800, width: 400 });

      install(viewport);

      const [size, dispose] = withScope(() => useViewportSize());
      const before = size.value;

      viewport.emitResize();

      expect(size.value).toBe(before);

      dispose();
    });
  });

  describe("teardown", () => {
    it("stops listening once the component is gone", () => {
      setDocumentSize(400, 900);

      const viewport = fakeViewport({ height: 800, width: 400 });

      install(viewport);

      const [, dispose] = withScope(() => useViewportSize());

      expect(viewport.listenerCount()).toBe(1);

      dispose();

      expect(viewport.listenerCount()).toBe(0);
    });
  });
});

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
