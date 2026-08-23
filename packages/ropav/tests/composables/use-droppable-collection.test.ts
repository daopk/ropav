import type {
  DroppableCollectionHarnessOptions,
  DroppableCollectionHarnessReady,
} from "../fixtures/dnd-harness.types";
import type {DndStringFormatter} from "@/composables/drag-manager";
import type {DropTarget} from "@/utils/dnd-types";

import {LocalizedStringDictionary, LocalizedStringFormatter} from "@internationalized/string";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {computed, nextTick} from "vue";

import {beginDragging, getDragSession} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";
import {dndStrings} from "@/i18n/dnd";

import Harness from "../fixtures/droppable-collection-harness.vue";

import {
  createFixtureCollection,
  createFixtureKeyboardDelegate,
  createFixtureSelection,
} from "./dnd-collection-state-fixtures";

/**
 * The collection-level drop hooks.
 *
 * Driven through a mounted harness because every one of them resolves a locale, and because the
 * drop indicator reads the collection's id from a registry `useDroppableCollection` writes to —
 * neither works in isolation.
 */

const stringFormatter = computed(
  () => new LocalizedStringFormatter("en-US", new LocalizedStringDictionary(dndStrings)),
) as DndStringFormatter;

const collection = createFixtureCollection([{key: "a"}, {key: "b"}, {key: "c"}]);
const unmounts: (() => void)[] = [];

const item = (key: string, dropPosition: "after" | "before" | "on"): DropTarget => ({
  dropPosition,
  key,
  type: "item",
});

const setup = (
  overrides: Partial<DroppableCollectionHarnessOptions> = {},
): DroppableCollectionHarnessReady => {
  let ready!: DroppableCollectionHarnessReady;
  const options: DroppableCollectionHarnessOptions = {
    collection,
    dropTargetDelegate: {getDropTargetFromPoint: () => item("b", "before")},
    indicatorTarget: item("b", "before"),
    keyboardDelegate: createFixtureKeyboardDelegate(collection),
    selectionManager: createFixtureSelection(),
    ...overrides,
  };
  const rendered = renderVapor(Harness, {
    props: {onReady: (value: DroppableCollectionHarnessReady) => (ready = value), options},
  });

  unmounts.push(rendered.unmount);

  return ready;
};

/** Start a keyboard drag from outside the collection and let the session's setup frame run. */
const startDrag = async () => {
  const source = document.createElement("div");

  source.tabIndex = 0;
  document.body.appendChild(source);

  beginDragging(
    {
      allowedDropOperations: ["move"],
      element: source,
      items: [{"text/plain": "dragged"}],
    },
    stringFormatter,
  );
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  return source;
};

const press = (key: string) => {
  document.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key}));
  document.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key}));
};

beforeEach(() => {
  setInteractionModality("keyboard");
});

afterEach(() => {
  getDragSession()?.cancel();
  while (unmounts.length) unmounts.pop()?.();
  document.body.innerHTML = "";
});

