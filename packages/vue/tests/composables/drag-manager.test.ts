import type {DragManagerDragTarget, DragManagerDropTarget} from "@/composables/drag-manager";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
  beginDragging,
  getDragSession,
  isValidDropTarget,
  isVirtualDragging,
  registerDropItem,
  registerDropTarget,
} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";

/**
 * The keyboard drag session.
 *
 * Everything here drives the module-level singleton, so each test tears its own session down —
 * `beginDragging` throws on a second one, and a leaked session would swallow every pointer event
 * for the rest of the file.
 */

/** `beginDragging` defers setup one frame, so every test has to let that frame run. */
const flushFrame = async () => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const press = (key: string, init: KeyboardEventInit = {}) => {
  document.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
  document.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key, ...init}));
};

const cleanups: (() => void)[] = [];

const addElement = (id: string): HTMLElement => {
  const element = document.createElement("div");

  element.id = id;
  element.tabIndex = 0;
  document.body.appendChild(element);
  cleanups.push(() => element.remove());

  return element;
};

const addDropTarget = (
  id: string,
  overrides: Partial<DragManagerDropTarget> = {},
): {element: HTMLElement; target: DragManagerDropTarget} => {
  const element = addElement(id);
  const target: DragManagerDropTarget = {element, ...overrides};

  cleanups.push(registerDropTarget(target));

  return {element, target};
};

const dragTargetFor = (
  element: HTMLElement,
  overrides: Partial<DragManagerDragTarget> = {},
): DragManagerDragTarget => ({
  allowedDropOperations: ["move"],
  element,
  items: [{"text/plain": "dragged"}],
  ...overrides,
});

beforeEach(() => {
  setInteractionModality("keyboard");
});

afterEach(() => {
  getDragSession()?.cancel();
  while (cleanups.length) cleanups.pop()?.();
  document.body.innerHTML = "";
});

