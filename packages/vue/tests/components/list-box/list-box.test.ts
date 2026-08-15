import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  // Items register post-flush, so the collection is only complete after a tick — that is what
  // replaces React Aria's render-children-into-a-hidden-tree pass.
  await nextTick();

  const listbox = result.container.querySelector('[data-slot="list-box"]')!;

  return {
    ...result,
    items: () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')],
    listbox,
  };
};

const press = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init}),
  );
};

describe("ListBox", () => {
  describe("structure", () => {
    it("renders a listbox with its orientation and layout", async () => {
      const {listbox} = await render();

      expect(listbox).toHaveAttribute("role", "listbox");
      expect(listbox).toHaveAttribute("aria-orientation", "vertical");
      expect(listbox).toHaveAttribute("data-orientation", "vertical");
      expect(listbox).toHaveAttribute("data-layout", "stack");
      expect(listbox).toHaveClass("list-box");
    });

    it("renders an option per item", async () => {
      const {items} = await render();

      expect(items()).toHaveLength(3);
      expect(items()[0]).toHaveAttribute("data-slot", "list-box-item");
      expect(items()[0]).toHaveClass("list-box-item");
    });

    it("derives an option id from the listbox id and the key", async () => {
      const {items, listbox} = await render();

      expect(items()[0]).toHaveAttribute("id", `${listbox.getAttribute("id")}-option-1`);
      expect(items()[0]).toHaveAttribute("data-key", "1");
    });

    it("marks the collection on both the listbox and its items", async () => {
      const {items, listbox} = await render();

      expect(items()[0]!.getAttribute("data-collection")).toBe(
        listbox.getAttribute("data-collection"),
      );
    });

    it("reports an empty collection", async () => {
      const {listbox} = await render({items: []});

      expect(listbox).toHaveAttribute("data-empty", "true");
    });
  });

  describe("selection mode", () => {
    it("omits the selection attributes when nothing can be selected", async () => {
      const {items, listbox} = await render();

      expect(listbox).not.toHaveAttribute("aria-multiselectable");
      expect(items()[0]).not.toHaveAttribute("aria-selected");
      expect(items()[0]).not.toHaveAttribute("data-selection-mode");
    });

    it("reports single selection on each item", async () => {
      const {items, listbox} = await render({selectionMode: "single"});

      expect(listbox).not.toHaveAttribute("aria-multiselectable");
      expect(items()[0]).toHaveAttribute("aria-selected", "false");
      expect(items()[0]).toHaveAttribute("data-selection-mode", "single");
    });

    it("announces multiple selection on the listbox", async () => {
      const {listbox} = await render({selectionMode: "multiple"});

      expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    });
  });

  describe("selecting", () => {
    it("selects an item on click", async () => {
      const {items} = await render({selectionMode: "single"});

      items()[1]!.click();
      await nextTick();

      expect(items()[1]).toHaveAttribute("aria-selected", "true");
      expect(items()[1]).toHaveAttribute("data-selected", "true");
    });

    it("replaces the selection in single mode", async () => {
      const {items} = await render({selectionMode: "single"});

      items()[0]!.click();
      items()[1]!.click();
      await nextTick();

      expect(items()[0]).toHaveAttribute("aria-selected", "false");
      expect(items()[1]).toHaveAttribute("aria-selected", "true");
    });

    it("keeps both in multiple mode", async () => {
      const {items} = await render({selectionMode: "multiple"});

      items()[0]!.click();
      items()[1]!.click();
      await nextTick();

      expect(items()[0]).toHaveAttribute("aria-selected", "true");
      expect(items()[1]).toHaveAttribute("aria-selected", "true");
    });

    it("starts from the default keys", async () => {
      const {items} = await render({defaultSelectedKeys: ["2"], selectionMode: "single"});

      expect(items()[1]).toHaveAttribute("aria-selected", "true");
    });

    it("emits an action instead of selecting when there is no selection", async () => {
      const onAction = vi.fn();
      const {items} = await render({onAction});

      items()[0]!.click();

      expect(onAction).toHaveBeenCalledWith("1");
    });
  });

  describe("disabled items", () => {
    it("marks the item and leaves it out of the tab order", async () => {
      const {items} = await render({disabledKeys: ["2"], selectionMode: "single"});

      expect(items()[1]).toHaveAttribute("data-disabled", "true");
      expect(items()[1]).toHaveAttribute("aria-disabled", "true");
      // React Aria omits the attribute entirely rather than setting it to -1.
      expect(items()[1]).not.toHaveAttribute("tabindex");
    });

    it("ignores a click on it", async () => {
      const {items} = await render({disabledKeys: ["2"], selectionMode: "single"});

      items()[1]!.click();
      await nextTick();

      expect(items()[1]).toHaveAttribute("aria-selected", "false");
    });

    it("honours an item that disables itself", async () => {
      const {items} = await render({
        items: [
          {id: "1", name: "Bob"},
          {id: "2", isDisabled: true, name: "Fred"},
        ],
        selectionMode: "single",
      });

      expect(items()[1]).toHaveAttribute("data-disabled", "true");
    });
  });

  describe("keyboard", () => {
    it("moves focus down the list without selecting", async () => {
      const {items, listbox} = await render({selectionMode: "single"});

      press(listbox, "ArrowDown");
      await nextTick();

      expect(items()[0]).toHaveAttribute("tabindex", "0");
      expect(items()[1]).toHaveAttribute("tabindex", "-1");
      expect(items()[0]).toHaveAttribute("aria-selected", "false");
    });

    it("hands the tab stop from the listbox to an item", async () => {
      const {items, listbox} = await render();

      expect(listbox).toHaveAttribute("tabindex", "0");

      press(listbox, "ArrowDown");
      await nextTick();

      expect(listbox).toHaveAttribute("tabindex", "-1");
      expect(items()[0]).toHaveAttribute("tabindex", "0");
    });

    it("skips a disabled item", async () => {
      const {items, listbox} = await render({disabledKeys: ["2"]});

      press(listbox, "ArrowDown");
      press(items()[0]!, "ArrowDown");
      await nextTick();

      expect(items()[2]).toHaveAttribute("tabindex", "0");
    });

    it("selects the focused item on Space", async () => {
      const {items, listbox} = await render({selectionMode: "single"});

      press(listbox, "ArrowDown");
      press(items()[0]!, " ");
      await nextTick();

      expect(items()[0]).toHaveAttribute("aria-selected", "true");
    });

    it("moves focus by typing", async () => {
      const {items, listbox} = await render();

      press(listbox, "m");
      await nextTick();

      expect(items()[2]).toHaveAttribute("tabindex", "0");
    });

    it("does not match a description while typing", async () => {
      // The email would otherwise win on "b", which is what the exclusion list prevents.
      const {items, listbox} = await render({
        items: [
          {email: "bob@heroui.com", id: "1", name: "Zeta"},
          {id: "2", name: "Bob"},
        ],
      });

      press(listbox, "b");
      await nextTick();

      expect(items()[1]).toHaveAttribute("tabindex", "0");
    });
  });

  describe("indicator", () => {
    it("stays mounted and reports its visibility", async () => {
      const {items} = await render({selectionMode: "single", withIndicator: true});
      const indicator = () => items()[0]!.querySelector('[data-slot="list-box-item-indicator"]')!;

      expect(indicator()).toHaveAttribute("aria-hidden", "true");
      expect(indicator()).not.toHaveAttribute("data-visible");

      items()[0]!.click();
      await nextTick();

      expect(indicator()).toHaveAttribute("data-visible", "true");
    });

    it("animates the checkmark by its dash offset rather than by mounting", async () => {
      const {items} = await render({selectionMode: "single", withIndicator: true});
      const check = () =>
        items()[0]!.querySelector('[data-slot="list-box-item-indicator--checkmark"]')!;

      expect(check()).toHaveAttribute("stroke-dashoffset", "66");

      items()[0]!.click();
      await nextTick();

      expect(check()).toHaveAttribute("stroke-dashoffset", "44");
    });
  });

  describe("sections", () => {
    it("labels the group by its header", async () => {
      const {listbox} = await render({withSections: true});
      const section = listbox.querySelector("section")!;
      const header = section.querySelector('[data-slot="header"]')!;

      expect(section).toHaveAttribute("role", "group");
      expect(section).toHaveAttribute("aria-labelledby", header.getAttribute("id")!);
      // ARIA does not allow a heading inside a listbox, so it is demoted to a visual label.
      expect(header).toHaveAttribute("role", "presentation");
    });

    it("keeps the items in one flat collection", async () => {
      const {items, listbox} = await render({withSections: true});

      press(listbox, "ArrowDown");
      await nextTick();

      expect(items()).toHaveLength(3);
      expect(items()[0]).toHaveAttribute("tabindex", "0");
    });
  });

  describe("empty state", () => {
    it("shows the empty slot when there is nothing to show", async () => {
      const {listbox} = await render({items: [], withEmptyState: true});

      expect(listbox).toHaveAttribute("data-empty", "true");
      expect(listbox.querySelector('[data-slot="empty-state"]')).toHaveTextContent("Nothing here");
    });

    it("hides the empty slot as soon as there is something", async () => {
      const {listbox} = await render({withEmptyState: true});

      expect(listbox).not.toHaveAttribute("data-empty");
      expect(listbox.querySelector('[data-slot="empty-state"]')).toBeNull();
    });

    it("wraps the empty state so it is not read as an option", async () => {
      const {listbox} = await render({items: [], withEmptyState: true});
      const wrapper = listbox.querySelector('[role="presentation"]')!;

      expect(wrapper).not.toBeNull();
      expect(wrapper.querySelector('[data-slot="empty-state"]')).not.toBeNull();
      expect(listbox.querySelectorAll('[role="option"]')).toHaveLength(0);
    });

    it("renders nothing extra when no empty slot was handed over", async () => {
      const {listbox} = await render({items: []});

      // The `data-empty` half is unchanged either way, which is what a listbox that never asked
      // for an empty state relies on.
      expect(listbox).toHaveAttribute("data-empty", "true");
      expect(listbox.querySelector('[role="presentation"]')).toBeNull();
      expect(listbox.childElementCount).toBe(0);
    });
  });

  describe("description", () => {
    it("points the option at its description", async () => {
      const {items} = await render();
      const description = items()[0]!.querySelector('[data-slot="description"]')!;

      expect(items()[0]).toHaveAttribute("aria-describedby", description.getAttribute("id")!);
    });

    it("does not name the option by its label, matching React", async () => {
      // React Aria only hands out a label id when something takes the label slot, and HeroUI's
      // Label does not; the option names itself from its content instead.
      const {items} = await render();

      expect(items()[0]!.querySelector('[data-slot="label"]')).not.toHaveAttribute("id");
      expect(items()[0]).not.toHaveAttribute("aria-labelledby");
    });
  });
});
