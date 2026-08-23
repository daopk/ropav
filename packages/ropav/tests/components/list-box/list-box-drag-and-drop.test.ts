import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {getDragSession} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";

import Fixture from "./drag-and-drop-fixtures.vue";

/**
 * A reorderable ListBox, end to end.
 *
 * The composables are covered on their own; what this pins is the wiring — that supplying
 * `getItems` and `onReorder` is enough to make every part of the list agree it is draggable, and
 * that a keyboard drag actually moves an item.
 */

const unmounts: (() => void)[] = [];

const renderList = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  unmounts.push(result.unmount);
  await nextTick();

  const list = result.container.querySelector<HTMLElement>('[data-slot="list-box"]')!;
  const options = () => [...list.querySelectorAll<HTMLElement>('[data-slot="list-box-item"]')];
  const indicators = () => [
    ...list.querySelectorAll<HTMLElement>('[data-slot="list-box-drop-indicator"]'),
  ];

  return {...result, indicators, list, options};
};

/**
 * Dispatch from whatever holds focus.
 *
 * The item's capture-phase listeners are bound to the item, so an event dispatched on `document`
 * would never reach them — and once a drag is running, the session's own listeners are on the
 * document and see it either way.
 */
const press = (key: string, init: KeyboardEventInit = {}) => {
  const target = document.activeElement ?? document;

  target.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
  target.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key, ...init}));
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

describe("ListBox drag and drop", () => {
  describe("advertising that it drags", () => {
    /**
     * On the options, and deliberately not on the listbox.
     *
     * React Aria marks the item here and the collection in a `Table` — the two are not
     * symmetric, and measuring 6006 against 6007 is what caught this build marking both.
     */
    it("marks every option as draggable", async () => {
      const {list, options} = await renderList();

      expect(list).not.toHaveAttribute("data-allows-dragging");
      for (const option of options()) {
        expect(option).toHaveAttribute("data-allows-dragging", "true");
        expect(option).toHaveAttribute("draggable", "true");
      }
    });

    // An option already acts on Enter, so the drag has to be reachable some other way — the
    // description is what tells the user which.
    it("tells the user to hold Alt, because Enter already selects", async () => {
      const {options} = await renderList();
      const describedBy = options()[0]!.getAttribute("aria-describedby");
      const description = document.getElementById(describedBy!);

      expect(description?.textContent).toContain("Alt");
    });

    // Every option is reachable by keyboard while a drag runs, so the indicator rows must not
    // also be in the tab order.
    it("keeps drop indicators out of the tab order", async () => {
      const {indicators, options} = await renderList();

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();
      await nextTick();

      for (const indicator of indicators()) {
        expect(indicator).toHaveAttribute("tabindex", "-1");
      }
    });
  });

  describe("drop indicators", () => {
    /**
     * Rendered only during a drag.
     *
     * Outside one there is nothing to indicate, and a permanently present row would be an extra
     * option for a screen reader to step through.
     */
    it("renders none while nothing is being dragged", async () => {
      const {indicators} = await renderList();

      expect(indicators()).toHaveLength(0);
    });

    it("appears once a keyboard drag begins", async () => {
      const {indicators, options} = await renderList();

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();
      await nextTick();

      expect(indicators().length).toBeGreaterThan(0);
    });

    it("names each gap by the items around it", async () => {
      const {indicators, options} = await renderList();

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();
      await nextTick();

      const labels = indicators().map((node) => node.getAttribute("aria-label"));

      expect(labels).toContain("Insert between Ada and Grace");
    });
  });

  describe("reordering with the keyboard", () => {
    it("starts a drag on Alt+Enter", async () => {
      const {options} = await renderList();

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();

      expect(getDragSession()).not.toBeNull();
    });

    // Plain Enter belongs to the option's own action, and must not also start a drag.
    it("does not start a drag on Enter alone", async () => {
      const {options} = await renderList();

      options()[0]!.focus();
      press("Enter");
      await flushFrame();

      expect(getDragSession()).toBeNull();
    });

    it("moves the item and reports the move", async () => {
      const onReorder = vi.fn();
      const {options} = await renderList({onReorder});

      expect(options().map((node) => node.textContent?.trim())).toEqual(["Ada", "Grace", "Alan"]);

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();

      // Walk past the gaps to the end of the list.
      press("ArrowDown");
      press("ArrowDown");
      press("Enter");
      // The drop handler is async and the list re-renders after it resolves.
      await nextTick();
      await nextTick();
      await nextTick();

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onReorder.mock.calls[0]?.[0]).toMatchObject({
        target: {dropPosition: "after", key: "Alan", type: "item"},
      });
      expect(options().map((node) => node.textContent?.trim())).toEqual(["Grace", "Alan", "Ada"]);
    });

    it("leaves the list alone when the drag is cancelled", async () => {
      const onReorder = vi.fn();
      const {options} = await renderList({onReorder});

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();
      press("ArrowDown");
      press("Escape");
      await nextTick();

      expect(onReorder).not.toHaveBeenCalled();
      expect(options().map((node) => node.textContent?.trim())).toEqual(["Ada", "Grace", "Alan"]);
    });
  });

  describe("the dragged option", () => {
    it("reports itself as dragging while the drag is in flight", async () => {
      const {options} = await renderList();

      options()[0]!.focus();
      press("Enter", {altKey: true});
      await flushFrame();
      await nextTick();

      expect(options()[0]).toHaveAttribute("data-dragging", "true");
    });
  });
});
