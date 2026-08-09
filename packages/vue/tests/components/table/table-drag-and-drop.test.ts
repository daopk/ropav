import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {getDragSession} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";

import Fixture from "./drag-and-drop-fixtures.vue";

/**
 * A reorderable Table, end to end.
 *
 * The composables are covered on their own; what this pins is the wiring — that supplying
 * `getItems` and `onReorder` is enough to make every part of the table agree it is draggable,
 * and that the drag handle rather than the row is what a keyboard reaches for.
 */

const unmounts: (() => void)[] = [];

const renderTable = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  unmounts.push(result.unmount);
  await nextTick();

  const table = result.container.querySelector<HTMLElement>('[data-slot="table-content"]')!;
  const rows = () => [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')];
  const indicators = () => [
    ...table.querySelectorAll<HTMLElement>('[data-slot="table-drop-indicator"]'),
  ];
  const handles = () => [...table.querySelectorAll<HTMLButtonElement>("button")];
  const names = () => rows().map((row) => row.querySelectorAll("td")[1]?.textContent?.trim());

  return {...result, handles, indicators, names, rows, table};
};

/**
 * Dispatch from whatever holds focus.
 *
 * The drag button's capture-phase listeners are bound to it, so an event dispatched on
 * `document` would never reach them — and once a drag is running, the session's own listeners
 * are on the document and see it either way.
 */
const press = (key: string, init: KeyboardEventInit = {}) => {
  const target = document.activeElement ?? document;

  target.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
  target.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key, ...init}));
};

/** Enter on a button produces a click of its own, which is what the handle actually listens to. */
const activateHandle = (handle: HTMLElement) => {
  handle.focus();
  handle.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
  handle.dispatchEvent(new MouseEvent("click", {bubbles: true, detail: 0}));
};

const flushFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

beforeEach(() => {
  setInteractionModality("keyboard");
});

/**
 * Unmounted rather than wiped.
 *
 * `useDescription` keeps one shared node per distinct text, released by reference count — so
 * clearing `document.body` would strip the node while the count still says it is there, and the
 * next test would reuse a cached id pointing at nothing.
 */
afterEach(() => {
  getDragSession()?.cancel();
  while (unmounts.length) unmounts.pop()?.();
});

describe("Table drag and drop", () => {
  describe("advertising that it drags", () => {
    it("marks the table and every row as draggable", async () => {
      const {rows, table} = await renderTable();

      expect(table).toHaveAttribute("data-allows-dragging", "true");
      for (const row of rows()) {
        expect(row).toHaveAttribute("data-allows-dragging", "true");
        expect(row).toHaveAttribute("draggable", "true");
      }
    });

    // The header renders the extra leading column from this, so a caller never repeats the
    // condition it already gave `useDragAndDrop`.
    it("tells the header that the rows can be dragged", async () => {
      const {table} = await renderTable();
      const columns = [...table.querySelectorAll('[data-slot="table-column"]')];

      expect(columns).toHaveLength(3);
    });
  });

  describe("the drag handle", () => {
    /**
     * The row is what the browser drags, so a handle that took the press would swallow it.
     * Keyboard activation and a screen reader's click both bypass hit testing and still land.
     */
    it("does not take the pointer, so a mouse drag reaches the row", async () => {
      const {handles} = await renderTable();

      expect(handles()[0]!.style.pointerEvents).toBe("none");
    });

    it("names itself after the row it drags", async () => {
      const {handles} = await renderTable();

      expect(handles()[0]!.getAttribute("aria-label")).toContain("Ada");
    });

    // Regression: the description lives on whichever control starts the drag, and with a drag
    // button that is the handle rather than the row.
    it("carries the instructions for starting a drag", async () => {
      const {handles} = await renderTable();
      const describedBy = handles()[0]!.getAttribute("aria-describedby");

      expect(document.getElementById(describedBy!)?.textContent).toContain("Enter");
    });

    // Plain Enter on a row belongs to the grid, and must not also start a drag.
    it("is the only way in — Enter on the row does nothing", async () => {
      const {rows} = await renderTable();

      rows()[0]!.focus();
      press("Enter");
      await flushFrame();

      expect(getDragSession()).toBeNull();
    });

    it("starts a drag when activated", async () => {
      const {handles} = await renderTable();

      activateHandle(handles()[0]!);
      await flushFrame();

      expect(getDragSession()).not.toBeNull();
    });
  });

  describe("drop indicators", () => {
    /**
     * Rendered only during a drag.
     *
     * Outside one there is nothing to indicate, and a permanently present row would be an extra
     * row for a screen reader to step through and would disturb the row count.
     */
    it("renders none while nothing is being dragged", async () => {
      const {indicators} = await renderTable();

      expect(indicators()).toHaveLength(0);
    });

    it("spans every column, so the gap is not confined to one cell", async () => {
      const {handles, indicators} = await renderTable();

      activateHandle(handles()[0]!);
      await flushFrame();
      await nextTick();

      expect(indicators()[0]!.querySelector("td")).toHaveAttribute("colspan", "3");
    });

    it("names each gap by the rows around it", async () => {
      const {handles, indicators} = await renderTable();

      activateHandle(handles()[0]!);
      await flushFrame();
      await nextTick();

      const labels = indicators().map((row) =>
        row.querySelector('[role="button"]')!.getAttribute("aria-label"),
      );

      expect(labels).toContain("Insert between Ada and Grace");
    });
  });

  describe("reordering with the keyboard", () => {
    it("moves the row and reports the move", async () => {
      const onReorder = vi.fn();
      const {handles, names} = await renderTable({onReorder});

      expect(names()).toEqual(["Ada", "Grace", "Alan"]);

      activateHandle(handles()[0]!);
      await flushFrame();

      // Walk past the gaps to the end of the table.
      press("ArrowDown");
      press("ArrowDown");
      press("Enter");
      // The drop handler is async and the table re-renders after it resolves.
      await nextTick();
      await nextTick();
      await nextTick();

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onReorder.mock.calls[0]?.[0]).toMatchObject({
        target: {dropPosition: "after", key: "Alan", type: "item"},
      });
      expect(names()).toEqual(["Grace", "Alan", "Ada"]);
    });

    // The session's own listeners are on the document in the capture phase, so the grid's
    // two-dimensional navigation never sees the arrows that are moving the drop target.
    it("keeps the grid's own navigation out of the way", async () => {
      const {handles, rows} = await renderTable();

      activateHandle(handles()[0]!);
      await flushFrame();
      press("ArrowDown");
      await nextTick();

      expect(rows().map((row) => row.getAttribute("data-focused"))).not.toContain("true");
    });

    it("leaves the table alone when the drag is cancelled", async () => {
      const onReorder = vi.fn();
      const {handles, names} = await renderTable({onReorder});

      activateHandle(handles()[0]!);
      await flushFrame();
      press("ArrowDown");
      press("Escape");
      await nextTick();

      expect(onReorder).not.toHaveBeenCalled();
      expect(names()).toEqual(["Ada", "Grace", "Alan"]);
    });
  });

  describe("the dragged row", () => {
    it("reports itself as dragging while the drag is in flight", async () => {
      const {handles, rows} = await renderTable();

      activateHandle(handles()[0]!);
      await flushFrame();
      await nextTick();

      expect(rows()[0]).toHaveAttribute("data-dragging", "true");
    });
  });
});
