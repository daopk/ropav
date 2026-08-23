import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import PopoverFixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(PopoverFixture, {props});

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

/** An outside interaction is two events: a pointerdown marks it, and the click dismisses. */
const pressOutside = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

/** Focus leaving `element` for `relatedTarget`, which is what `focusout` reports. */
const blurTo = (element: Element, relatedTarget: Element | null) =>
  element.dispatchEvent(new FocusEvent("focusout", {bubbles: true, relatedTarget}));

const key = (element: Element, name: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: name}));
  element.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: name}));
};

/**
 * The container is teleported a flush after the popover decides to render, and the dialog inside
 * claims its heading's id a flush after that.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

describe("Popover", () => {
  describe("structure", () => {
    it("renders nothing but the trigger while closed", () => {
      const result = render();

      expect(result.screen.getByRole("button", {name: "Open popover"})).toBeTruthy();
      expect(result.screen.queryByRole("dialog")).toBeNull();
      expect(document.body.querySelector(".popover")).toBeNull();

      result.unmount();
    });

    it("renders the popover outside the app root", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const popover = document.body.querySelector(".popover");

      expect(popover).toBeTruthy();
      // Teleported, so the app's own subtree cannot see it — which is why every query here goes
      // through the document rather than the container.
      expect(result.container.contains(popover)).toBe(false);
      expect(popover?.parentElement?.getAttribute("style")).toBe("display: contents;");

      result.unmount();
    });

    it("exposes the compound parts", async () => {
      const result = render({defaultOpen: true, withArrow: true});

      await settle();

      expect(slot("popover-dialog")).toBeTruthy();
      expect(slot("popover-overlay-arrow-group")).toBeTruthy();
      expect(result.screen.getByRole("heading", {name: "Popover heading"})).toBeTruthy();
      expect(result.screen.getByText("Popover body")).toBeTruthy();

      result.unmount();
    });

    it("applies the block and element classes", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(document.body.querySelector(".popover")).toBeTruthy();
      expect(slot("popover-dialog")?.className).toContain("popover__dialog");
      expect(result.screen.getByRole("heading").className).toContain("popover__heading");

      result.unmount();
    });

    it("renders a way out for assistive technology at both ends", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // Two, so a screen reader reaches one whichever way it is swiping through the overlay.
      expect(document.body.querySelectorAll('button[aria-label="Dismiss"]')).toHaveLength(2);

      result.unmount();
    });

    it("renders one way out when the page behind stays live", async () => {
      const result = render({defaultOpen: true, isNonModal: true});

      await settle();

      // The leading one exists to be found on the way *into* a modal overlay, and a non-modal
      // one is not something you are inside.
      expect(document.body.querySelectorAll('button[aria-label="Dismiss"]')).toHaveLength(1);

      result.unmount();
    });

    it("removes the popover once it closes", async () => {
      const result = render({defaultOpen: true});

      await settle();
      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(document.body.querySelector(".popover")).toBeNull();

      result.unmount();
    });
  });

  describe("the dialog role", () => {
    it("leaves the role to the dialog inside it", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const popover = document.body.querySelector(".popover")!;
      const dialog = result.screen.getByRole("dialog");

      // Two elements claiming `role="dialog"`, one inside the other, is not something assistive
      // technology can make sense of.
      expect(popover.hasAttribute("role")).toBe(false);
      expect(popover.hasAttribute("tabindex")).toBe(false);
      expect(popover.hasAttribute("id")).toBe(false);
      expect(dialog.getAttribute("data-slot")).toBe("popover-dialog");
      expect(dialog.tagName).toBe("SECTION");

      result.unmount();
    });

    it("takes the role itself when nothing inside is a dialog", async () => {
      const result = render({defaultOpen: true, withoutDialog: true});

      await settle();

      const popover = document.body.querySelector(".popover")!;

      expect(popover.getAttribute("role")).toBe("dialog");
      expect(popover.getAttribute("tabindex")).toBe("-1");
      expect(popover.getAttribute("id")).toBeTruthy();

      result.unmount();
    });

    it("hands the id to whichever element is the dialog", async () => {
      const withDialog = render({defaultOpen: true});

      await settle();

      const trigger = withDialog.container.querySelector('[data-slot="button"]')!;
      const dialog = withDialog.screen.getByRole("dialog");

      expect(trigger.getAttribute("aria-controls")).toBe(dialog.getAttribute("id"));
      // Only one element carries it, so nothing in the tree is named twice.
      expect(document.querySelectorAll(`[id="${dialog.getAttribute("id")}"]`)).toHaveLength(1);

      withDialog.unmount();
    });
  });

  describe("naming", () => {
    it("names the dialog by its heading", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const dialog = result.screen.getByRole("dialog");
      const heading = result.screen.getByRole("heading", {name: "Popover heading"});

      expect(dialog.getAttribute("aria-labelledby")).toBe(heading.getAttribute("id"));

      result.unmount();
    });

    it("falls back to the trigger when there is no heading", async () => {
      const result = render({defaultOpen: true, withoutHeading: true});

      await settle();

      const dialog = result.screen.getByRole("dialog");
      const trigger = result.container.querySelector('[data-slot="button"]')!;

      // A dialog with no accessible name at all is the outcome worth avoiding.
      expect(dialog.getAttribute("aria-labelledby")).toBe(trigger.getAttribute("id"));

      result.unmount();
    });

    it("renders the heading one level below the page inside a dialog", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(result.screen.getByRole("heading").tagName).toBe("H2");

      result.unmount();
    });

    it("supports overriding the heading level", async () => {
      const result = render({defaultOpen: true, headingLevel: 4});

      await settle();

      expect(result.screen.getByRole("heading").tagName).toBe("H4");

      result.unmount();
    });
  });

  describe("the trigger", () => {
    it("wires a bare button as the trigger", async () => {
      const result = render();
      const trigger = result.getByRole("button", {name: "Open popover"});

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.hasAttribute("aria-controls")).toBe(false);
      // ARIA 1.1 allows `aria-haspopup="dialog"`, but screen readers announce most values as
      // "menu", so nothing is said at all.
      expect(trigger.hasAttribute("aria-haspopup")).toBe(false);

      press(trigger);
      await settle();

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(trigger.getAttribute("aria-controls")).toBeTruthy();

      result.unmount();
    });

    it("makes markup that is not pressable into a trigger", async () => {
      const result = render({withCustomTrigger: true});
      const trigger = result.getByRole("button", {name: "Actions"});

      expect(trigger.tagName).toBe("DIV");
      expect(trigger.getAttribute("data-slot")).toBe("popover-trigger");
      expect(trigger.className).toContain("popover__trigger");
      // A `div` is not focusable on its own, and the popover has to open by keyboard too.
      expect(trigger.getAttribute("tabindex")).toBe("0");

      press(trigger);
      await settle();

      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("reads as pressed for as long as the popover is open", async () => {
      const result = render({withCustomTrigger: true});
      const trigger = result.getByRole("button", {name: "Actions"});

      press(trigger);
      await settle();

      expect(trigger.getAttribute("data-pressed")).toBe("true");

      result.unmount();
    });

    it("leaves a button inside the popover alone", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const popover = document.body.querySelector(".popover")!;
      const inside = popover.querySelector('[data-slot="button"]')!;

      // The trigger hands its press down through a context, and a context reaches every
      // descendant — so the popover clears it, or every button inside would toggle the popover.
      expect(inside.hasAttribute("aria-expanded")).toBe(false);
      expect(inside.hasAttribute("aria-controls")).toBe(false);

      press(inside);
      await settle();

      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("dismissal", () => {
    it("closes on Escape", async () => {
      const onOpenChange = vi.fn();
      const result = render({defaultOpen: true, onOpenChange});

      await settle();
      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("supports blocking Escape", async () => {
      const onOpenChange = vi.fn();
      // The bare attribute form, because a prop typed through an imported union compiles without
      // a `type` and Vue then never casts it — `:is-...="true"` would pass either way.
      const result = renderVapor(PopoverFixture, {
        props: {defaultOpen: true, isKeyboardDismissDisabled: true, onOpenChange},
      });

      await settle();
      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("closes on an interaction outside it", async () => {
      const result = render({defaultOpen: true});

      await settle();
      pressOutside(result.container.querySelector("#outside")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("stays open for an interaction inside it", async () => {
      const result = render({defaultOpen: true});

      await settle();
      pressOutside(document.body.querySelector(".popover p")!);
      await settle();

      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("supports filtering which outside interactions dismiss it", async () => {
      const result = render({defaultOpen: true, keepOpenFor: "outside"});

      await settle();
      pressOutside(result.container.querySelector("#outside")!);
      await settle();

      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    /*
     * A popover that leaves the page live is not dismissable by a press outside, so focus leaving
     * is the only pointer path out of it. React Aria passes `shouldCloseOnBlur: true` for every
     * popover, modal or not; only a shape that lets focus out can observe it.
     *
     * That shape is non-modal *and* without a dialog inside: `Popover.Dialog` asks the popover to
     * contain focus, and a modal popover is the dialog itself and contains it too.
     */
    const LEAVABLE = {defaultOpen: true, isNonModal: true, withoutDialog: true} as const;

    const bare = (name: "first" | "second") =>
      document.body.querySelector<HTMLElement>(`[data-testid="bare-${name}"]`)!;

    it("closes a popover focus can leave once focus reaches something outside it", async () => {
      const onOpenChange = vi.fn();
      const result = render({...LEAVABLE, onOpenChange});

      await settle();
      blurTo(bare("first"), result.container.querySelector("#outside")!);
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(document.body.querySelector(".popover")).toBeNull();

      result.unmount();
    });

    it("stays open when focus moves within it", async () => {
      const result = render(LEAVABLE);

      await settle();
      blurTo(bare("first"), bare("second"));
      await settle();

      expect(document.body.querySelector(".popover")).toBeTruthy();

      result.unmount();
    });

    // Focus lost to nothing is the window going away or a tab switch, not the user leaving the
    // popover. React Aria returns on a null `relatedTarget` for the same reason: a press that
    // lands on the page is the outside-interaction path's business.
    it("stays open when focus is lost to nothing at all", async () => {
      const result = render(LEAVABLE);

      await settle();
      blurTo(bare("first"), null);
      await settle();

      expect(document.body.querySelector(".popover")).toBeTruthy();

      result.unmount();
    });

    it("supports filtering where focus may go without dismissing it", async () => {
      const result = render({...LEAVABLE, keepOpenFor: "outside"});

      await settle();
      blurTo(bare("first"), result.container.querySelector("#outside")!);
      await settle();

      expect(document.body.querySelector(".popover")).toBeTruthy();

      result.unmount();
    });

    it("closes from the scoped slot", async () => {
      const result = render({defaultOpen: true, withCloseFromSlot: true});

      await settle();
      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });
  });

  describe("isolation", () => {
    it("hides the rest of the page from assistive technology", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(result.container.hasAttribute("aria-hidden")).toBe(true);

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(result.container.hasAttribute("aria-hidden")).toBe(false);

      result.unmount();
    });

    it("leaves the page alone when it stays live", async () => {
      const result = render({defaultOpen: true, isNonModal: true});

      await settle();

      expect(result.container.hasAttribute("aria-hidden")).toBe(false);

      result.unmount();
    });
  });

  describe("the arrow", () => {
    it("renders the default shape with the slot the stylesheet keys on", async () => {
      const result = render({defaultOpen: true, withArrow: true});

      await settle();

      const group = slot("popover-overlay-arrow-group")!;
      const shape = slot("popover-overlay-arrow")!;

      expect(shape.tagName).toBe("svg");
      expect(group.contains(shape)).toBe(true);
      expect(group.getAttribute("data-placement")).toBe("bottom");
      expect(group.getAttribute("style")).toContain("position: absolute");

      result.unmount();
    });

    it("renders a supplied shape untouched", async () => {
      const result = render({defaultOpen: true, withArrow: true, withCustomArrow: true});

      await settle();

      const custom = document.body.querySelector('[data-testid="custom-arrow"]')!;

      expect(custom).toBeTruthy();
      // Vapor renders a slot as it is, so an arrow supplied through one has to carry the slot
      // itself. The default shape is the only one that gets it for free.
      expect(custom.hasAttribute("data-slot")).toBe(false);
      expect(slot("popover-overlay-arrow")).toBeNull();

      result.unmount();
    });
  });

  describe("state", () => {
    it("reports opening and closing", async () => {
      const onOpenChange = vi.fn();
      const result = render({onOpenChange});

      press(result.getByRole("button", {name: "Open popover"}));
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(true);

      result.unmount();
    });

    it("leaves a controlled popover to its owner", async () => {
      const onOpenChange = vi.fn();
      const result = render({isOpen: true, onOpenChange});

      await settle();
      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(false);
      // The owner said nothing, so the popover is still open.
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("reports where it ended up", async () => {
      const result = render({defaultOpen: true, placement: "top start", shouldFlip: false});

      await settle();

      expect(document.body.querySelector(".popover")?.getAttribute("data-placement")).toBe("top");

      result.unmount();
    });
  });
});
