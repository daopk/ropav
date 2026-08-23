import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import DropdownFixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(DropdownFixture, {props});

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

const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

/** Wait for the entry animation to finish, so the popover is measured at its settled size. */
const settled = async (popover: HTMLElement) => {
  await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

/**
 * Put the trigger where the popover fits beside it.
 *
 * The test window is narrow. A trigger in the middle of it leaves no room for a 220px popover to
 * the right, so the popover is shifted inwards to stay on screen — correct, but it hides whether
 * the alignment itself is right. Placed on the boundary's own padded edge instead, nothing needs
 * shifting and the alignment is readable.
 */
const place = (result: RenderResult) => {
  result.container.style.position = "fixed";
  result.container.style.left = "12px";
  result.container.style.top = "40%";
};

/**
 * The trigger's geometry as the popover was positioned against it.
 *
 * Measured before opening on purpose: a trigger looks pressed for as long as its menu is open, and
 * the pressed state scales it down, so its rectangle afterwards is a fraction of a pixel narrower
 * than the one the popover was placed against.
 */
const measure = (element: Element) => element.getBoundingClientRect();

/** Close an open menu and let its exit animation finish, leaving focus where the page would. */
const dismiss = async (result: RenderResult) => {
  const popover = result.screen.queryByRole("dialog") as HTMLElement | null;

  await userEvent.keyboard("{Escape}");

  if (popover) await settled(popover);
  await nextTick();
  await nextTick();
};

const open = async (result: RenderResult) => {
  press(result.getByRole("button", {name: "Menu"}));
  await nextTick();
  await nextTick();
  await nextTick();

  const popover = result.screen.getByRole("dialog") as HTMLElement;

  await settled(popover);

  return popover;
};

afterEach(() => {
  // The page-wide scroll lock and the `inert` marking both live outside the container, so a leaked
  // one would show up as an unrelated failure in the next suite.
  document.documentElement.style.overflow = "";
});

/**
 * The popover's whole reason for existing is geometric: it is measured, positioned against its
 * trigger, capped to the room available and animated out of the point it is anchored to. None of
 * that can be read without a real layout.
 */
describe("Dropdown (browser)", () => {
  describe("position", () => {
    it("sits below its trigger, offset from it", async () => {
      const result = render();

      place(result);

      const trigger = result.getByRole("button", {name: "Menu"});
      const triggerRect = measure(trigger);
      const popover = await open(result);
      const popoverRect = popover.getBoundingClientRect();

      expect(popover).toHaveAttribute("data-placement", "bottom");
      expect(popoverRect.top - triggerRect.bottom).toBeCloseTo(8, 0);
      // A logical `bottom start` placement, so its start edge lines up with the trigger's.
      expect(popoverRect.left).toBeCloseTo(triggerRect.left, 0);

      result.unmount();
    });

    it("anchors its transform origin to the trigger", async () => {
      const result = render();

      place(result);

      const popover = await open(result);

      // The stylesheet uses this as the `transform-origin`, so the popover grows out of its
      // trigger rather than out of its own centre. A static comparison never catches it being
      // wrong — only the animation shows it.
      expect(popover.style.getPropertyValue("--trigger-anchor-point")).toBe("0px 0px");
      expect(getComputedStyle(popover).transformOrigin).toBe("0px 0px");

      result.unmount();
    });

    it("publishes the trigger's width", async () => {
      const result = render();

      place(result);

      const trigger = result.getByRole("button", {name: "Menu"});
      const triggerWidth = measure(trigger).width;
      const popover = await open(result);
      const published = Number.parseFloat(popover.style.getPropertyValue("--trigger-width"));

      expect(published).toBeCloseTo(triggerWidth, 1);

      result.unmount();
    });

    it("caps its height at the room left below the trigger", async () => {
      const result = render();

      place(result);

      const trigger = result.getByRole("button", {name: "Menu"});
      const triggerBottom = measure(trigger).bottom;
      const popover = await open(result);
      const maxHeight = Number.parseFloat(popover.style.maxHeight);
      const available = window.innerHeight - triggerBottom - 8 - 12;

      // Without the cap a long menu would run off the bottom of the window with no way to reach
      // the rest of it.
      expect(Math.abs(maxHeight - available)).toBeLessThanOrEqual(1);

      result.unmount();
    });

    it("flips above the trigger when there is no room below", async () => {
      const result = render();
      const trigger = result.getByRole("button", {name: "Menu"});

      // Pushed to the bottom of the window, where the menu cannot fit underneath.
      result.container.style.position = "fixed";
      result.container.style.bottom = "0px";
      result.container.style.left = "0px";

      const triggerTop = measure(trigger).top;
      const popover = await open(result);

      expect(popover).toHaveAttribute("data-placement", "top");
      expect(popover.getBoundingClientRect().bottom).toBeLessThanOrEqual(triggerTop);

      result.unmount();
    });

    it("keeps itself inside the window", async () => {
      const result = render();

      result.container.style.position = "fixed";
      result.container.style.right = "0px";
      result.container.style.top = "0px";

      const popover = await open(result);
      const rect = popover.getBoundingClientRect();

      expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
      expect(rect.left).toBeGreaterThanOrEqual(0);

      result.unmount();
    });
  });

  describe("animation", () => {
    it("animates in from its anchor point and then stops reporting entry", async () => {
      const result = render();

      press(result.getByRole("button", {name: "Menu"}));
      await nextTick();
      await nextTick();
      await nextTick();

      const popover = result.screen.getByRole("dialog") as HTMLElement;

      expect(popover).toHaveAttribute("data-entering", "true");
      expect(popover.getAnimations().length).toBeGreaterThan(0);

      await settled(popover);

      // Left in place, the entry styles would hold the popover at its start frame for good.
      expect(popover).not.toHaveAttribute("data-entering");

      result.unmount();
    });

    it("holds its position through the exit animation", async () => {
      const result = render();

      place(result);

      const popover = await open(result);
      const before = popover.getBoundingClientRect();

      press(document.body);
      await nextTick();
      await nextTick();

      expect(popover).toHaveAttribute("data-exiting", "true");

      // The position is measured, so losing it while the popover is still on screen drops it at
      // the viewport origin for the length of the animation.
      const during = popover.getBoundingClientRect();

      expect(during.left).toBeCloseTo(before.left, 0);
      expect(during.top).toBeCloseTo(before.top, 0);
      expect(popover).toHaveAttribute("data-placement");

      result.unmount();
    });

    it("stays in the DOM through its exit animation", async () => {
      const result = render();
      const popover = await open(result);

      press(document.body);
      await nextTick();

      // An exit animation is a contradiction on its own terms: the popover has to be gone, and it
      // has to still be there to animate.
      expect(popover).toHaveAttribute("data-exiting", "true");
      expect(popover.isConnected).toBe(true);

      await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
      // Two ticks: the exit is reported as finished one tick after the animation settles, and the
      // element leaves the DOM on the render that follows.
      await nextTick();
      await nextTick();

      expect(result.baseElement.querySelector('[data-slot="dropdown-popover"]')).toBeNull();

      result.unmount();
    });
  });

  /**
   * The rest of the suite opens the menu with a synthesised pointer sequence, which cannot see
   * this: a real press has to move the pointer onto the trigger first, and hovering re-renders
   * it. In vapor a re-render re-attaches every listener that arrived through `v-bind`, which both
   * put the responder's press behind the button's own and dropped it mid-dispatch — so the menu
   * opened under a synthetic press and never under a real one.
   */
  describe("real pointer input", () => {
    it("opens on a press from the pointer itself", async () => {
      const result = render();
      const trigger = result.getByRole("button", {name: "Menu"});

      await userEvent.click(trigger);
      await nextTick();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      await dismiss(result);
      result.unmount();
    });

    it("opens a custom trigger on a press from the pointer itself", async () => {
      const result = render({withCustomTrigger: true});
      const trigger = result.getByRole("button", {name: "Menu"});

      await userEvent.click(trigger);
      await nextTick();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(result.screen.getByRole("menu")).toBeInTheDocument();

      await dismiss(result);
      result.unmount();
    });

    it("keeps the button's own hover state alongside the responder's press", async () => {
      const result = render();
      const trigger = result.getByRole("button", {name: "Menu"});

      await userEvent.hover(trigger);
      await nextTick();

      expect(trigger).toHaveAttribute("data-hovered", "true");

      await userEvent.click(trigger);
      await nextTick();

      // A trigger looks pressed for as long as its menu is open.
      expect(trigger).toHaveAttribute("data-pressed", "true");

      await dismiss(result);
      result.unmount();
    });
  });

  describe("focus", () => {
    it("paints the focus ring on the item the keyboard landed on", async () => {
      const result = render();
      const popover = await open(result);

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      const item = document.activeElement as HTMLElement;

      expect(item).toHaveAttribute("data-focus-visible", "true");
      // The stylesheet paints the ring with a shadow and sets `outline-style: none`, so the
      // outline is not where the ring lives.
      expect(getComputedStyle(item).boxShadow).not.toBe("none");
      expect(getComputedStyle(item).outlineStyle).toBe("none");

      void popover;
      result.unmount();
    });

    it("keeps Tab inside the menu", async () => {
      const result = render();
      const popover = await open(result);

      await userEvent.keyboard("{Tab}");
      await nextTick();

      // The popover is rendered at the end of the document, so without containment Tab would land
      // on whatever happens to follow in the body.
      expect(popover.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
      await nextTick();

      expect(popover.contains(document.activeElement)).toBe(true);

      result.unmount();
    });

    it("gives focus back to the trigger when it closes", async () => {
      const result = render();
      const trigger = result.getByRole("button", {name: "Menu"});
      const popover = await open(result);

      await userEvent.keyboard("{Escape}");
      await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
      await nextTick();
      await nextTick();
      await nextTick();

      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });
  });

  describe("isolation", () => {
    it("blocks interaction with the page behind it", async () => {
      const result = render();

      await open(result);

      // `inert` is what makes the overlay modal in the only sense that matters: the page behind is
      // out of reach for the pointer, the keyboard and assistive technology alike.
      expect(result.container.inert).toBe(true);

      result.unmount();
    });

    it("holds the page still while it is open", async () => {
      const result = render();

      expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");

      const popover = await open(result);

      // The popover is positioned once, against where the trigger was; letting the page scroll
      // would leave it pointing at nothing.
      expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");

      await userEvent.keyboard("{Escape}");
      await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
      await nextTick();
      await nextTick();
      await nextTick();

      expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");

      result.unmount();
    });
  });

  describe("selection", () => {
    it("draws the checkmark on rather than revealing it", async () => {
      const result = render({
        items: [
          {id: "apple", label: "Apple"},
          {id: "banana", label: "Banana"},
        ],
        selectedKeys: ["apple"],
        selectionMode: "single",
        withIndicator: true,
      });

      await open(result);

      const mark = result.baseElement.querySelector<SVGElement>(
        '[data-slot="menu-item-indicator--checkmark"]',
      )!;

      // Only reachable through a real style resolution: the rule is nested under the item's
      // checked state, so it applies to the selected item and nothing else.
      expect(getComputedStyle(mark).transition).toContain("stroke-dashoffset");

      result.unmount();
    });

    it("indents an item to make room for its indicator", async () => {
      const plain = render();

      await open(plain);

      const withoutIndicator = getComputedStyle(
        plain.baseElement.querySelector('[data-slot="menu-item"]')!,
      ).paddingLeft;

      plain.unmount();

      const marked = render({selectionMode: "single", withIndicator: true});

      await open(marked);

      const withIndicator = getComputedStyle(
        marked.baseElement.querySelector('[data-slot="menu-item"]')!,
      ).paddingLeft;

      // The indicator is absolutely positioned, so the label would sit under it without this.
      expect(Number.parseFloat(withIndicator)).toBeGreaterThan(Number.parseFloat(withoutIndicator));

      marked.unmount();
    });
  });

  describe("submenus", () => {
    const openSubmenu = async (result: RenderResult) => {
      const trigger = result.screen.getByRole("menuitem", {name: "Share"});

      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowRight"}));
      await nextTick();
      await nextTick();
      await nextTick();

      const popovers = result.baseElement.querySelectorAll<HTMLElement>(
        '[data-slot="dropdown-popover"]',
      );

      await settled(popovers[1]!);

      return {popover: popovers[1]!, trigger};
    };

    it("opens beside the item that owns it", async () => {
      const result = render({withSubmenu: true});

      place(result);
      await open(result);

      const {popover, trigger} = await openSubmenu(result);
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();

      expect(popover).toHaveAttribute("data-placement", "right");
      // The main axis is floored to whole pixels, so the gap lands just under the offset asked for
      // rather than exactly on it.
      expect(popoverRect.left - triggerRect.right).toBeGreaterThan(7);
      expect(popoverRect.left - triggerRect.right).toBeLessThanOrEqual(8);
      // Aligned to the item's top edge, so the submenu reads as belonging to that row.
      expect(popoverRect.top).toBeCloseTo(triggerRect.top, 0);

      result.unmount();
    });

    it("is not clipped by the menu it was opened from", async () => {
      const result = render({withSubmenu: true});

      place(result);

      const menuPopover = await open(result);

      const {popover} = await openSubmenu(result);

      // The menu scrolls its own content, so a submenu rendered inside it would be cut off at the
      // edge. Rendered as a sibling instead, it can overhang.
      expect(menuPopover.contains(popover)).toBe(false);
      expect(popover.getBoundingClientRect().right).toBeGreaterThan(
        menuPopover.getBoundingClientRect().right,
      );

      result.unmount();
    });

    it("leaves the page behind the submenu interactive", async () => {
      const result = render({withSubmenu: true});

      await open(result);
      await openSubmenu(result);

      const menu = result.screen.getAllByRole("menu")[0]!;

      // A submenu is not modal: the menu that opened it is behind it and has to keep working.
      expect(menu.closest("[inert]")).toBeNull();

      result.unmount();
    });

    it("clears a path across the menu for a pointer aimed at the submenu", async () => {
      const result = render({withSubmenu: true});

      place(result);
      await open(result);

      const {trigger} = await openSubmenu(result);
      const menu = result.screen.getAllByRole("menu")[0]!;
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      // A diagonal aimed at the submenu, which opens level with the trigger and hangs below it.
      // Kept inside the menu, because that is the stretch where the items would otherwise take the
      // pointer; a pointer already past the menu's edge has nothing left to cross.
      const from = {x: triggerRect.left + 8, y: triggerRect.top + 2};
      const to = {x: menuRect.right - 2, y: menuRect.bottom - 2};

      for (let step = 0; step <= 3; step++) {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            ...POINTER,
            clientX: from.x + ((to.x - from.x) * step) / 3,
            clientY: from.y + ((to.y - from.y) * step) / 3,
          }),
        );

        // Pointer moves are throttled, so the steps have to be further apart than that to count.
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      // The corridor is only read from a real layout: measured before the popover is placed it
      // would point at the corner of the viewport, and the menu would keep taking the pointer.
      expect(menu.style.pointerEvents).toBe("none");

      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const result = render({withHeader: true, withSection: true});
      const popover = await open(result);

      await expectNoA11yViolations(popover);

      result.unmount();
    });

    it("has no axe violations with a selection", async () => {
      const result = render({
        selectedKeys: ["new-file"],
        selectionMode: "multiple",
        withIndicator: true,
      });
      const popover = await open(result);

      await expectNoA11yViolations(popover);

      result.unmount();
    });

    it("has no axe violations with a submenu open", async () => {
      const result = render({withSubmenu: true});

      await open(result);

      const trigger = result.screen.getByRole("menuitem", {name: "Share"});

      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowRight"}));
      await nextTick();
      await nextTick();
      await nextTick();

      await expectNoA11yViolations(
        result.baseElement.querySelector<HTMLElement>('[style*="display: contents"]')!,
      );

      result.unmount();
    });
  });
});
