import type { DropdownFixtureItem } from "./fixtures.types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import DropdownFixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(DropdownFixture, { props });

type RenderResult = ReturnType<typeof render>;

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

/** A mouse press, which a menu trigger opens on the way down rather than on release. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const keydown = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });

  element.dispatchEvent(event);

  return event;
};

/**
 * Let the dropdown settle.
 *
 * Three ticks: the items register a tick after the menu mounts and focus moves in a tick later, and
 * on the way out the exit is reported as finished a tick after the animation settles — which in
 * jsdom, with no animations at all, is immediately.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const open = async (result: RenderResult) => {
  press(result.getByRole("button", { name: "Menu" }));
  await settle();

  return result.screen.getByRole("menu");
};

const itemsOf = (result: RenderResult) => [
  ...result.baseElement.querySelectorAll<HTMLElement>('[data-slot="menu-item"]'),
];

const keyOf = (element: Element | null) => element?.getAttribute("data-key") ?? null;

const FRUIT: DropdownFixtureItem[] = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "cherry", label: "Cherry" },
];

describe("Dropdown", () => {
  describe("structure", () => {
    it("renders nothing but its trigger while closed", () => {
      const result = render();

      expect(result.getByRole("button", { name: "Menu" })).toBeInTheDocument();
      expect(result.screen.queryByRole("menu")).toBeNull();
      expect(result.baseElement.querySelector('[data-slot="dropdown-popover"]')).toBeNull();

      result.unmount();
    });

    it("renders the menu inside a popover", async () => {
      const result = render();

      await open(result);

      const popover = result.screen.getByRole("dialog");

      expect(popover).toHaveAttribute("data-slot", "dropdown-popover");
      expect(popover).toHaveAttribute("data-trigger", "MenuTrigger");
      // Focusable but not a tab stop: the popover takes focus when it has nothing focusable of its
      // own, and never sits in the tab order itself.
      expect(popover).toHaveAttribute("tabindex", "-1");
      expect(popover.querySelector('[data-slot="dropdown-menu"]')).toBeInTheDocument();

      result.unmount();
    });

    it("renders the popover outside the tree it was declared in", async () => {
      const result = render();

      await open(result);

      // The popover has to escape whatever clips or stacks around the trigger, so it is rendered
      // at the end of the document instead.
      expect(result.container.querySelector('[data-slot="dropdown-popover"]')).toBeNull();
      expect(result.baseElement.querySelector('[data-slot="dropdown-popover"]')).not.toBeNull();

      result.unmount();
    });

    it("offers a way out for assistive technology", async () => {
      const result = render();

      await open(result);

      const dismissers = result.screen.getAllByRole("button", { name: "Dismiss" });

      // There is no Escape key on a touch device, and a screen reader user swiping through the
      // menu has no other way to leave it.
      expect(dismissers.length).toBeGreaterThan(0);
      expect(dismissers[0]).toHaveAttribute("tabindex", "-1");

      press(dismissers[0]!);
      await settle();

      expect(result.screen.queryByRole("menu")).toBeNull();

      result.unmount();
    });

    it("removes everything it rendered when it closes", async () => {
      const result = render();
      const menu = await open(result);

      keydown(menu, "Escape");
      await settle();

      expect(result.baseElement.querySelector('[data-slot="dropdown-popover"]')).toBeNull();

      result.unmount();
    });
  });

  describe("accessibility wiring", () => {
    it("wires the trigger to the menu it opens", async () => {
      const result = render();
      const trigger = result.getByRole("button", { name: "Menu" });

      expect(trigger).toHaveAttribute("aria-haspopup", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      // The element it would name does not exist yet, and an idref pointing at nothing is worse
      // than no idref.
      expect(trigger).not.toHaveAttribute("aria-controls");

      const menu = await open(result);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", menu.id);
      expect(menu).toHaveAttribute("aria-labelledby", trigger.id);

      result.unmount();
    });

    it("names the popover after the trigger too", async () => {
      const result = render();
      const trigger = result.getByRole("button", { name: "Menu" });

      await open(result);

      expect(result.screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", trigger.id);

      result.unmount();
    });

    it("hides the rest of the page while the menu is open", async () => {
      const result = render();

      await open(result);

      // Otherwise a screen reader can wander out of the menu and read the page behind it, with
      // nothing announcing that it has left.
      expect(result.container).toHaveAttribute("aria-hidden", "true");

      keydown(result.screen.getByRole("menu"), "Escape");
      await settle();

      expect(result.container).not.toHaveAttribute("aria-hidden");

      result.unmount();
    });

    it("points an item at its own description", async () => {
      const result = render({
        items: [{ description: "Create a new file", id: "new-file", label: "New file" }],
      });

      await open(result);

      const item = itemsOf(result)[0]!;
      const description = item.querySelector('[data-slot="description"]')!;

      expect(description.id).toBeTruthy();
      expect(item).toHaveAttribute("aria-describedby", description.id);

      result.unmount();
    });

    it("leaves an item unlabelled by idref, naming it from its own content", async () => {
      const result = render();

      await open(result);

      const item = itemsOf(result)[0]!;

      // The label is part of the item, so the item's accessible name already comes from it; an
      // `aria-labelledby` pointing inside itself would only add an attribute.
      expect(item).not.toHaveAttribute("aria-labelledby");
      expect(item).toHaveAccessibleName("New file");

      result.unmount();
    });
  });

  describe("selection", () => {
    it("carries no checked state without a selection mode", async () => {
      const result = render();

      await open(result);

      for (const item of itemsOf(result)) {
        expect(item).toHaveAttribute("role", "menuitem");
        expect(item).not.toHaveAttribute("aria-checked");
        expect(item).not.toHaveAttribute("data-selection-mode");
      }

      result.unmount();
    });

    it("reads a single-select item as a radio", async () => {
      const result = render({ items: FRUIT, selectedKeys: ["apple"], selectionMode: "single" });

      await open(result);

      const [apple, banana] = itemsOf(result);

      expect(apple).toHaveAttribute("role", "menuitemradio");
      expect(apple).toHaveAttribute("aria-checked", "true");
      expect(apple).toHaveAttribute("data-selected", "true");
      expect(apple).toHaveAttribute("data-selection-mode", "single");
      // Stated rather than omitted, so a screen reader says "not checked" instead of nothing.
      expect(banana).toHaveAttribute("aria-checked", "false");
      expect(banana).not.toHaveAttribute("data-selected");

      result.unmount();
    });

    it("reads a multi-select item as a checkbox", async () => {
      const result = render({ items: FRUIT, selectedKeys: ["apple"], selectionMode: "multiple" });

      await open(result);

      const [apple] = itemsOf(result);

      expect(apple).toHaveAttribute("role", "menuitemcheckbox");
      expect(apple).toHaveAttribute("aria-checked", "true");
      expect(apple).toHaveAttribute("data-selection-mode", "multiple");

      result.unmount();
    });

    it("reports a selection change", async () => {
      const onSelectionChange = vi.fn();
      const result = render({ items: FRUIT, onSelectionChange, selectionMode: "single" });

      await open(result);
      press(itemsOf(result)[1]!);
      await nextTick();

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect([...onSelectionChange.mock.calls[0]![0]]).toEqual(["banana"]);

      result.unmount();
    });

    it("closes after a single choice but stays open for several", async () => {
      const single = render({ items: FRUIT, selectionMode: "single" });

      await open(single);
      press(itemsOf(single)[1]!);
      await settle();

      expect(single.screen.queryByRole("menu")).toBeNull();

      single.unmount();

      const multiple = render({ items: FRUIT, selectionMode: "multiple" });

      await open(multiple);
      press(itemsOf(multiple)[1]!);
      await nextTick();

      // Plainly making several choices, so closing after the first would be in the way.
      expect(multiple.screen.queryByRole("menu")).not.toBeNull();

      multiple.unmount();
    });

    it("shows the indicator on the selected item only", async () => {
      const result = render({
        items: FRUIT,
        selectedKeys: ["apple"],
        selectionMode: "single",
        withIndicator: true,
      });

      await open(result);

      const indicators = result.baseElement.querySelectorAll('[data-slot="menu-item-indicator"]');

      expect(indicators).toHaveLength(3);
      expect(indicators[0]).toHaveAttribute("data-visible", "true");
      expect(indicators[1]).not.toHaveAttribute("data-visible");
      // Hidden from assistive technology: `aria-checked` on the item already says it.
      expect(indicators[0]).toHaveAttribute("aria-hidden", "true");

      result.unmount();
    });

    it("draws the checkmark rather than revealing it", async () => {
      const result = render({
        items: FRUIT,
        selectedKeys: ["apple"],
        selectionMode: "single",
        withIndicator: true,
      });

      await open(result);

      const marks = result.baseElement.querySelectorAll(
        '[data-slot="menu-item-indicator--checkmark"]',
      );

      // The stroke is dashed to its own length and the offset slid from past the end to the start,
      // which is what makes it appear to be written on.
      expect(marks[0]).toHaveAttribute("stroke-dasharray", "22");
      expect(marks[0]).toHaveAttribute("stroke-dashoffset", "44");
      expect(marks[1]).toHaveAttribute("stroke-dashoffset", "66");

      result.unmount();
    });
  });

  describe("empty state", () => {
    it("shows the empty slot when there is nothing to show", async () => {
      const result = render({ items: [], withEmptyState: true });
      const menu = await open(result);

      expect(menu.querySelector('[data-slot="empty-state"]')).toHaveTextContent("Nothing here");

      result.unmount();
    });

    it("hides the empty slot as soon as there is something", async () => {
      const result = render({ withEmptyState: true });
      const menu = await open(result);

      expect(menu.querySelector('[data-slot="empty-state"]')).toBeNull();

      result.unmount();
    });

    it("carries the empty state as a disabled item", async () => {
      const result = render({ items: [], withEmptyState: true });
      const menu = await open(result);
      const wrapper = menu.querySelector('[role="menuitem"]')!;

      expect(wrapper).not.toBeNull();
      expect(wrapper).toHaveAttribute("aria-disabled", "true");
      expect(wrapper.querySelector('[data-slot="empty-state"]')).not.toBeNull();
      // A `presentation` wrapper flattens out of the tree, leaving the menu owning the caller's
      // prose, which is not an item — so the wrapper has to be the item itself.
      expect(menu.querySelector('[role="presentation"]')).toBeNull();

      result.unmount();
    });

    it("renders nothing extra when no empty slot was handed over", async () => {
      const result = render({ items: [] });
      const menu = await open(result);

      expect(menu.querySelector('[role="presentation"]')).toBeNull();
      expect(menu.childElementCount).toBe(0);

      result.unmount();
    });
  });

  describe("sections", () => {
    it("groups items and names the group after its header", async () => {
      const result = render({ withHeader: true, withSection: true });

      await open(result);

      const group = result.screen.getByRole("group");
      const header = result.baseElement.querySelector('[data-slot="header"]')!;

      expect(header.id).toBeTruthy();
      expect(group).toHaveAttribute("aria-labelledby", header.id);
      // ARIA does not allow a heading inside a menu, so the header is demoted to a plain label.
      expect(header).toHaveAttribute("role", "presentation");

      result.unmount();
    });

    it("leaves a section without a header unnamed", async () => {
      const result = render({ withSection: true });

      await open(result);

      expect(result.screen.getByRole("group")).not.toHaveAttribute("aria-labelledby");

      result.unmount();
    });
  });

  describe("separators", () => {
    /**
     * A menu lays its own items out, so the rule between two of them has to take part in that
     * layout rather than being the block-level `hr` it is on its own.
     */
    it("renders a rule that takes part in the menu's own layout", async () => {
      const result = render({ withSeparator: true });

      await open(result);

      const separator = result.baseElement.querySelector('[data-slot="separator"]')!;

      expect(separator.tagName).toBe("DIV");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator).not.toHaveAttribute("aria-orientation");

      result.unmount();
    });
  });

  describe("disabled items", () => {
    it("marks a disabled item and takes it out of the tab order", async () => {
      const result = render({ disabledKeys: ["delete-file"] });

      await open(result);

      const disabled = itemsOf(result).at(-1)!;

      expect(disabled).toHaveAttribute("aria-disabled", "true");
      expect(disabled).toHaveAttribute("data-disabled", "true");
      expect(disabled).not.toHaveAttribute("tabindex");

      result.unmount();
    });

    it("does nothing when a disabled item is pressed", async () => {
      const onAction = vi.fn();
      const result = render({ disabledKeys: ["delete-file"], onAction });

      await open(result);
      press(itemsOf(result).at(-1)!);
      await settle();

      expect(onAction).not.toHaveBeenCalled();
      expect(result.screen.queryByRole("menu")).not.toBeNull();

      result.unmount();
    });

    it("skips a disabled item when arrowing", async () => {
      const result = render({ disabledKeys: ["copy-link"] });
      const menu = await open(result);

      keydown(menu, "ArrowDown");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("new-file");

      keydown(document.activeElement!, "ArrowDown");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("delete-file");

      result.unmount();
    });
  });

  describe("keyboard", () => {
    it("opens on Enter with the first item focused", async () => {
      const result = render();

      keydown(result.getByRole("button", { name: "Menu" }), "Enter");
      await settle();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();
      expect(keyOf(document.activeElement)).toBe("new-file");

      result.unmount();
    });

    it("opens on ArrowUp with the last item focused", async () => {
      const result = render();

      // The key says which end to start from, so the menu opens where the user is heading.
      keydown(result.getByRole("button", { name: "Menu" }), "ArrowUp");
      await settle();

      expect(keyOf(document.activeElement)).toBe("delete-file");

      result.unmount();
    });

    it("focuses the menu itself when opened by pointer", async () => {
      const result = render();
      const menu = await open(result);

      // No item is chosen yet, so the first arrow press starts from the top rather than from
      // wherever the pointer happened to be.
      expect(document.activeElement).toBe(menu);
      expect(menu).toHaveAttribute("tabindex", "0");

      result.unmount();
    });

    it("opens on the choice already made", async () => {
      const result = render({ items: FRUIT, selectedKeys: ["banana"], selectionMode: "single" });

      await open(result);

      // Reopening a menu of choices on the current one is where the user left off.
      expect(keyOf(document.activeElement)).toBe("banana");

      result.unmount();
    });

    it("wraps at the ends", async () => {
      const result = render();
      const menu = await open(result);

      keydown(menu, "ArrowUp");
      await nextTick();

      // A menu is a short list of actions, so running off the end is a dead end rather than a
      // boundary worth feeling.
      expect(keyOf(document.activeElement)).toBe("delete-file");

      keydown(document.activeElement!, "ArrowDown");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("new-file");

      result.unmount();
    });

    it("jumps to the ends on Home and End", async () => {
      const result = render();
      const menu = await open(result);

      keydown(menu, "End");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("delete-file");

      keydown(document.activeElement!, "Home");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("new-file");

      result.unmount();
    });

    it("moves the roving tab stop with focus", async () => {
      const result = render();
      const menu = await open(result);

      keydown(menu, "ArrowDown");
      await nextTick();

      const items = itemsOf(result);

      // Exactly one stop inside the menu, so one Tab leaves it rather than stepping through it.
      expect(items.filter((item) => item.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect(menu).toHaveAttribute("tabindex", "-1");

      result.unmount();
    });

    it("finds an item by typing", async () => {
      const result = render({ items: FRUIT });
      const menu = await open(result);

      keydown(menu, "c");
      await nextTick();

      expect(keyOf(document.activeElement)).toBe("cherry");

      result.unmount();
    });

    it("acts on Enter and closes", async () => {
      const onAction = vi.fn();
      const result = render({ onAction });
      const menu = await open(result);

      keydown(menu, "ArrowDown");
      await nextTick();
      keydown(document.activeElement!, "Enter");
      await settle();

      expect(onAction).toHaveBeenCalledWith("new-file");
      expect(result.screen.queryByRole("menu")).toBeNull();

      result.unmount();
    });

    it("ticks an item on Space without closing", async () => {
      const result = render({ items: FRUIT, selectionMode: "multiple" });
      const menu = await open(result);

      keydown(menu, "ArrowDown");
      await nextTick();
      keydown(document.activeElement!, " ");
      await nextTick();

      // Space is the key for ticking things, so it only closes when there is nothing to tick.
      expect(result.screen.queryByRole("menu")).not.toBeNull();
      expect(itemsOf(result)[0]).toHaveAttribute("aria-checked", "true");

      result.unmount();
    });

    it("gives focus back to the trigger when it closes", async () => {
      const result = render();
      const trigger = result.getByRole("button", { name: "Menu" });

      keydown(trigger, "Enter");
      await settle();
      keydown(document.activeElement!, "Escape");
      await settle();

      // Otherwise a keyboard user is dropped at the top of the page.
      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });
  });

  describe("the trigger", () => {
    // Written even though a native button is already tabbable: Safari does not focus one unless
    // an explicit tab index says so, which is why react-aria always sets it.
    it("renders an explicit tab index", () => {
      const result = render();

      expect(result.getByRole("button", { name: "Menu" })).toHaveAttribute("tabindex", "0");

      result.unmount();
    });

    it("looks pressed for as long as its menu is open", async () => {
      const result = render();
      const trigger = result.getByRole("button", { name: "Menu" });

      expect(trigger).not.toHaveAttribute("data-pressed");

      await open(result);

      expect(trigger).toHaveAttribute("data-pressed", "true");

      result.unmount();
    });

    it("opens on the way down for a mouse", async () => {
      const result = render();

      result
        .getByRole("button", { name: "Menu" })
        .dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      // Matching every desktop menu, where the menu appears on the way down.
      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });

    it("opens on release for touch", async () => {
      const result = render();
      const trigger = result.getByRole("button", { name: "Menu" });
      const touch = { ...POINTER, pointerType: "touch" } as const;

      trigger.dispatchEvent(new PointerEvent("pointerdown", touch));
      await nextTick();

      // A menu appearing under a finger still on the glass would land where the finger is about
      // to lift.
      expect(result.screen.queryByRole("menu")).toBeNull();

      trigger.dispatchEvent(new PointerEvent("pointerup", touch));
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
      await settle();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });

    it("renders its own button when asked to", async () => {
      const result = renderVapor(DropdownFixture, { props: { withCustomTrigger: true } });
      const trigger = result.getByRole("button", { name: "Menu" });

      expect(trigger).toHaveAttribute("data-slot", "dropdown-trigger");
      expect(trigger).toHaveAttribute("aria-haspopup", "true");

      press(trigger);
      await settle();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });
  });

  describe("long press", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("says the press has to be held", () => {
      const result = render({ trigger: "longPress" });
      const trigger = result.getByRole("button", { name: "Menu" });
      const describedBy = trigger.getAttribute("aria-describedby")!;

      // Nothing on screen conveys the gesture, so without this it is undiscoverable.
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy)).toHaveTextContent(/long press/i);

      result.unmount();
    });

    it("does not open on an ordinary press", async () => {
      const result = render({ trigger: "longPress" });

      press(result.getByRole("button", { name: "Menu" }));
      await nextTick();

      expect(result.screen.queryByRole("menu")).toBeNull();

      result.unmount();
    });

    it("opens once the press is held", async () => {
      const result = render({ trigger: "longPress" });

      result
        .getByRole("button", { name: "Menu" })
        .dispatchEvent(new PointerEvent("pointerdown", POINTER));
      vi.advanceTimersByTime(500);
      await nextTick();
      await nextTick();
      await nextTick();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });

    it("opens on Alt+ArrowDown, which is the only keyboard way in", async () => {
      const result = render({ trigger: "longPress" });

      keydown(result.getByRole("button", { name: "Menu" }), "ArrowDown", { altKey: true });
      await nextTick();
      await nextTick();
      await nextTick();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });
  });

  describe("controlled open state", () => {
    it("renders open when told to", async () => {
      const result = render({ isOpen: true });

      await settle();

      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      result.unmount();
    });

    it("reports the change without opening itself", async () => {
      const onOpenChange = vi.fn();
      const result = render({ isOpen: false, onOpenChange });

      press(result.getByRole("button", { name: "Menu" }));
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(true);
      // The owner of `isOpen` decides; the dropdown must not have opened on its own.
      expect(result.screen.queryByRole("menu")).toBeNull();

      result.unmount();
    });
  });

  describe("submenus", () => {
    const openSubmenu = async (result: RenderResult) => {
      const trigger = result.screen.getByRole("menuitem", { name: "Share" });

      trigger.focus();
      keydown(trigger, "ArrowRight");
      await settle();

      return trigger;
    };

    it("marks the item that opens a submenu", async () => {
      const result = render({ withSubmenu: true });

      await open(result);

      const trigger = result.screen.getByRole("menuitem", { name: "Share" });

      expect(trigger).toHaveAttribute("data-has-submenu", "true");
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).not.toHaveAttribute("aria-controls");
      // A trigger is not itself a choice, whatever the surrounding selection mode is.
      expect(trigger).not.toHaveAttribute("aria-checked");

      result.unmount();
    });

    it("renders the submenu indicator only on the item that opens one", async () => {
      const result = render({ withSubmenu: true });

      await open(result);

      expect(result.baseElement.querySelectorAll('[data-slot="submenu-indicator"]')).toHaveLength(
        1,
      );

      result.unmount();
    });

    it("opens the submenu on ArrowRight and names it after its trigger", async () => {
      const result = render({ withSubmenu: true });

      await open(result);

      const trigger = await openSubmenu(result);
      const menus = result.screen.getAllByRole("menu");

      expect(menus).toHaveLength(2);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("data-open", "true");
      expect(trigger).toHaveAttribute("aria-controls", menus[1]!.id);
      expect(menus[1]).toHaveAttribute("aria-labelledby", trigger.id);

      result.unmount();
    });

    it("does not read a submenu's own items as opening one", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      const submenuItem = result.screen.getByRole("menuitem", { name: "WhatsApp" });

      // The submenu trigger supplies its popup to the one item above it; a submenu's own items are
      // deeper in the same tree and must not inherit it.
      expect(submenuItem).not.toHaveAttribute("data-has-submenu");
      expect(submenuItem).not.toHaveAttribute("aria-haspopup");

      result.unmount();
    });

    it("renders the submenu beside the menu that opened it, in one subtree", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      const popovers = result.baseElement.querySelectorAll('[data-slot="dropdown-popover"]');

      expect(popovers).toHaveLength(2);
      // One subtree for the whole open tree, which is what lets it be exempted from hiding as a
      // unit — and what keeps the submenu out of the scrolling menu that would clip it.
      expect(popovers[0]!.parentElement).toBe(popovers[1]!.parentElement);
      expect(popovers[1]).toHaveAttribute("data-trigger", "SubmenuTrigger");

      result.unmount();
    });

    it("focuses the first item of the submenu when opened by keyboard", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      expect(keyOf(document.activeElement)).toBe("whatsapp");

      result.unmount();
    });

    it("closes the submenu on ArrowLeft and leaves the menu open", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      keydown(result.screen.getAllByRole("menu")[1]!, "ArrowLeft");
      await settle();

      expect(result.screen.getAllByRole("menu")).toHaveLength(1);
      expect(keyOf(document.activeElement)).toBe("share");

      result.unmount();
    });

    it("closes the submenu on Escape and leaves the menu open", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      keydown(result.screen.getAllByRole("menu")[1]!, "Escape");
      await settle();

      // Only the innermost overlay dismisses, so one Escape does not collapse the whole tree.
      expect(result.screen.getAllByRole("menu")).toHaveLength(1);

      result.unmount();
    });

    it("closes the submenu when focus moves to another item in the menu", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      itemsOf(result)[0]!.focus();
      await settle();

      // A submenu left open beside an unrelated item reads as that item's submenu.
      expect(result.screen.getAllByRole("menu")).toHaveLength(1);

      result.unmount();
    });

    it("closes the whole tree when an item in the submenu is chosen", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);
      press(result.screen.getByRole("menuitem", { name: "Telegram" }));
      await settle();

      expect(result.screen.queryByRole("menu")).toBeNull();

      result.unmount();
    });

    it("does not hide the submenu from assistive technology", async () => {
      const result = render({ withSubmenu: true });

      await open(result);
      await openSubmenu(result);

      const submenu = result.screen.getAllByRole("menu")[1]!;

      // Rendered after the rest of the page was hidden, so it has to ask to be spared rather than
      // assume.
      expect(submenu.closest("[aria-hidden]")).toBeNull();

      result.unmount();
    });
  });
});
