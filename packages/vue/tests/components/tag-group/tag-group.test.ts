import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  // Tags register post-flush, so the collection — and everything derived from its size — only
  // settles after a tick.
  await nextTick();

  const group = result.container.querySelector('[data-slot="tag-group"]')!;
  const list = group.querySelector('[data-slot="tag-group-list"]')!;

  return {
    ...result,
    group,
    list,
    tags: () => [...group.querySelectorAll<HTMLElement>('[data-slot="tag"]')],
  };
};

const press = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key, ...init}),
  );
};

describe("TagGroup", () => {
  describe("structure", () => {
    it("leaves the group itself free of semantics", async () => {
      // The grid is the list, not the group: the group only holds the label and help text.
      const {group} = await render();

      expect(group).not.toHaveAttribute("role");
      expect(group).not.toHaveAttribute("aria-label");
      expect(group).toHaveClass("tag-group");
    });

    it("makes the list a grid", async () => {
      const {list} = await render();

      expect(list).toHaveAttribute("role", "grid");
      expect(list).toHaveClass("tag-group__list");
      expect(list).toHaveAttribute("aria-atomic", "false");
      expect(list).toHaveAttribute("aria-relevant", "additions");
    });

    it("falls back to a plain group when there are no tags", async () => {
      // A grid with no rows would have assistive technology announce an empty table.
      const {list} = await render({tags: []});

      expect(list).toHaveAttribute("role", "group");
      expect(list).toHaveAttribute("data-empty", "true");
    });

    it("renders each tag as a row wrapping a cell", async () => {
      const {tags} = await render();
      const cell = tags()[0]!.querySelector('[role="gridcell"]')!;

      expect(tags()[0]).toHaveAttribute("role", "row");
      expect(cell).toHaveAttribute("aria-colindex", "1");
      // The cell has to stay out of the layout so the tag's own flex rules reach the content.
      expect(cell.getAttribute("style")).toContain("display: contents");
    });

    it("derives a tag id from the list id and the key", async () => {
      const {list, tags} = await render();

      expect(tags()[0]).toHaveAttribute("id", `${list.getAttribute("id")}-News`);
      expect(tags()[0]).toHaveAttribute("data-key", "News");
    });
  });

  describe("announcements", () => {
    it("stays quiet until focus is inside", async () => {
      const {list} = await render();

      expect(list).toHaveAttribute("aria-live", "off");

      list.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
      await nextTick();

      expect(list).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("labelling", () => {
    it("points the list at the group's label and description", async () => {
      const {group, list} = await render({withLabel: true});
      const label = group.querySelector('[data-slot="label"]')!;
      const description = group.querySelector('[data-slot="description"]')!;

      expect(list).toHaveAttribute("aria-labelledby", label.getAttribute("id")!);
      expect(list).toHaveAttribute("aria-describedby", description.getAttribute("id")!);
    });

    it("renders the group's label as a span", async () => {
      // A tag group has no labelable form control for a `label` to point at.
      const {group} = await render({withLabel: true});

      expect(group.querySelector('[data-slot="label"]')!.tagName).toBe("SPAN");
    });

    it("names each tag from its own content", async () => {
      const {tags} = await render();

      expect(tags()[0]).toHaveAttribute("aria-label", "News");
    });
  });

  describe("size and variant", () => {
    it("takes both from the group rather than from each tag", async () => {
      const {tags} = await render({size: "lg", variant: "surface"});

      expect(tags()[0]).toHaveClass("tag", "tag--lg", "tag--surface");
    });
  });

  describe("selection", () => {
    it("omits the selection attributes when nothing can be selected", async () => {
      const {tags} = await render();

      expect(tags()[0]).not.toHaveAttribute("aria-selected");
      expect(tags()[0]).not.toHaveAttribute("data-selection-mode");
    });

    it("selects a tag on click", async () => {
      const {tags} = await render({selectionMode: "single"});

      tags()[1]!.click();
      await nextTick();

      expect(tags()[1]).toHaveAttribute("aria-selected", "true");
      expect(tags()[1]).toHaveAttribute("data-selected", "true");
    });

    it("keeps several selected in multiple mode", async () => {
      const {tags} = await render({selectionMode: "multiple"});

      tags()[0]!.click();
      tags()[2]!.click();
      await nextTick();

      expect(tags()[0]).toHaveAttribute("aria-selected", "true");
      expect(tags()[2]).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("tab order", () => {
    it("makes every enabled tag a tab stop before focus lands", async () => {
      // A tag group differs from a listbox here: it has no separate container tab stop, so each
      // tag is reachable until focus picks one.
      const {tags} = await render();

      expect(tags().map((tag) => tag.getAttribute("tabindex"))).toEqual(["0", "0", "0"]);
    });

    it("collapses to a single tab stop once focus lands", async () => {
      const {list, tags} = await render();

      press(list, "ArrowRight");
      await nextTick();

      expect(tags().map((tag) => tag.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    });

    it("keeps a disabled tag out of the tab order", async () => {
      const {tags} = await render({disabledKeys: ["Travel"]});

      expect(tags()[1]).toHaveAttribute("tabindex", "-1");
      expect(tags()[1]).toHaveAttribute("data-disabled", "true");
    });
  });

  describe("keyboard", () => {
    it("navigates along the inline axis", async () => {
      const {list, tags} = await render();

      press(list, "ArrowRight");
      press(tags()[0]!, "ArrowRight");
      await nextTick();

      expect(tags()[1]).toHaveAttribute("tabindex", "0");
    });

    it("wraps at the end, unlike a listbox", async () => {
      const {list, tags} = await render();

      press(list, "ArrowLeft");
      await nextTick();

      expect(tags()[2]).toHaveAttribute("tabindex", "0");

      press(tags()[2]!, "ArrowRight");
      await nextTick();

      expect(tags()[0]).toHaveAttribute("tabindex", "0");
    });
  });

  describe("removing", () => {
    it("offers no remove button until a handler is supplied", async () => {
      const {tags} = await render();

      expect(tags()[0]!.querySelector('[data-slot="tag-remove-button"]')).toBeNull();
      expect(tags()[0]).not.toHaveAttribute("data-allows-removing");
    });

    it("renders a default remove button once removal is possible", async () => {
      const onRemove = vi.fn();
      const {tags} = await render({onRemove});
      const button = tags()[0]!.querySelector('[data-slot="tag-remove-button"]')!;

      expect(button).toHaveAttribute("aria-label", "Remove tag");
      expect(button).toHaveAttribute("slot", "remove");
      expect(tags()[0]).toHaveAttribute("data-allows-removing", "true");
    });

    it("removes the tag it belongs to", async () => {
      const onRemove = vi.fn();
      const {tags} = await render({onRemove});

      (tags()[1]!.querySelector('[data-slot="tag-remove-button"]') as HTMLElement).click();

      expect(onRemove).toHaveBeenCalledWith(new Set(["Travel"]));
    });

    it("takes the whole selection when the tag is selected", async () => {
      // Removing a multi-selection has to be one gesture rather than several.
      const onRemove = vi.fn();
      const {tags} = await render({onRemove, selectionMode: "multiple"});

      tags()[0]!.click();
      tags()[1]!.click();
      await nextTick();
      (tags()[1]!.querySelector('[data-slot="tag-remove-button"]') as HTMLElement).click();

      expect(onRemove).toHaveBeenCalledWith(new Set(["News", "Travel"]));
    });

    it("removes on Delete and Backspace", async () => {
      const onRemove = vi.fn();
      const {tags} = await render({onRemove});

      press(tags()[0]!, "Delete");
      press(tags()[1]!, "Backspace");

      expect(onRemove).toHaveBeenNthCalledWith(1, new Set(["News"]));
      expect(onRemove).toHaveBeenNthCalledWith(2, new Set(["Travel"]));
    });

    it("ignores Delete when removal is not offered", async () => {
      const {tags} = await render();
      const event = new KeyboardEvent("keydown", {cancelable: true, key: "Delete"});

      tags()[0]!.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it("replaces the default button when the caller supplies one", async () => {
      const onRemove = vi.fn();
      const {tags} = await render({customRemoveButton: true, onRemove});
      const buttons = tags()[0]!.querySelectorAll('[data-slot="tag-remove-button"]');

      // Slot fallback content is dropped entirely when the slot is filled, so exactly one
      // button renders rather than the caller's plus the default.
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveAttribute("data-testid", "custom-remove");
    });
  });

  describe("empty state", () => {
    it("shows only once the collection is known to be empty", async () => {
      const {group} = await render({tags: []});

      expect(group.querySelector('[data-slot="empty-state"]')).toBeInTheDocument();
    });

    it("stays away while there are tags", async () => {
      const {group} = await render();

      expect(group.querySelector('[data-slot="empty-state"]')).toBeNull();
    });

    it("never mounts on the way past, even before the tags register", () => {
      // The collection reads as empty during the first render, so without a gate the empty state
      // would mount and unmount within one tick — and run whatever that slot does en route.
      const result = renderVapor(Fixture, {props: {}});
      const group = result.container.querySelector('[data-slot="tag-group"]')!;

      expect(group.querySelector('[data-slot="empty-state"]')).toBeNull();
    });
  });
});
