import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {getDragSession} from "@/composables/drag-manager";
import {setInteractionModality} from "@/composables/use-interaction-states";

/**
 * Dragging inside a tree grid.
 *
 * What is different from a flat table is entirely about nesting: a closed row's children are not
 * in the collection at all, so a drag has to be able to open one, and the gap at the end of a
 * subtree names more than one place.
 */

import Fixture from "./tree-drag-and-drop-fixtures.vue";

const unmounts: (() => void)[] = [];

const renderTree = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  unmounts.push(result.unmount);
  await nextTick();

  const table = result.container.querySelector<HTMLElement>('[data-slot="table-content"]')!;
  const rows = () => [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')];
  const handles = () => [...table.querySelectorAll<HTMLButtonElement>("button")];
  const titles = () =>
    rows().map((row) => row.querySelectorAll("td")[1]!.textContent!.replace("chevron", "").trim());

  return {...result, handles, rows, table, titles};
};

const press = (key: string, init: KeyboardEventInit = {}) => {
  const target = document.activeElement ?? document;

  target.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key, ...init}));
  target.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key, ...init}));
};

/** The first button of a row is its drag handle; the second, if any, is the chevron. */
const activateHandle = (handle: HTMLElement) => {
  handle.focus();
  handle.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
  handle.dispatchEvent(new MouseEvent("click", {bubbles: true, detail: 0}));
};

const flushFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

beforeEach(() => {
  setInteractionModality("keyboard");
});

afterEach(() => {
  getDragSession()?.cancel();
  while (unmounts.length) unmounts.pop()?.();
});

describe("Table tree grid drag and drop", () => {
  it("drags from a nested row as readily as from a top-level one", async () => {
    const {handles, titles} = await renderTree({defaultExpandedKeys: ["documents"]});

    expect(titles()).toEqual(["Documents", "Report", "Budget", "Photos"]);

    // Handles are the first button of each row, so the second belongs to `Report`.
    activateHandle(handles().filter((button) => button.textContent === "grip")[1]!);
    await flushFrame();

    expect(getDragSession()).not.toBeNull();
  });

  /**
   * A closed row's children are absent from the collection, so without this there is no way to
   * drop inside one during a keyboard drag.
   */
  it("opens a closed row when the drop target rests on it", async () => {
    const {handles, titles} = await renderTree();

    expect(titles()).toEqual(["Documents", "Photos"]);

    // Drag `Photos`, then walk the target up onto the closed `Documents` row.
    activateHandle(handles().filter((button) => button.textContent === "grip")[1]!);
    await flushFrame();
    press("ArrowUp");
    await nextTick();
    press("ArrowRight");
    await nextTick();

    expect(titles()).toEqual(["Documents", "Report", "Budget", "Photos"]);
  });

  /**
   * `table.css` has carried `.table__row[data-drop-target="true"] .table__cell` since before
   * there was any drag and drop to light it — this is what finally does.
   */
  it("marks the row a drop would land on", async () => {
    const {handles, rows} = await renderTree({defaultExpandedKeys: ["documents"]});

    activateHandle(handles().filter((button) => button.textContent === "grip")[3]!);
    await flushFrame();
    press("ArrowUp");
    await nextTick();

    // Budget is the row above Photos, so it is the first one the target lands on.
    expect(rows()[2]).toHaveAttribute("data-drop-target", "true");
    expect(rows()[3]).toHaveAttribute("data-dragging", "true");
  });

  it("hands the drop to `onItemDrop` when it lands on a row", async () => {
    const onItemDrop = vi.fn();
    const {handles} = await renderTree({defaultExpandedKeys: ["documents"], onItemDrop});

    activateHandle(handles().filter((button) => button.textContent === "grip")[3]!);
    await flushFrame();
    press("ArrowUp");
    await nextTick();
    press("Enter");
    await nextTick();
    await nextTick();

    expect(onItemDrop).toHaveBeenCalledTimes(1);
    expect(onItemDrop.mock.calls[0]?.[0]).toMatchObject({target: {key: "budget"}});
  });

  it("closes it again on the opposite arrow", async () => {
    const {handles, titles} = await renderTree({defaultExpandedKeys: ["documents"]});

    // Three rows up from `Photos` is `Documents` itself: Budget, Report, then the folder.
    activateHandle(handles().filter((button) => button.textContent === "grip")[3]!);
    await flushFrame();
    press("ArrowUp");
    press("ArrowUp");
    press("ArrowUp");
    await nextTick();
    press("ArrowLeft");
    await nextTick();

    expect(titles()).toEqual(["Documents", "Photos"]);
  });
});
