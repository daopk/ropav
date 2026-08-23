import type { DropHarnessOptions, DropHarnessReady } from "../fixtures/dnd-harness.types";
import type { DndStringFormatter } from "@/composables/drag-manager";

import { LocalizedStringDictionary, LocalizedStringFormatter } from "@internationalized/string";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, shallowRef } from "vue";

import { beginDragging, getDragSession } from "@/composables/drag-manager";
import { setInteractionModality } from "@/composables/use-interaction-states";
import { dndStrings } from "@/i18n/dnd";
import { DROP_OPERATION } from "@/utils/dnd-constants";
import { writeToDataTransfer } from "@/utils/dnd-data-transfer";
import {
  clearGlobalDnDState,
  globalDropEffect,
  setDraggingCollectionRef,
  setGlobalAllowedDropOperations,
  setGlobalDropEffect,
} from "@/utils/dnd-state";

import Harness from "../fixtures/drop-harness.vue";

/**
 * `useDrop`, mounted.
 *
 * It resolves a locale, and injecting one only works inside a component — so the composable is
 * driven through a harness rather than an `effectScope`. The harness owns the element, because
 * `useDrop` registers it with the drag session on mount.
 */
const unmounts: (() => void)[] = [];

const mount = (options: DropHarnessOptions = {}): DropHarnessReady & { node: HTMLElement } => {
  let ready!: DropHarnessReady;
  const rendered = renderVapor(Harness, {
    props: { onReady: (value: DropHarnessReady) => (ready = value), options },
  });

  unmounts.push(rendered.unmount);

  return { ...ready, node: ready.element };
};

/** A bare element, for the cases that only need something to point a drag source at. */
const element = (): HTMLElement => {
  const node = document.createElement("div");

  node.tabIndex = 0;
  document.body.appendChild(node);

  return node;
};

/**
 * A drag event carrying a transfer that already holds an item.
 *
 * `currentTarget` and `target` are assigned by hand: the handlers are invoked directly rather
 * than through a listener, and the DOM only fills those in while dispatching.
 */
const dragEvent = (
  type: string,
  target: HTMLElement,
  init: Partial<DragEventInit> & {
    effectAllowed?: DataTransfer["effectAllowed"];
    eventTarget?: Element;
  } = {},
) => {
  const dataTransfer = new DataTransfer();

  writeToDataTransfer(dataTransfer, [{ "text/plain": "payload" }]);
  dataTransfer.effectAllowed = init.effectAllowed ?? "all";

  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 5,
    clientY: 5,
    dataTransfer,
    ...init,
  });

  Object.defineProperty(event, "currentTarget", { configurable: true, value: target });
  Object.defineProperty(event, "target", {
    configurable: true,
    value: init.eventTarget ?? target,
  });

  return event;
};

/**
 * The message formatter `beginDragging` requires.
 *
 * Built once here rather than through `useLocalizedStringFormatter`, which needs a Vue scope to
 * inject a locale from. These tests drive the manager directly, so the default locale is enough.
 */
const stringFormatter = computed(
  () => new LocalizedStringFormatter("en-US", new LocalizedStringDictionary(dndStrings)),
) as DndStringFormatter;

beforeEach(() => {
  setInteractionModality("keyboard");
  setGlobalAllowedDropOperations(DROP_OPERATION.none);
  setGlobalDropEffect(undefined);
  clearGlobalDnDState();
});

afterEach(() => {
  getDragSession()?.cancel();
  while (unmounts.length) unmounts.pop()?.();
  document.body.innerHTML = "";
});