describe("useDroppableCollection", () => {
  describe("the collection element", () => {
    it("carries an id the drop indicator can point at", async () => {
      const {collection: hook} = setup();

      await nextTick();

      expect(hook.attrs.value.id).toBeTruthy();
    });

    /**
     * The collection itself carries no description.
     *
     * Dropping on the collection as a whole is announced by its root drop indicator; describing
     * the collection too would say the same thing twice.
     */
    it("carries no description of its own", async () => {
      const {collection: hook} = setup();

      await nextTick();

      expect(hook.attrs.value["aria-describedby"]).toBeUndefined();
    });
  });

  describe("joining a keyboard drag", () => {
    it("registers itself as a target the session can reach", async () => {
      const {element} = setup({state: {onInsert: vi.fn()}});

      await nextTick();
      await startDrag();

      expect(getDragSession()?.validDropTargets.map((target) => target.element)).toContain(element);
    });

    // With no handler that could accept a foreign drag, there is nothing to offer.
    it("stays out of the session when it would refuse the drag", async () => {
      const {element} = setup();

      await nextTick();
      await startDrag();

      expect(getDragSession()?.validDropTargets.map((target) => target.element)).not.toContain(
        element,
      );
    });

    it("takes a target when the drag enters", async () => {
      const {state} = setup({state: {onInsert: vi.fn()}});

      await nextTick();
      await startDrag();

      expect(state.target.value).not.toBeNull();
    });
  });

  describe("moving the target with the keyboard", () => {
    const enterDrag = async () => {
      const harness = setup({state: {onInsert: vi.fn()}});

      await nextTick();
      await startDrag();

      return harness;
    };

    it("moves down through the positions", async () => {
      const {state} = await enterDrag();
      const first = state.target.value;

      press("ArrowDown");

      expect(state.target.value).not.toEqual(first);
    });

    it("goes to the first position on Home", async () => {
      const {state} = await enterDrag();

      press("ArrowDown");
      press("Home");

      expect(state.target.value).toEqual(item("a", "before"));
    });

    it("goes to the last position on End", async () => {
      const {state} = await enterDrag();

      press("End");

      expect(state.target.value).toEqual(item("c", "after"));
    });

    it("forwards the key to the caller", async () => {
      const onKeyDown = vi.fn();

      setup({state: {onInsert: vi.fn(), onKeyDown}});
      await nextTick();
      await startDrag();

      press("ArrowDown");

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe("routing a drop", () => {
    const dropOn = async (target: DropTarget, state: Record<string, unknown>) => {
      const harness = setup({indicatorTarget: target, state});

      await nextTick();
      await startDrag();
      harness.state.setTarget(target);
      press("Enter");
      await nextTick();

      return harness;
    };

    // The same gesture means different things by target, and the routing is what tells them apart.
    it("calls onInsert for a gap when the drag came from outside", async () => {
      const onInsert = vi.fn();

      await dropOn(item("b", "before"), {onInsert});

      expect(onInsert).toHaveBeenCalledTimes(1);
      expect(onInsert.mock.calls[0]?.[0]).toMatchObject({target: item("b", "before")});
    });

    it("calls onItemDrop for a drop onto an item", async () => {
      const onItemDrop = vi.fn();

      await dropOn(item("b", "on"), {onItemDrop});

      expect(onItemDrop).toHaveBeenCalledTimes(1);
    });

    it("calls onRootDrop for a drop on the collection itself", async () => {
      const onRootDrop = vi.fn();

      await dropOn({type: "root"}, {onRootDrop});

      expect(onRootDrop).toHaveBeenCalledTimes(1);
    });

    // `onDrop` replaces the specific handlers rather than joining them.
    it("calls onDrop alone when one was supplied", async () => {
      const onDrop = vi.fn();
      const onInsert = vi.fn();

      await dropOn(item("b", "before"), {onDrop, onInsert});

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onInsert).not.toHaveBeenCalled();
    });

    it("refuses items whose type the collection does not accept", async () => {
      const onInsert = vi.fn();

      await dropOn(item("b", "before"), {acceptedDragTypes: ["image/png"], onInsert});

      expect(onInsert).not.toHaveBeenCalled();
    });
  });
});

describe("useDropIndicator", () => {
  const mountIndicator = async (target: DropTarget) => {
    const harness = setup({
      indicatorTarget: target,
      state: {onInsert: vi.fn(), onItemDrop: vi.fn()},
    });

    await nextTick();

    return harness;
  };

  describe("labelling", () => {
    // A gap has nothing of its own to read out, so it is named by what sits either side of it.
    it("names a gap by the items on both sides", async () => {
      const {indicator} = await mountIndicator(item("b", "before"));

      expect(indicator.attrs.value["aria-label"]).toBe("Insert between a and b");
    });

    it("names the first gap by the item after it alone", async () => {
      const {indicator} = await mountIndicator(item("a", "before"));

      expect(indicator.attrs.value["aria-label"]).toBe("Insert before a");
    });

    it("names the last gap by the item before it alone", async () => {
      const {indicator} = await mountIndicator(item("c", "after"));

      expect(indicator.attrs.value["aria-label"]).toBe("Insert after c");
    });

    it("names a drop onto an item by that item", async () => {
      const {indicator} = await mountIndicator(item("b", "on"));

      expect(indicator.attrs.value["aria-label"]).toBe("Drop on b");
    });

    it("labels the root indicator by the collection it stands for", async () => {
      const {collection: hook, indicator} = await mountIndicator({type: "root"});

      expect(indicator.attrs.value["aria-label"]).toBe("Drop on");
      expect(indicator.attrs.value["aria-labelledby"]).toContain(hook.attrs.value.id);
    });

    it("describes itself as a drop indicator", async () => {
      const {indicator} = await mountIndicator(item("b", "before"));

      expect(indicator.attrs.value["aria-roledescription"]).toBe("drop indicator");
    });
  });

  describe("visibility", () => {
    /**
     * Outside a drag there is nothing to indicate.
     *
     * `isHidden` is what tells a component to skip rendering entirely — distinct from merely not
     * being the current target, because an inactive indicator still has to exist during a
     * keyboard drag so Tab can reach it.
     */
    it("is hidden when no drag is in flight", async () => {
      const {indicator} = await mountIndicator(item("b", "before"));

      expect(indicator.isHidden.value).toBe(true);
      expect(indicator.attrs.value["aria-hidden"]).toBe("true");
    });

    it("stops being hidden once a drag it accepts begins", async () => {
      const {indicator} = await mountIndicator(item("b", "before"));

      await startDrag();

      expect(indicator.isHidden.value).toBe(false);
    });

    it("is never focusable in the tab order", async () => {
      const {indicator} = await mountIndicator(item("b", "before"));

      expect(indicator.attrs.value["tabindex"]).toBe(-1);
    });
  });
});
