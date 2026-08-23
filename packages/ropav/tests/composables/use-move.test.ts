import type { MoveEndEvent, MoveMoveEvent, MoveStartEvent } from "@/composables/use-move";

import { describe, expect, it } from "vitest";
import { effectScope } from "vue";

import { useMove } from "@/composables/use-move";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

const setup = () => {
  const element = document.createElement("div");

  document.body.appendChild(element);

  const events: (MoveStartEvent | MoveMoveEvent | MoveEndEvent)[] = [];

  const [move, dispose] = withScope(() =>
    useMove({
      onMove: (event) => events.push(event),
      onMoveEnd: (event) => events.push(event),
      onMoveStart: (event) => events.push(event),
    }),
  );

  // Bound the way a template binds them, so the element is the event target.
  element.addEventListener("pointerdown", (event) => move.handlers.onPointerdown(event));
  element.addEventListener("keydown", (event) => move.handlers.onKeydown(event));

  return {
    dispose: () => {
      dispose();
      element.remove();
    },
    element,
    events,
    types: () => events.map((event) => event.type),
  };
};

const pointerdown = (element: HTMLElement, x: number, y: number, pointerId = 1) =>
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y,
      pointerId,
    }),
  );

const pointermove = (x: number, y: number, pointerId = 1) =>
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, pointerId }));

const pointerup = (pointerId = 1) =>
  window.dispatchEvent(new PointerEvent("pointerup", { pointerId }));

describe("useMove", () => {
  describe("pointer", () => {
    it("reports movement as deltas from the last position", () => {
      const { dispose, element, events, types } = setup();

      pointerdown(element, 10, 10);
      // The press alone is not a move.
      expect(types()).toEqual([]);

      pointermove(15, 12);
      pointermove(20, 12);
      pointerup();

      expect(types()).toEqual(["movestart", "move", "move", "moveend"]);
      expect((events[1] as MoveMoveEvent).deltaX).toBe(5);
      expect((events[1] as MoveMoveEvent).deltaY).toBe(2);
      // Each delta is measured against the previous event, not against the press.
      expect((events[2] as MoveMoveEvent).deltaX).toBe(5);
      expect((events[2] as MoveMoveEvent).deltaY).toBe(0);

      dispose();
    });

    it("ignores a move that goes nowhere", () => {
      const { dispose, element, types } = setup();

      pointerdown(element, 10, 10);
      pointermove(10, 10);
      pointerup();

      expect(types()).toEqual([]);

      dispose();
    });

    it("keeps following the pointer once it leaves the element", () => {
      const { dispose, element, types } = setup();

      pointerdown(element, 10, 10);
      pointermove(400, 400);
      pointerup();

      // The listeners live on the window, so a drag that runs off the element still lands.
      expect(types()).toEqual(["movestart", "move", "moveend"]);

      dispose();
    });

    it("ignores a second pointer while one is already dragging", () => {
      const { dispose, element, events, types } = setup();

      pointerdown(element, 10, 10, 1);
      pointerdown(element, 50, 50, 2);
      pointermove(20, 10, 2);
      pointermove(20, 10, 1);
      pointerup(1);

      expect(types()).toEqual(["movestart", "move", "moveend"]);
      expect((events[1] as MoveMoveEvent).deltaX).toBe(10);

      dispose();
    });

    it("ends the interaction when the pointer is cancelled", () => {
      const { dispose, element, types } = setup();

      pointerdown(element, 10, 10);
      pointermove(20, 10);
      window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1 }));

      expect(types()).toEqual(["movestart", "move", "moveend"]);

      dispose();
    });

    it("only drags with the primary button", () => {
      const { dispose, element, types } = setup();

      element.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 2, pointerId: 3 }),
      );
      pointermove(50, 50, 3);

      expect(types()).toEqual([]);

      dispose();
    });

    it("stops listening once the scope is gone", () => {
      const { dispose, element, types } = setup();

      pointerdown(element, 10, 10);
      dispose();
      pointermove(50, 50);

      expect(types()).toEqual([]);
    });
  });

  describe("keyboard", () => {
    it("reports one arrow press as a single unit move", () => {
      const { dispose, element, events, types } = setup();

      element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

      // Start and end come with it, so a consumer can treat a key press like a whole drag.
      expect(types()).toEqual(["movestart", "move", "moveend"]);
      expect((events[1] as MoveMoveEvent).pointerType).toBe("keyboard");
      expect((events[1] as MoveMoveEvent).deltaX).toBe(1);
      expect((events[1] as MoveMoveEvent).deltaY).toBe(0);

      dispose();
    });

    it("points every arrow the right way", () => {
      const deltas: Record<string, [number, number]> = {
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
      };

      for (const [key, [deltaX, deltaY]] of Object.entries(deltas)) {
        const { dispose, element, events } = setup();

        element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));

        expect([(events[1] as MoveMoveEvent).deltaX, (events[1] as MoveMoveEvent).deltaY]).toEqual([
          deltaX,
          deltaY,
        ]);

        dispose();
      }
    });

    it("consumes the key so a native control does not act on it too", () => {
      const { dispose, element } = setup();
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowUp",
      });

      element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);

      dispose();
    });

    it("carries the modifier state through", () => {
      const { dispose, element, events } = setup();

      element.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight", shiftKey: true }),
      );

      expect((events[1] as MoveMoveEvent).shiftKey).toBe(true);

      dispose();
    });

    it("leaves other keys alone", () => {
      const { dispose, element, types } = setup();

      element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

      expect(types()).toEqual([]);

      dispose();
    });
  });
});
