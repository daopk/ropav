import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const menuIn = (container: HTMLElement) => container.querySelector<HTMLElement>('[role="menu"]')!;
/**
 * Selected by `data-slot` rather than by role, and both halves of that matter: the role changes with
 * the selection mode, and the empty state is itself a disabled `menuitem` — so a role query would
 * count a menu that has nothing in it as having one item.
 */
const itemsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="menu-item"]'),
];

const keydown = (element: Element, key: string) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });

  element.dispatchEvent(event);

  return event;
};

/** The items register a tick after the menu mounts, and auto-focus moves a tick after that. */
const settle = async () => {
  await nextTick();
  await nextTick();
};

/**
 * `MenuRoot` is the menu that stands on its own — no trigger, no popover.
 *
 * Its behaviour is `useMenu`, which `Dropdown` already exercises in full, so nothing here re-tests
 * arrow keys or selection for their own sake. What is untested is the **shell**: `MenuRoot` reads
 * `id`, the two naming props, `autoFocus` and `close` from its own props, where `DropdownMenu` reads
 * the same five from the trigger's context. That is the entire diff between the two files, and it
 * is the part no dropdown test can reach.
 */
describe("Menu", () => {
  describe("structure", () => {
    it("renders a menu around its items", async () => {
      const { container, unmount } = render();

      await settle();

      const menu = menuIn(container);

      expect(menu.tagName).toBe("DIV");
      expect(menu).toHaveAttribute("data-slot", "menu");
      expect(menu).toHaveClass("menu");
      expect(itemsIn(container)).toHaveLength(3);

      unmount();
    });

    it("takes the menu itself into the tab order", async () => {
      const { container, unmount } = render();

      await settle();

      // A menu is one tab stop and arrow keys move inside it, so the items are not tabbable.
      expect(menuIn(container)).toHaveAttribute("tabindex", "0");
      expect(itemsIn(container).map((item) => item.getAttribute("tabindex"))).toEqual([
        "-1",
        "-1",
        "-1",
      ]);

      unmount();
    });

    it("merges a caller class", async () => {
      const { container, unmount } = render({ class: "w-56" });

      await settle();

      expect(menuIn(container)).toHaveClass("menu", "w-56");

      unmount();
    });

    it("generates an id and lets the caller override it", async () => {
      const generated = render();

      await settle();
      expect(menuIn(generated.container).id).toBeTruthy();
      generated.unmount();

      const given = render({ id: "edit-actions" });

      await settle();
      expect(menuIn(given.container)).toHaveAttribute("id", "edit-actions");
      given.unmount();
    });

    it("re-homes a separator so it takes part in the menu's own layout", async () => {
      const { container, unmount } = render({ withSeparator: true });

      await settle();

      const separator = container.querySelector('[data-slot="separator"]')!;

      // A block-level `hr` between two items would break the flex column the menu lays out.
      expect(separator.tagName).toBe("DIV");
      // And it must stay out of the menu's ARIA tree rather than read as an item.
      expect(separator).not.toHaveAttribute("role", "menuitem");

      unmount();
    });
  });

  /**
   * The gap that made this file worth writing. A menu inside a trigger is named by it; a menu
   * standing on its own has nothing to borrow a name from, and `role="menu"` is not something axe
   * checks for a name — so an unnamed standalone menu passes every automated check there is.
   */
  describe("naming", () => {
    it("takes a name as a string", async () => {
      const { container, unmount } = render({ ariaLabel: "Edit actions" });

      await settle();

      expect(menuIn(container)).toHaveAttribute("aria-label", "Edit actions");

      unmount();
    });

    it("takes a name by pointing at another element", async () => {
      const { container, unmount } = render({
        ariaLabelledby: "menu-external-label",
        withExternalLabel: true,
      });

      await settle();

      expect(menuIn(container)).toHaveAttribute("aria-labelledby", "menu-external-label");
      expect(container.querySelector("#menu-external-label")).not.toBeNull();

      unmount();
    });

    it("claims no name it was not given", async () => {
      const { container, unmount } = render();

      await settle();

      const menu = menuIn(container);

      // Neither attribute may be rendered empty: an `aria-label=""` reads as a deliberate blank
      // name, which is worse than none at all.
      expect(menu.hasAttribute("aria-label")).toBe(false);
      expect(menu.hasAttribute("aria-labelledby")).toBe(false);

      unmount();
    });
  });

  describe("props the trigger would otherwise decide", () => {
    it("focuses the first item when asked", async () => {
      const { container, unmount } = render({ autoFocus: "first" });

      await settle();

      expect(document.activeElement).toBe(itemsIn(container)[0]);

      unmount();
    });

    it("focuses the last item when asked", async () => {
      const { container, unmount } = render({ autoFocus: "last" });

      await settle();

      expect(document.activeElement).toBe(itemsIn(container).at(-1));

      unmount();
    });

    it("leaves focus alone when it was not asked", async () => {
      const { container, unmount } = render();

      await settle();

      expect(container.contains(document.activeElement)).toBe(false);

      unmount();
    });

    it("emits close when an item is chosen", async () => {
      const onClose = vi.fn();
      const onAction = vi.fn();
      const { container, unmount } = render({ onAction, onClose });

      await settle();

      itemsIn(container)[1]!.click();
      await nextTick();

      expect(onAction).toHaveBeenCalledWith("copy");
      // Standing alone there is nothing to close, so the emit is the whole mechanism: a consumer
      // wrapping the menu in its own overlay hears about the choice through it.
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("does not emit close when the caller says choosing should not close it", async () => {
      const onClose = vi.fn();
      const { container, unmount } = render({ onClose, shouldCloseOnSelect: false });

      await settle();

      itemsIn(container)[1]!.click();
      await nextTick();

      expect(onClose).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe("empty state", () => {
    it("shows the empty slot beside the items rather than instead of them", async () => {
      const { container, unmount } = render({ items: [], withEmptyState: true });

      await settle();

      expect(container.textContent).toContain("Nothing here");
      expect(itemsIn(container)).toHaveLength(0);

      unmount();
    });

    it("carries the empty state as a disabled item", async () => {
      const { container, unmount } = render({ items: [], withEmptyState: true });

      await settle();

      const wrapper = menuIn(container).querySelector('[role="menuitem"]')!;

      expect(wrapper).not.toBeNull();
      expect(wrapper).toHaveAttribute("aria-disabled", "true");
      // A `presentation` wrapper flattens out of the tree, leaving the menu owning the caller's
      // prose, which is not an item — so the wrapper has to be the item itself.
      expect(menuIn(container).querySelector('[role="presentation"]')).toBeNull();
      // And it is not part of the collection, so nothing selects it and no arrow key reaches it.
      expect(wrapper).not.toHaveAttribute("data-key");
      expect(wrapper).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("stays quiet once there is something to show", async () => {
      const { container, unmount } = render({ withEmptyState: true });

      await settle();

      // The collection is learnt from what rendered, so swapping the items out for the empty state
      // would leave the menu empty for good.
      expect(container.textContent).not.toContain("Nothing here");
      expect(itemsIn(container)).toHaveLength(3);

      unmount();
    });
  });

  describe("selection reaches the caller", () => {
    it("reports a single selection", async () => {
      const onSelectionChange = vi.fn();
      const { container, unmount } = render({ onSelectionChange, selectionMode: "single" });

      await settle();

      itemsIn(container)[2]!.click();
      await nextTick();

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(["paste"]);

      unmount();
    });

    it("moves focus with the arrow keys and wraps at the end", async () => {
      const { container, unmount } = render();

      await settle();

      const menu = menuIn(container);
      const items = itemsIn(container);

      keydown(menu, "ArrowDown");
      await nextTick();
      expect(document.activeElement).toBe(items[0]);

      keydown(items[0]!, "ArrowUp");
      await nextTick();

      // A menu is a short list of actions, so running off the end wraps rather than stopping.
      expect(document.activeElement).toBe(items.at(-1));

      unmount();
    });
  });
});
