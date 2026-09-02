import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const CONTAINER = 1000;
const KEY = "ropav:splitter:editor";

const restore: (() => void)[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();

  for (const property of ["clientWidth", "clientHeight"] as const) {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property);

    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get: () => CONTAINER,
    });

    restore.push(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, property, original);
    });
  }
});

afterEach(() => {
  restore.splice(0).forEach((undo) => undo());
  vi.useRealTimers();
  localStorage.clear();
});

const slots = (container: HTMLElement, name: string) => [
  ...container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
];

const basisOf = (panel: HTMLElement) => parseFloat(panel.style.flexBasis);

const key = (element: HTMLElement, keyName: string) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName }),
  );

  return nextTick();
};

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props: { autoSaveId: "editor", ...props } });

  await nextTick();

  return result;
};

/** Let the debounce elapse and the watcher settle. */
const settle = async () => {
  await vi.advanceTimersByTimeAsync(200);
  await nextTick();
};

const stored = () => JSON.parse(localStorage.getItem(KEY)!);

describe("Splitter persistence", () => {
  it("writes the layout under the auto save id", async () => {
    const { container, unmount } = await render();

    await key(slots(container, "splitter-handle")[0]!, "ArrowRight");
    await settle();

    expect(stored()).toMatchObject({
      o: "horizontal",
      p: [{ k: "start" }, { k: "end" }],
      v: 1,
    });
    unmount();
  });

  /* Declared sizes, not pixels — which is what makes the restore independent of the container. */
  it("stores what the panels declare rather than their pixels", async () => {
    const { container, unmount } = await render();

    await key(slots(container, "splitter-handle")[0]!, "ArrowRight");
    await settle();

    expect(stored().p[0].s).toBe("1.02fr");
    unmount();
  });

  it("writes nothing while a drag is still in flight", async () => {
    const { container, unmount } = await render();
    const handle = slots(container, "splitter-handle")[0]!;

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, button: 0, clientX: 80, pointerId: 1 }),
    );
    await nextTick();
    await settle();

    expect(localStorage.getItem(KEY)).toBeNull();

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    await nextTick();
    await settle();

    expect(localStorage.getItem(KEY)).not.toBeNull();
    unmount();
  });

  it("restores the layout on the next mount", async () => {
    const first = await render();

    await key(slots(first.container, "splitter-handle")[0]!, "End");
    await settle();
    first.unmount();

    const second = await render();

    await nextTick();

    expect(basisOf(slots(second.container, "splitter-panel")[0]!)).toBe(1000);
    second.unmount();
  });

  it("restores a collapsed panel as collapsed", async () => {
    const panels = [
      { collapsedSize: 0, id: "start", isCollapsible: true, minSize: 200 },
      { id: "end" },
    ];
    const first = await render({ panels });

    await key(slots(first.container, "splitter-handle")[0]!, "Enter");
    await settle();

    expect(stored().p[0].c).toBe(true);
    first.unmount();

    const second = await render({ panels });

    await nextTick();

    expect(slots(second.container, "splitter-panel")[0]!.dataset["collapsed"]).toBe("true");
    second.unmount();
  });

  describe("refusing a layout it cannot trust", () => {
    it("ignores one written for a different set of panels", async () => {
      const first = await render();

      await key(slots(first.container, "splitter-handle")[0]!, "End");
      await settle();
      first.unmount();

      const second = await render({ panels: [{ id: "start" }, { id: "middle" }, { id: "end" }] });

      await nextTick();

      expect(slots(second.container, "splitter-panel").map(basisOf)).toEqual([333, 334, 333]);
      second.unmount();
    });

    it("ignores one written for the other orientation", async () => {
      const first = await render();

      await key(slots(first.container, "splitter-handle")[0]!, "End");
      await settle();
      first.unmount();

      const second = await render({ orientation: "vertical" });

      await nextTick();

      expect(slots(second.container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      second.unmount();
    });

    it("ignores a stored version it does not know", async () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          o: "horizontal",
          p: [
            { k: "start", s: 900 },
            { k: "end", s: 100 },
          ],
          v: 99,
        }),
      );

      const { container, unmount } = await render();

      await nextTick();

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });

    it("ignores anything that is not the JSON it wrote", async () => {
      localStorage.setItem(KEY, "not json");

      const { container, unmount } = await render();

      await nextTick();

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });
  });

  it("stores nothing at all without an auto save id", async () => {
    const { container, unmount } = await render({ autoSaveId: undefined });

    await key(slots(container, "splitter-handle")[0]!, "ArrowRight");
    await settle();

    expect(localStorage.length).toBe(0);
    unmount();
  });
});
