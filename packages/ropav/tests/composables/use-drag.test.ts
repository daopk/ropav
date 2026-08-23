import type {DragHarnessOptions, DragHarnessReady} from "../fixtures/dnd-harness.types";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {getDragSession} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";
import {CUSTOM_DRAG_TYPE} from "@/utils/dnd-constants";
import {globalAllowedDropOperations} from "@/utils/dnd-state";

import Harness from "../fixtures/drag-harness.vue";

/**
 * `useDrag`, mounted.
 *
 * It resolves a locale, and injecting one only works inside a component — so the composable is
 * driven through a harness rather than an `effectScope`. Handlers are still called directly, so
 * a test controls the event it hands over.
 */
const unmounts: (() => void)[] = [];

const mount = (options: DragHarnessOptions = {}): DragHarnessReady => {
  let ready!: DragHarnessReady;
  const rendered = renderVapor(Harness, {
    props: {onReady: (value: DragHarnessReady) => (ready = value), options},
  });

  unmounts.push(rendered.unmount);

  return ready;
};

/**
 * Build a drag event aimed at an element.
 *
 * `currentTarget` is only populated by the DOM while an event is actually dispatching, and these
 * handlers are called directly rather than through a listener, so it is set by hand.
 */
const dragEvent = (type: string, target: HTMLElement, init: Partial<DragEventInit> = {}) => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
    ...init,
  });

  Object.defineProperty(event, "currentTarget", {configurable: true, value: target});
  Object.defineProperty(event, "target", {configurable: true, value: target});

  return event;
};

const flushFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

beforeEach(() => {
  setInteractionModality("keyboard");
});

