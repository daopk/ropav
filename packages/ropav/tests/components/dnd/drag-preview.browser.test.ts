import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

/**
 * The synchronous drag preview.
 *
 * This is the one mechanism the port could not copy: React renders the preview inside the
 * `dragstart` handler with `flushSync`, and Vue 3.6 has no equivalent. The replacement renders
 * the slot directly into an already-mounted container, which only works if a Vapor slot really
 * does produce live DOM synchronously.
 *
 * A real browser is the only place that can settle it — `setDragImage` exists, and a genuine
 * `DragEvent` carries a real `DataTransfer`.
 */
describe("DragPreview (browser)", () => {
  const dragStart = (element: HTMLElement) => {
    const dataTransfer = new DataTransfer();
    const captured: {node: Element | null; x?: number; y?: number} = {node: null};
    const original = dataTransfer.setDragImage.bind(dataTransfer);

    dataTransfer.setDragImage = (node: Element, x: number, y: number) => {
      captured.node = node;
      captured.x = x;
      captured.y = y;
      original(node, x, y);
    };

    element.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        clientX: 5,
        clientY: 5,
        dataTransfer,
      }),
    );

    return captured;
  };

  it("hands setDragImage a node holding the rendered slot, synchronously", async () => {
    const {container, unmount} = renderVapor(Fixture);

    await nextTick();

    const draggable = container.querySelector<HTMLElement>('[data-testid="draggable"]')!;
    const captured = dragStart(draggable);

    // Synchronously, with no tick in between: the node is populated by the time
    // `setDragImage` is called, which is the whole requirement.
    expect(captured.node).not.toBeNull();
    expect(captured.node?.textContent).toContain("1 item(s)");

    unmount();
  });

  it("renders the preview offscreen rather than hidden, so it can be painted", async () => {
    const {container, unmount} = renderVapor(Fixture);

    await nextTick();

    const preview = container.querySelector<HTMLElement>('[data-slot="drag-preview"]')!;
    const style = getComputedStyle(preview);

    // `display: none` or `visibility: hidden` would make `setDragImage` produce nothing.
    expect(style.display).not.toBe("none");
    expect(style.visibility).not.toBe("hidden");
    expect(style.position).toBe("fixed");

    unmount();
  });

  it("passes the dragged items to the slot", async () => {
    const {container, unmount} = renderVapor(Fixture);

    await nextTick();

    const draggable = container.querySelector<HTMLElement>('[data-testid="draggable"]')!;
    const captured = dragStart(draggable);

    expect(captured.node?.querySelector('[data-testid="preview-content"]')).not.toBeNull();

    unmount();
  });

  // Left in place for a frame so the browser can paint from it, then removed — otherwise every
  // drag would leave its preview behind in the DOM.
  it("clears the preview a frame after the drag starts", async () => {
    const {container, unmount} = renderVapor(Fixture);

    await nextTick();

    const draggable = container.querySelector<HTMLElement>('[data-testid="draggable"]')!;
    const preview = container.querySelector<HTMLElement>('[data-slot="drag-preview"]')!;

    dragStart(draggable);
    expect(preview.childNodes.length).toBeGreaterThan(0);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(preview.childNodes.length).toBe(0);

    unmount();
  });
});
