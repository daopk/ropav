import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import { SplitterHandle, SplitterPanel, SplitterRoot } from "@/components/splitter";

/**
 * The splitter mounted the way a consumer mounts it: from a VDOM host, with the panels and handles
 * written in the host and forwarded through the root's slot.
 *
 * Everything here is covered by the Vapor suite, and that is exactly why the file exists. Content
 * written in Vapor resolves `inject` against the component that renders it, so the context is
 * found wherever it was provided; content written in a VDOM host resolves against the host, so
 * only what the root itself provides is found. A panel that cannot see the root would still render
 * correctly — right classes, right `data-slot` — and simply never take a size, which the Vapor
 * suite structurally cannot fail on.
 *
 * Registration order matters here twice over: it decides which panel a handle grows and which it
 * shrinks, so a splitter that took its order from the injection chain rather than from the DOM
 * would invert the drag in interop alone.
 */
const CONTAINER = 1000;

const restore: (() => void)[] = [];

beforeEach(() => {
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

afterEach(() => restore.splice(0).forEach((undo) => undo()));

const PANELS = ["start", "middle", "end"];

const renderSplitter = (props: Record<string, unknown> = {}) =>
  renderInterop(SplitterRoot, {
    props: { "aria-label": "Editor layout", ...props },
    slots: {
      default: () =>
        PANELS.flatMap((panel, index) => [
          ...(index > 0
            ? [h(SplitterHandle, { id: `handle-${index - 1}`, key: `h${index}` })]
            : []),
          h(SplitterPanel, { id: panel, key: panel }, { default: () => panel }),
        ]),
    },
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

describe("Splitter (interop)", () => {
  it("reaches every panel and handle written in the host", async () => {
    const { container, unmount } = renderSplitter();

    await nextTick();

    expect(slots(container, "splitter-panel")).toHaveLength(3);
    expect(slots(container, "splitter-handle")).toHaveLength(2);
    unmount();
  });

  it("gives panels written in the host their computed sizes", async () => {
    const { container, unmount } = renderSplitter();

    await nextTick();

    expect(slots(container, "splitter-panel").map(basisOf)).toEqual([333, 334, 333]);
    unmount();
  });

  it("keeps the panels in the order the host wrote them", async () => {
    const { container, unmount } = renderSplitter();

    await nextTick();

    const first = slots(container, "splitter-panel")[0]!;

    expect(first.textContent).toBe("start");
    expect(slots(container, "splitter-handle")[0]!.getAttribute("aria-controls")).toBe(first.id);
    unmount();
  });

  it("drags an edge written in the host, growing the panel before it", async () => {
    const { container, unmount } = renderSplitter();

    await nextTick();
    await key(slots(container, "splitter-handle")[0]!, "ArrowRight");

    const [start, middle] = slots(container, "splitter-panel").map(basisOf);

    expect(start).toBeGreaterThan(333);
    expect(middle).toBeLessThan(333);
    unmount();
  });

  it("carries the root's disabled state to every handle written in the host", async () => {
    const { container, unmount } = renderSplitter({ isDisabled: true });

    await nextTick();

    for (const handle of slots(container, "splitter-handle")) {
      expect(handle.dataset["disabled"]).toBe("true");
    }
    unmount();
  });

  it("reports the sizes back to the host", async () => {
    const onResize = vi.fn();
    const { container, unmount } = renderSplitter({ onResize });

    await nextTick();
    await key(slots(container, "splitter-handle")[0]!, "ArrowRight");

    expect(onResize).toHaveBeenCalled();
    unmount();
  });
});