afterEach(() => {
  getDragSession()?.cancel();
  while (unmounts.length) unmounts.pop()?.();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useDrag", () => {
  describe("attributes", () => {
    it("marks the element draggable and describes how to start a drag", () => {
      const {attrs} = mount({getItems: () => [{"text/plain": "a"}]});

      expect(attrs.value.draggable).toBe("true");
      expect(attrs.value["aria-describedby"]).toBeTruthy();
    });

    it("reports the element as not draggable when disabled", () => {
      const {attrs} = mount({getItems: () => [{"text/plain": "a"}], isDisabled: true});

      expect(attrs.value.draggable).toBe("false");
      expect(attrs.value["aria-describedby"]).toBeUndefined();
    });

    // With a separate control the description belongs on that control, or the element would
    // advertise a gesture it does not respond to.
    it("moves the description onto the drag button when there is one", () => {
      const {attrs, dragButtonAttrs} = mount({
        getItems: () => [{"text/plain": "a"}],
        hasDragButton: true,
      });

      expect(attrs.value["aria-describedby"]).toBeUndefined();
      expect(dragButtonAttrs.value["aria-describedby"]).toBeTruthy();
    });
  });

  describe("native drag", () => {
    it("writes the items onto the data transfer", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "payload"}]});
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      });

      Object.defineProperty(event, "currentTarget", {configurable: true, value: node});
      Object.defineProperty(event, "target", {configurable: true, value: node});
      handlers.onDragstart(event);

      expect(event.dataTransfer?.getData("text/plain")).toBe("payload");
    });

    it("serializes several representations through the custom type", () => {
      const {element: node, handlers} = mount({
        getItems: () => [{"text/html": "<b>a</b>", "text/plain": "a"}],
      });
      const event = new DragEvent("dragstart", {dataTransfer: new DataTransfer()});

      Object.defineProperty(event, "currentTarget", {configurable: true, value: node});
      handlers.onDragstart(event);

      expect([...(event.dataTransfer?.types ?? [])]).toContain(CUSTOM_DRAG_TYPE);
    });

    it("records the allowed operations globally for the drop side to read", () => {
      const {element: node, handlers} = mount({
        getAllowedDropOperations: () => ["copy"],
        getItems: () => [{"text/plain": "a"}],
      });
      const event = new DragEvent("dragstart", {dataTransfer: new DataTransfer()});

      Object.defineProperty(event, "currentTarget", {configurable: true, value: node});
      handlers.onDragstart(event);

      expect(globalAllowedDropOperations).toBe(2);
      expect(event.dataTransfer?.effectAllowed).toBe("copy");
    });

    // With no operations allowed the transfer must say "none". `"cancel"` is not a value
    // `effectAllowed` accepts, and the browser would silently fall back to allowing everything.
    it("writes none rather than cancel for an empty operation set", () => {
      const {element: node, handlers} = mount({
        getAllowedDropOperations: () => [],
        getItems: () => [{"text/plain": "a"}],
      });
      const event = new DragEvent("dragstart", {dataTransfer: new DataTransfer()});

      Object.defineProperty(event, "currentTarget", {configurable: true, value: node});
      handlers.onDragstart(event);

      expect(event.dataTransfer?.effectAllowed).toBe("none");
    });

    it("reports the drag as started only after a frame", async () => {
      const {element: node, handlers, isDragging} = mount({getItems: () => [{"text/plain": "a"}]});

      handlers.onDragstart(dragEvent("dragstart", node));

      // The preview is painted from the element as it looked before `data-dragging` restyled it.
      expect(isDragging.value).toBe(false);
      await flushFrame();
      expect(isDragging.value).toBe(true);
    });

    it("reports movement, ignoring events where the pointer has not moved", () => {
      const onDragMove = vi.fn();
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}], onDragMove});

      handlers.onDragstart(dragEvent("dragstart", node, {clientX: 10, clientY: 10}));
      handlers.onDrag(new DragEvent("drag", {clientX: 10, clientY: 10}));
      expect(onDragMove).not.toHaveBeenCalled();

      handlers.onDrag(new DragEvent("drag", {clientX: 20, clientY: 10}));
      expect(onDragMove).toHaveBeenCalledTimes(1);
    });

    it("reports the operation the drop side settled on when the drag ends", async () => {
      const onDragEnd = vi.fn();
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}], onDragEnd});

      handlers.onDragstart(dragEvent("dragstart", node));
      await flushFrame();

      const end = new DragEvent("dragend", {dataTransfer: new DataTransfer()});

      end.dataTransfer!.dropEffect = "move";
      handlers.onDragend(end);

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "move"});
    });
  });

  describe("keyboard drag", () => {
    it("starts an accessible drag on Enter", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}]});
      const keyup = new KeyboardEvent("keyup", {bubbles: true, cancelable: true, key: "Enter"});

      Object.defineProperty(keyup, "currentTarget", {configurable: true, value: node});
      Object.defineProperty(keyup, "target", {configurable: true, value: node});
      handlers.onKeyupCapture?.(keyup);

      expect(getDragSession()).not.toBeNull();
    });

    // Captured and swallowed so selection or an item action never also fires on the same key.
    it("swallows the Enter that starts the drag", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}]});
      const keydown = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "Enter"});

      Object.defineProperty(keydown, "currentTarget", {configurable: true, value: node});
      Object.defineProperty(keydown, "target", {configurable: true, value: node});
      handlers.onKeydownCapture?.(keydown);

      expect(keydown.defaultPrevented).toBe(true);
    });

    // Enter on a child belongs to that child, not to the draggable wrapper.
    it("ignores Enter that came from a descendant", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}]});
      const child = document.createElement("button");

      node.appendChild(child);

      const keyup = new KeyboardEvent("keyup", {bubbles: true, cancelable: true, key: "Enter"});

      Object.defineProperty(keyup, "currentTarget", {configurable: true, value: node});
      Object.defineProperty(keyup, "target", {configurable: true, value: child});
      handlers.onKeyupCapture?.(keyup);

      expect(getDragSession()).toBeNull();
    });

    it("leaves the keyboard path alone when a drag button owns it", () => {
      const {element: node, handlers} = mount({
        getItems: () => [{"text/plain": "a"}],
        hasDragButton: true,
      });
      const keyup = new KeyboardEvent("keyup", {bubbles: true, cancelable: true, key: "Enter"});

      Object.defineProperty(keyup, "currentTarget", {configurable: true, value: node});
      Object.defineProperty(keyup, "target", {configurable: true, value: node});
      handlers.onKeyupCapture?.(keyup);

      expect(getDragSession()).toBeNull();
    });

    it("starts a drag from a drag button pressed by keyboard", () => {
      const {element: node, onDragButtonPress} = mount({
        getItems: () => [{"text/plain": "a"}],
        hasDragButton: true,
      });

      onDragButtonPress({pointerType: "keyboard", target: node} as never);

      expect(getDragSession()).not.toBeNull();
    });

    it("ignores a drag button pressed by a real pointer, which drags natively instead", () => {
      const {element: node, onDragButtonPress} = mount({
        getItems: () => [{"text/plain": "a"}],
        hasDragButton: true,
      });

      onDragButtonPress({pointerType: "mouse", target: node} as never);

      expect(getDragSession()).toBeNull();
    });
  });

  describe("screen reader drag", () => {
    // A click with no pointer data behind it is how NVDA and JAWS activate in browse mode.
    it("starts an accessible drag from a virtual click", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}]});
      const click = new MouseEvent("click", {bubbles: true, cancelable: true});

      Object.defineProperty(click, "target", {configurable: true, value: node});
      handlers.onClick?.(click);

      expect(getDragSession()).not.toBeNull();
    });

    it("ignores a click that came from a real pointer", () => {
      const {element: node, handlers} = mount({getItems: () => [{"text/plain": "a"}]});
      const click = new MouseEvent("click", {bubbles: true, cancelable: true, detail: 1});

      Object.defineProperty(click, "target", {configurable: true, value: node});
      handlers.onClick?.(click);

      expect(getDragSession()).toBeNull();
    });
  });

  describe("disabled", () => {
    it("does nothing on any accessible entry point", () => {
      const {
        element: node,
        handlers,
        isDragging,
      } = mount({
        getItems: () => [{"text/plain": "a"}],
        isDisabled: true,
      });
      const click = new MouseEvent("click", {bubbles: true, cancelable: true});

      Object.defineProperty(click, "target", {configurable: true, value: node});
      handlers.onClick?.(click);

      expect(getDragSession()).toBeNull();
      expect(isDragging.value).toBe(false);
    });
  });
});