describe("useDrop", () => {
  describe("entering and leaving", () => {
    it("becomes a drop target on dragenter", () => {
      const { handlers, isDropTarget, node } = mount();

      handlers.onDragenter(dragEvent("dragenter", node));

      expect(isDropTarget.value).toBe(true);
    });

    it("reports the enter position relative to the target", () => {
      const onDropEnter = vi.fn();
      const { handlers, node } = mount({ onDropEnter });

      vi.spyOn(node, "getBoundingClientRect").mockReturnValue({ x: 2, y: 3 } as DOMRect);
      handlers.onDragenter(dragEvent("dragenter", node, { clientX: 12, clientY: 13 }));

      expect(onDropEnter).toHaveBeenCalledWith({ type: "dropenter", x: 10, y: 10 });
    });

    it("stops being a drop target on dragleave", () => {
      const { handlers, isDropTarget, node } = mount();

      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDragleave(dragEvent("dragleave", node));

      expect(isDropTarget.value).toBe(false);
    });

    /**
     * Moving onto a child fires `dragleave` on the parent before `dragenter` on the child.
     *
     * WebKit reports `relatedTarget` as null, so "am I still inside" is answered by counting
     * entered elements instead. Without that, dragging across any child would flicker the target
     * off and on.
     */
    it("stays a drop target while the pointer moves onto a child", () => {
      const { handlers, isDropTarget, node } = mount();
      const child = node.querySelector<HTMLElement>('[data-testid="child"]')!;

      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDragenter(dragEvent("dragenter", node, { eventTarget: child }));
      handlers.onDragleave(dragEvent("dragleave", node));

      expect(isDropTarget.value).toBe(true);
    });
  });

  describe("drop operations", () => {
    it("asks the caller which operation applies and writes it to the transfer", () => {
      const getDropOperation = vi.fn(() => "copy" as const);
      const { handlers, node } = mount({ getDropOperation });
      const event = dragEvent("dragenter", node);

      handlers.onDragenter(event);

      expect(getDropOperation).toHaveBeenCalled();
      expect(event.dataTransfer?.dropEffect).toBe("copy");
    });

    // An operation the drag never advertised cannot be performed, whatever the target says.
    it("refuses an operation the drag does not allow", () => {
      const { handlers, isDropTarget, node } = mount({ getDropOperation: () => "link" });

      handlers.onDragenter(dragEvent("dragenter", node, { effectAllowed: "move" }));

      expect(isDropTarget.value).toBe(false);
    });

    it("hands the caller the types the drag carries", () => {
      const getDropOperation = vi.fn(() => "move" as const);
      const { handlers, node } = mount({ getDropOperation });

      handlers.onDragenter(dragEvent("dragenter", node));

      const [types] = getDropOperation.mock.calls[0] as unknown as [
        { has: (t: string) => boolean },
      ];

      expect(types.has("text/plain")).toBe(true);
      expect(types.has("image/png")).toBe(false);
    });

    it("resolves the operation from the pointer position when asked to", () => {
      const getDropOperationForPoint = vi.fn(() => "move" as const);
      const { handlers, node } = mount({ getDropOperationForPoint });

      vi.spyOn(node, "getBoundingClientRect").mockReturnValue({ x: 1, y: 1 } as DOMRect);
      handlers.onDragenter(dragEvent("dragenter", node, { clientX: 11, clientY: 21 }));

      expect(getDropOperationForPoint.mock.calls[0]?.slice(2)).toEqual([10, 20]);
    });
  });

  describe("dropping", () => {
    it("reads the dropped items back out", async () => {
      const onDrop = vi.fn();
      const { handlers, node } = mount({ getDropOperation: () => "move", onDrop });

      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDrop(dragEvent("drop", node));

      const event = onDrop.mock.calls[0]?.[0] as {
        dropOperation: string;
        items: { kind: string; getText: (t: string) => Promise<string> }[];
      };

      expect(event.dropOperation).toBe("move");
      await expect(event.items[0]?.getText("text/plain")).resolves.toBe("payload");
    });

    it("stops being a drop target once the drop lands", () => {
      const { handlers, isDropTarget, node } = mount({ getDropOperation: () => "move" });

      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDrop(dragEvent("drop", node));

      expect(isDropTarget.value).toBe(false);
    });

    /**
     * The drop effect is recorded globally so `dragend` can read it back — Chrome on Android
     * always reports "none" there. It is only worth keeping when the drag came from a collection
     * of ours; a foreign drag has no `dragend` of ours to inform, so the slot is cleared instead
     * of being left dirty for the next drag.
     */
    it("clears the recorded drop effect when the drag came from outside", () => {
      const { handlers, node } = mount({ getDropOperation: () => "copy" });

      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDrop(dragEvent("drop", node));

      expect(globalDropEffect).toBeUndefined();
    });

    it("keeps the recorded drop effect when the drag came from a collection", () => {
      const { handlers, node } = mount({ getDropOperation: () => "copy" });

      setDraggingCollectionRef(shallowRef(element()));
      handlers.onDragenter(dragEvent("dragenter", node));
      handlers.onDrop(dragEvent("drop", node));

      expect(globalDropEffect).toBe("copy");
    });
  });

  describe("keyboard drag session", () => {
    it("registers itself as a target the keyboard drag can reach", async () => {
      const source = element();
      const { node } = mount({ getDropOperation: () => "move" });

      beginDragging(
        {
          allowedDropOperations: ["move"],
          element: source,
          items: [{ "text/plain": "a" }],
        },
        stringFormatter,
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      expect(getDragSession()?.validDropTargets.map((t) => t.element)).toContain(node);
    });

    it("does not register while disabled", async () => {
      const source = element();
      const { node } = mount({ isDisabled: true });

      beginDragging(
        {
          allowedDropOperations: ["move"],
          element: source,
          items: [{ "text/plain": "a" }],
        },
        stringFormatter,
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      expect(getDragSession()?.validDropTargets.map((t) => t.element)).not.toContain(node);
    });

    /**
     * The session holds its types as a plain `Set<string>`.
     *
     * React Aria passes that set straight through, where it duck-types as `DragTypes` and
     * silently loses wildcard matching — `has("text/*")` would answer false. It is wrapped here
     * so the keyboard path answers the same as the pointer path.
     */
    it("answers wildcard type questions on the keyboard path too", async () => {
      const source = element();
      const getDropOperation = vi.fn(() => "move" as const);

      mount({ getDropOperation });
      beginDragging(
        {
          allowedDropOperations: ["move"],
          element: source,
          items: [{ "text/plain": "a" }],
        },
        stringFormatter,
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const [types] = getDropOperation.mock.calls[0] as unknown as [
        { has: (t: string) => boolean },
      ];

      expect(types.has("text/*")).toBe(true);
      expect(types.has("image/*")).toBe(false);
    });
  });

  describe("disabled", () => {
    it("ignores every drag event", () => {
      const onDropEnter = vi.fn();
      const { handlers, isDropTarget, node } = mount({ isDisabled: true, onDropEnter });

      handlers.onDragenter(dragEvent("dragenter", node));

      expect(onDropEnter).not.toHaveBeenCalled();
      expect(isDropTarget.value).toBe(false);
    });
  });
});
