import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {nextTick} from "vue";

import ModalFixture from "./fixtures.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(ModalFixture, {props});

  mounted.push(result);

  return result;
};

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

const key = (element: Element, name: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: name}));
  element.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, key: name}));
};

/**
 * The backdrop is teleported a flush after it decides to render, the container reports itself the
 * flush after that, and the dialog claims its heading's id after that.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

/** What `usePreventScroll` writes, asserted the same way the composable's own suite asserts it. */
const isPageHeld = () => document.documentElement.style.overflow === "hidden";

afterEach(() => {
  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }

  // The scroll lock and the `inert` marking both live outside the container, so a case that failed
  // before unmounting would break the next one instead of itself.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("Modal", () => {
  describe("structure", () => {
    it("renders nothing but the trigger while closed", () => {
      const result = render();

      expect(result.screen.getByRole("button", {name: "Open modal"})).toBeTruthy();
      expect(result.screen.queryByRole("dialog")).toBeNull();
      expect(slot("modal-backdrop")).toBeNull();

      result.unmount();
    });

    it("renders the modal outside the app root", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // Teleported, so the app's own subtree cannot see it — which is why every query here goes
      // through the document rather than the container.
      expect(result.container.querySelector("[data-slot='modal-backdrop']")).toBeNull();
      expect(slot("modal-backdrop")).toBeTruthy();
      expect(slot("modal-container")).toBeTruthy();
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("nests backdrop, container and dialog in that order", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const backdrop = slot("modal-backdrop")!;
      const container = slot("modal-container")!;
      const dialog = result.screen.getByRole("dialog");

      expect(backdrop.contains(container)).toBe(true);
      expect(container.contains(dialog)).toBe(true);
      expect(dialog.getAttribute("data-slot")).toBe("modal-dialog");

      result.unmount();
    });

    it("carries the block classes", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(slot("modal-backdrop")!.classList.contains("modal__backdrop")).toBe(true);
      expect(slot("modal-container")!.classList.contains("modal__container")).toBe(true);
      expect(slot("modal-dialog")!.classList.contains("modal__dialog")).toBe(true);

      result.unmount();
    });

    it("renders into a caller's container", async () => {
      const portal = document.createElement("div");

      portal.id = "portal";
      document.body.appendChild(portal);

      const result = render({defaultOpen: true, portalContainer: portal});

      await settle();

      expect(portal.querySelector("[data-slot='modal-backdrop']")).toBeTruthy();

      result.unmount();
      portal.remove();
    });
  });

  describe("opening", () => {
    it("opens on a press of the trigger", async () => {
      const result = render();
      const trigger = result.screen.getByRole("button", {name: "Open modal"});

      press(trigger);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("reports the trigger's relationship to the dialog", async () => {
      const result = render();
      const trigger = result.container.querySelector("[data-slot='button']")!;

      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      press(trigger);
      await settle();

      const dialog = result.screen.getByRole("dialog");

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(dialog.id).toBeTruthy();
      expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);

      result.unmount();
    });

    it("names the dialog by its trigger when nothing inside does", async () => {
      const result = render();
      const trigger = result.container.querySelector("[data-slot='button']")!;

      press(trigger);
      await settle();

      // A dialog with no accessible name at all is the one outcome worth avoiding.
      expect(trigger.id).toBeTruthy();
      expect(result.screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(trigger.id);

      result.unmount();
    });

    it("exposes a focusable button role for markup that is not pressable", async () => {
      const result = render({withCustomTrigger: true});
      const trigger = slot("modal-trigger")!;

      expect(trigger.getAttribute("role")).toBe("button");
      expect(trigger.getAttribute("tabindex")).toBe("0");
      expect(trigger.classList.contains("modal__trigger")).toBe(true);

      press(trigger);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("dismissal", () => {
    it("closes on Escape", async () => {
      const result = render({defaultOpen: true});

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("keeps Escape working when dismissing by press is off", async () => {
      const result = render({defaultOpen: true, isDismissable: false});

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      // The two are separate opt-outs: React Aria gates them on different props, so turning one
      // off must not quietly take the other with it.
      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("ignores Escape when keyboard dismissal is off", async () => {
      const result = render({defaultOpen: true, isKeyboardDismissDisabled: true});

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("closes on a press outside the dialog", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // The backdrop beside the dialog is outside the modal, which is why the container rather
      // than the backdrop is the boundary.
      pressOutside(slot("modal-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("ignores a press outside when dismissing is off", async () => {
      const result = render({defaultOpen: true, isDismissable: false});

      await settle();

      pressOutside(slot("modal-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("ignores a press inside the dialog", async () => {
      const result = render({defaultOpen: true});

      await settle();

      pressOutside(result.screen.getByRole("dialog"));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("needs the click as well as the pointerdown", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // Pressing down outside and releasing inside is a drag, not a dismissal.
      slot("modal-backdrop")!.dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("leaves an element the caller exempted alone", async () => {
      const result = render({defaultOpen: true, keepOpenFor: "outside"});

      await settle();

      pressOutside(result.container.querySelector("#outside")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("renders a dismiss button for a screen reader only while dismissable", async () => {
      const dismissable = render({defaultOpen: true});

      await settle();

      const inside = slot("modal-container")!.querySelector("button[aria-label='Dismiss']");

      // There is no Escape key on a touch device, and a VoiceOver user swiping through the modal
      // has no other way out.
      expect(inside).toBeTruthy();
      expect(inside!.getAttribute("tabindex")).toBe("-1");

      dismissable.unmount();

      const fixed = render({defaultOpen: true, isDismissable: false});

      await settle();

      expect(slot("modal-container")!.querySelector("button[aria-label='Dismiss']")).toBeNull();

      fixed.unmount();
    });

    it("closes from the dialog's own slot", async () => {
      const result = render({defaultOpen: true});

      await settle();

      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });
  });

  describe("focus", () => {
    it("focuses the dialog when it opens", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const dialog = result.screen.getByRole("dialog");

      expect(dialog.getAttribute("tabindex")).toBe("-1");
      expect(document.activeElement).toBe(dialog);

      result.unmount();
    });

    it("gives focus back to the trigger when it closes", async () => {
      const result = render();
      const trigger = result.container.querySelector<HTMLElement>("[data-slot='button']")!;

      trigger.focus();
      press(trigger);
      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      // Not merely somewhere sensible: the modal is rendered at the end of the document, so
      // without this a keyboard user is left at the top of the page.
      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });
  });

  describe("the page behind", () => {
    it("hides everything outside the container from assistive technology", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const app = result.container;

      // `aria-hidden` rather than `inert`, because jsdom implements no `inert` at all and the
      // hiding falls back by feature detection. The browser suite pins `inert` itself, which is
      // the branch that also blocks pointers and focus.
      expect(app.getAttribute("aria-hidden")).toBe("true");

      result.unmount();
      await settle();

      expect(app.hasAttribute("aria-hidden")).toBe(false);
    });

    it("holds the page still while it is open", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(isPageHeld()).toBe(true);

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(isPageHeld()).toBe(false);

      result.unmount();
    });
  });

  describe("controlled", () => {
    it("reports the change rather than closing itself", async () => {
      const changes: boolean[] = [];
      const result = render({
        isOpen: true,
        onOpenChange: (isOpen: boolean) => changes.push(isOpen),
      });

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(changes).toEqual([false]);
      // Held open by the caller, so it stays.
      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("animation state", () => {
    it("reports entry as a string rather than an empty attribute", async () => {
      const result = render({defaultOpen: true});

      await settle();

      for (const name of ["modal-backdrop", "modal-container"]) {
        const value = slot(name)!.getAttribute("data-entering");

        // The stylesheet matches `[data-entering="true"]`, so an empty attribute would apply
        // nothing while still looking present in a snapshot.
        expect(value === null || value === "true").toBe(true);
      }

      result.unmount();
    });
  });
});