describe("drag manager", () => {
  describe("session lifecycle", () => {
    it("reports no drag before one starts", () => {
      expect(isVirtualDragging()).toBe(false);
      expect(getDragSession()).toBeNull();
    });

    it("starts a session and reports it in flight", async () => {
      const source = addElement("source");

      beginDragging(dragTargetFor(source));
      await flushFrame();

      expect(isVirtualDragging()).toBe(true);
      expect(getDragSession()).not.toBeNull();
    });

    // Two overlapping sessions would both own the document listeners, and the second teardown
    // would strip the first's — leaving the page swallowing pointer events forever.
    it("refuses to start a second session while one is in flight", async () => {
      const source = addElement("source");

      beginDragging(dragTargetFor(source));
      await flushFrame();

      expect(() => beginDragging(dragTargetFor(source))).toThrow(/already dragging/i);
    });

    it("ends the session on cancel", async () => {
      const source = addElement("source");

      beginDragging(dragTargetFor(source));
      await flushFrame();
      getDragSession()?.cancel();

      expect(isVirtualDragging()).toBe(false);
    });
  });

  describe("valid drop targets", () => {
    it("reports an element inside a registered target as valid", () => {
      const {element} = addDropTarget("target");
      const child = document.createElement("span");

      element.appendChild(child);

      expect(isValidDropTarget(child)).toBe(true);
      expect(isValidDropTarget(addElement("outside"))).toBe(false);
    });

    // A target that refuses the drag is not somewhere Tab should ever stop.
    it("skips a target whose getDropOperation cancels", async () => {
      const source = addElement("source");

      addDropTarget("accepts");
      addDropTarget("refuses", {getDropOperation: () => "cancel"});

      beginDragging(dragTargetFor(source));
      await flushFrame();

      const ids = getDragSession()?.validDropTargets.map((target) => target.element.id);

      expect(ids).toEqual(["accepts"]);
    });

    it("hands the drag's types to getDropOperation", async () => {
      const source = addElement("source");
      const getDropOperation = vi.fn(() => "move" as const);

      addDropTarget("target", {getDropOperation});
      beginDragging(dragTargetFor(source, {items: [{"text/html": "<b>a</b>", "text/plain": "a"}]}));
      await flushFrame();

      const [types, allowed] = getDropOperation.mock.calls[0] as unknown as [Set<string>, string[]];

      expect([...types].sort()).toEqual(["text/html", "text/plain"]);
      expect(allowed).toEqual(["move"]);
    });
  });

  describe("keyboard navigation", () => {
    it("focuses the first drop target when a keyboard drag opens", async () => {
      const source = addElement("source");

      addDropTarget("first");
      addDropTarget("second");

      beginDragging(dragTargetFor(source));
      await flushFrame();

      expect(getDragSession()?.currentDropTarget?.element.id).toBe("first");
    });

    it("moves to the next target on Tab and back on Shift+Tab", async () => {
      const source = addElement("source");

      addDropTarget("first");
      addDropTarget("second");

      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Tab");
      expect(getDragSession()?.currentDropTarget?.element.id).toBe("second");

      press("Tab", {shiftKey: true});
      expect(getDragSession()?.currentDropTarget?.element.id).toBe("first");
    });

    // Past the last target focus returns to the element the drag came from, so a user with no
    // Escape key still has somewhere to land and cancel from.
    it("wraps past the last target back to the drag source", async () => {
      const source = addElement("source");

      addDropTarget("only");
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Tab");

      expect(getDragSession()?.currentDropTarget).toBeNull();
      expect(document.activeElement).toBe(source);
    });

    it("leaves Tab alone when a modifier is held", async () => {
      const source = addElement("source");

      addDropTarget("first");
      addDropTarget("second");
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Tab", {ctrlKey: true});

      expect(getDragSession()?.currentDropTarget?.element.id).toBe("first");
    });

    it("forwards other keys to the current drop target", async () => {
      const source = addElement("source");
      const onKeyDown = vi.fn();

      addDropTarget("target", {onKeyDown});
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("ArrowDown");

      expect(onKeyDown).toHaveBeenCalled();
      expect(onKeyDown.mock.calls[0]?.[0]).toMatchObject({key: "ArrowDown"});
    });
  });

  describe("dropping", () => {
    it("calls onDrop with the dragged items and ends the session", async () => {
      const source = addElement("source");
      const onDrop = vi.fn();

      addDropTarget("target", {onDrop});
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Enter");

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(isVirtualDragging()).toBe(false);
    });

    it("hands the drop the items as text drop items", async () => {
      const source = addElement("source");
      const onDrop = vi.fn();

      addDropTarget("target", {onDrop});
      beginDragging(dragTargetFor(source, {items: [{"text/plain": "payload"}]}));
      await flushFrame();
      press("Enter");

      const event = onDrop.mock.calls[0]?.[0] as {
        items: {kind: string; getText: (t: string) => Promise<string>}[];
      };
      const [item] = event.items;

      expect(item?.kind).toBe("text");
      await expect(item?.getText("text/plain")).resolves.toBe("payload");
    });

    it("resolves the drop operation through the target", async () => {
      const source = addElement("source");
      const onDragEnd = vi.fn();

      addDropTarget("target", {getDropOperation: () => "copy", onDrop: vi.fn()});
      beginDragging(dragTargetFor(source, {allowedDropOperations: ["move", "copy"], onDragEnd}));
      await flushFrame();
      press("Enter");

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "copy"});
    });

    // Alt+Enter opens the target instead of dropping — how a collapsed tree row is expanded
    // without ending the drag.
    it("activates rather than drops on Alt+Enter", async () => {
      const source = addElement("source");
      const onDrop = vi.fn();
      const onDropActivate = vi.fn();

      addDropTarget("target", {onDrop, onDropActivate});
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Enter", {altKey: true});

      expect(onDropActivate).toHaveBeenCalledTimes(1);
      expect(onDrop).not.toHaveBeenCalled();
      expect(isVirtualDragging()).toBe(true);
    });

    it("cancels rather than drops when no target is current", async () => {
      const source = addElement("source");
      const onDragEnd = vi.fn();

      beginDragging(dragTargetFor(source, {onDragEnd}));
      await flushFrame();

      press("Enter");

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "cancel"});
      expect(isVirtualDragging()).toBe(false);
    });
  });

  describe("cancelling", () => {
    it("ends the session and restores focus to the drag source on Escape", async () => {
      const source = addElement("source");

      addDropTarget("target");
      beginDragging(dragTargetFor(source));
      await flushFrame();

      press("Escape");

      expect(isVirtualDragging()).toBe(false);
      expect(document.activeElement).toBe(source);
    });

    it("reports the drop operation as cancel to onDragEnd", async () => {
      const source = addElement("source");
      const onDragEnd = vi.fn();

      addDropTarget("target");
      beginDragging(dragTargetFor(source, {onDragEnd}));
      await flushFrame();

      press("Escape");

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "cancel"});
    });
  });

  describe("event suppression", () => {
    // The session is modal: a stray hover must not move the drop target, and a click must not
    // activate whatever happens to be underneath.
    it("swallows pointer events reaching the page during a drag", async () => {
      const source = addElement("source");
      const bystander = addElement("bystander");
      const onPointerDown = vi.fn();

      bystander.addEventListener("pointerdown", onPointerDown);
      addDropTarget("target");
      beginDragging(dragTargetFor(source));
      await flushFrame();

      bystander.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true}));

      expect(onPointerDown).not.toHaveBeenCalled();
    });

    // `preventDefault` on pointerup would suppress the click that follows, and a virtual click
    // is how a screen reader drops.
    it("does not prevent default on the events a click is built from", async () => {
      const source = addElement("source");

      addDropTarget("target");
      beginDragging(dragTargetFor(source));
      await flushFrame();

      const pointerup = new PointerEvent("pointerup", {bubbles: true, cancelable: true});

      document.body.dispatchEvent(pointerup);

      expect(pointerup.defaultPrevented).toBe(false);
    });

    it("stops swallowing once the drag ends", async () => {
      const source = addElement("source");
      const bystander = addElement("bystander");
      const onPointerDown = vi.fn();

      bystander.addEventListener("pointerdown", onPointerDown);
      addDropTarget("target");
      beginDragging(dragTargetFor(source));
      await flushFrame();
      press("Escape");

      bystander.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true}));

      expect(onPointerDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("drop items", () => {
    /** A collection holding one registered item, both wired into the manager. */
    const addCollectionWithItem = (itemOperation: "copy" | "move") => {
      const {element: collection} = addDropTarget("collection", {
        getDropOperation: () => "move",
        onDrop: vi.fn(),
      });
      const element = document.createElement("div");

      element.tabIndex = 0;
      collection.appendChild(element);
      cleanups.push(
        registerDropItem({
          element,
          getDropOperation: () => itemOperation,
          target: {dropPosition: "on", key: "a", type: "item"},
        }),
      );

      return {collection, element};
    };

    /**
     * A screen reader's click carries no pointer data — `detail: 0` and no `pointerType` — which
     * is the only thing separating it from a real one, and a plain `MouseEvent` has both.
     */
    const virtualClick = (element: HTMLElement) => {
      element.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
    };

    it("prefers an item's drop operation over its collection's on a virtual click", async () => {
      const source = addElement("source");
      const {element} = addCollectionWithItem("copy");
      const onDragEnd = vi.fn();

      beginDragging(dragTargetFor(source, {allowedDropOperations: ["move", "copy"], onDragEnd}));
      await flushFrame();

      virtualClick(element);

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "copy"});
    });

    /**
     * The keyboard path deliberately does not consult the item.
     *
     * `onKeyUp` calls `drop()` with no argument, so only the collection's `getDropOperation`
     * runs — an item's own operation reaches `drop()` only from the virtual-click path above.
     * Pinned because it reads like an oversight and is not one.
     */
    it("uses the collection's drop operation on the keyboard path", async () => {
      const source = addElement("source");

      addCollectionWithItem("copy");

      const onDragEnd = vi.fn();

      beginDragging(dragTargetFor(source, {allowedDropOperations: ["move", "copy"], onDragEnd}));
      await flushFrame();

      press("Enter");

      expect(onDragEnd.mock.calls[0]?.[0]).toMatchObject({dropOperation: "move"});
    });
  });
});
