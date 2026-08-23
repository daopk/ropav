import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./tree-fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  await nextTick();

  const table = result.container.querySelector<HTMLTableElement>('[data-slot="table-content"]')!;

  return {
    ...result,
    rows: () => [...table.querySelectorAll<HTMLElement>('[data-slot="table-row"]')],
    table,
  };
};

const press = (key: string, modifiers: Record<string, boolean> = {}) => {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, key, ...modifiers}),
  );
};

const titles = (rows: HTMLElement[]) =>
  rows.map((row) => row.querySelector("td")!.textContent!.replace("chevron", "").trim());

describe("Table tree grid", () => {
  describe("structure", () => {
    // The role is what tells assistive technology the rows nest at all.
    it("reports itself as a tree grid", async () => {
      const {table} = await render();

      expect(table).toHaveAttribute("role", "treegrid");
    });

    it("stays a plain grid without a tree column", async () => {
      const {table} = await render({withoutTreeColumn: true});

      expect(table).toHaveAttribute("role", "grid");
    });

    it("shows only the top level until something is expanded", async () => {
      const {rows} = await render();

      expect(titles(rows())).toEqual(["Documents", "Photos"]);
    });

    it("reports each row's depth", async () => {
      const {rows} = await render({defaultExpandedKeys: ["1"]});

      expect(rows().map((row) => row.getAttribute("aria-level"))).toEqual(["1", "2", "1"]);
      expect(rows().map((row) => row.getAttribute("data-level"))).toEqual(["1", "2", "1"]);
    });

    // The stylesheet indents the tree column by this, so it has to follow the depth rather than
    // stay at the one a flat table renders.
    it("carries the depth as a custom property the stylesheet reads", async () => {
      const {rows} = await render({defaultExpandedKeys: ["1"]});

      expect(rows()[1]!.style.getPropertyValue("--table-row-level")).toBe("2");
    });

    it("reports expansion only on the rows that have children", async () => {
      const {rows} = await render({defaultExpandedKeys: ["1"]});

      expect(rows()[0]).toHaveAttribute("aria-expanded", "true");
      expect(rows()[0]).toHaveAttribute("data-expanded", "true");
      expect(rows()[0]).toHaveAttribute("data-has-child-items", "true");
      // "Project" has children but is closed.
      expect(rows()[1]).toHaveAttribute("aria-expanded", "false");
      expect(rows()[2]).toHaveAttribute("aria-expanded", "false");
    });

    it("leaves expansion off a leaf row entirely", async () => {
      // Photos opens after Documents, so its children follow it: Documents, Photos, Image 1, …
      const {rows} = await render({defaultExpandedKeys: ["5"]});

      expect(rows()[2]).not.toHaveAttribute("aria-expanded");
      expect(rows()[2]).not.toHaveAttribute("data-has-child-items");
    });

    it("counts each row among its own siblings", async () => {
      const {rows} = await render({defaultExpandedKeys: ["1", "2"]});
      const position = rows().map(
        (row) => `${row.getAttribute("aria-posinset")}/${row.getAttribute("aria-setsize")}`,
      );

      // Documents and Photos are the two top-level rows; Project is the only child of Documents;
      // the two files are siblings under Project.
      expect(position).toEqual(["1/2", "1/1", "1/2", "2/2", "2/2"]);
    });

    it("marks the cell under the tree column", async () => {
      const {rows} = await render();
      const cells = [...rows()[0]!.querySelectorAll("td")];

      expect(cells[0]).toHaveAttribute("data-tree-column", "true");
      expect(cells[1]).not.toHaveAttribute("data-tree-column");
    });

    it("repeats the row's depth and expansion on its cells", async () => {
      const {rows} = await render({defaultExpandedKeys: ["1"]});
      const cell = rows()[1]!.querySelector("td")!;

      expect(cell).toHaveAttribute("data-level", "2");
      expect(cell).not.toHaveAttribute("data-expanded");
    });
  });

  describe("the expand button", () => {
    it("only appears on a row with children, in the tree column", async () => {
      const {rows} = await render({defaultExpandedKeys: ["5"]});

      expect(rows()[0]!.querySelectorAll('[data-slot="button"]')).toHaveLength(1);
      // "Image 1" is a leaf.
      expect(rows()[2]!.querySelectorAll('[data-slot="button"]')).toHaveLength(0);
    });

    it("says what pressing it will do", async () => {
      const {rows} = await render();
      const button = rows()[0]!.querySelector('[data-slot="button"]')!;

      expect(button).toHaveAttribute("aria-label", "Expand");
      // Named by the row as well, so it is clear which row is opening.
      expect(button).toHaveAttribute("aria-labelledby", rows()[0]!.getAttribute("aria-labelledby"));
    });

    // The row already answers the arrow keys, so a tab stop for every chevron would only make
    // walking a tree slower.
    it("stays out of the tab order", async () => {
      const {rows} = await render();
      const button = rows()[0]!.querySelector('[data-slot="button"]')!;

      expect(button).toHaveAttribute("tabindex", "-1");
    });

    it("opens and closes the row", async () => {
      const {rows} = await render();
      const button = rows()[0]!.querySelector<HTMLElement>('[data-slot="button"]')!;

      button.click();
      await nextTick();

      expect(titles(rows())).toEqual(["Documents", "Project", "Photos"]);
      expect(rows()[0]!.querySelector('[data-slot="button"]')).toHaveAttribute(
        "aria-label",
        "Collapse",
      );

      rows()[0]!.querySelector<HTMLElement>('[data-slot="button"]')!.click();
      await nextTick();

      expect(titles(rows())).toEqual(["Documents", "Photos"]);
    });

    it("reports the change to the caller", async () => {
      const onExpandedChange = vi.fn();
      const {rows} = await render({onExpandedChange});

      rows()[0]!.querySelector<HTMLElement>('[data-slot="button"]')!.click();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["1"]));
    });

    it("takes a controlled set of expanded keys", async () => {
      const onExpandedChange = vi.fn();
      const {rows} = await render({expandedKeys: ["5"], onExpandedChange});

      expect(titles(rows())).toEqual(["Documents", "Photos", "Image 1", "Image 2"]);

      rows()[0]!.querySelector<HTMLElement>('[data-slot="button"]')!.click();
      await nextTick();

      // The caller was told, and nothing moved on its own.
      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["5", "1"]));
      expect(titles(rows())).toEqual(["Documents", "Photos", "Image 1", "Image 2"]);
    });
  });

  describe("keyboard", () => {
    const enter = async (props: Record<string, unknown> = {}) => {
      const result = await render(props);

      result.table.focus();
      await nextTick();

      return result;
    };

    it("opens the focused row on the forward arrow", async () => {
      const {rows} = await enter();

      press("ArrowRight");
      await nextTick();

      expect(titles(rows())).toEqual(["Documents", "Project", "Photos"]);
    });

    it("closes the focused row on the back arrow", async () => {
      const {rows} = await enter({defaultExpandedKeys: ["1"]});

      press("ArrowLeft");
      await nextTick();

      expect(titles(rows())).toEqual(["Documents", "Photos"]);
    });

    /**
     * Collapsing a row that is already closed walks up to its parent instead, which is what lets
     * someone leave a branch without arrowing back through every child.
     */
    it("moves focus to the parent when the row is already closed", async () => {
      const {rows} = await enter({defaultExpandedKeys: ["1"]});

      press("ArrowDown");
      await nextTick();
      expect(document.activeElement).toBe(rows()[1]);

      // "Project" is closed, so the back arrow leaves the branch.
      press("ArrowLeft");
      await nextTick();

      expect(document.activeElement).toBe(rows()[0]);
      expect(titles(rows())).toEqual(["Documents", "Project", "Photos"]);
    });

    it("leaves a leaf row's arrows to the cells", async () => {
      const {rows} = await enter({defaultExpandedKeys: ["5"]});

      press("ArrowDown");
      press("ArrowDown");
      await nextTick();

      expect(document.activeElement).toBe(rows()[2]);

      // "Image 1" is a leaf with no parent above it in view, so the arrow navigates as usual.
      press("ArrowRight");
      await nextTick();

      expect(document.activeElement).toBe(rows()[2]!.querySelector("td"));
    });

    it("keeps the arrows on the cells once focus is inside a row", async () => {
      const {rows} = await enter();

      press("ArrowRight");
      await nextTick();
      // The row opened rather than stepping into its cells.
      expect(titles(rows())).toEqual(["Documents", "Project", "Photos"]);

      press("ArrowRight");
      await nextTick();

      // Already open, so this one steps into the cells.
      expect(document.activeElement).toBe(rows()[0]!.querySelector("td"));
    });
  });
});
