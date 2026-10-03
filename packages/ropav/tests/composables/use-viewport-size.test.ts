import { afterEach, describe, expect, it } from "vitest";

import { useViewportSize } from "@/composables/use-viewport-size";

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
