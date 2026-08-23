import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {nextTick} from "vue";

import AlertDialogOverridesFixture from "./fixtures-overrides.vue";
import AlertDialogFixture from "./fixtures.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(AlertDialogFixture, {props});

  mounted.push(result);

  return result;
};

const renderOverrides = () => {
  const result = renderVapor(AlertDialogOverridesFixture);

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

const slots = (name: string) => [...document.body.querySelectorAll(`[data-slot="${name}"]`)];

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

describe("AlertDialog", () => {
  describe("structure", () => {
    it("renders nothing but the trigger while closed", () => {
      const result = render();

      expect(result.screen.getByRole("button", {name: "Delete account"})).toBeTruthy();
      expect(result.screen.queryByRole("alertdialog")).toBeNull();
      expect(slot("alert-dialog-backdrop")).toBeNull();

      result.unmount();
    });

    it("renders the dialog outside the app root", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // Teleported, so the app's own subtree cannot see it — which is why every query here goes
      // through the document rather than the container.
      expect(result.container.querySelector("[data-slot='alert-dialog-backdrop']")).toBeNull();
      expect(slot("alert-dialog-backdrop")).toBeTruthy();
      expect(slot("alert-dialog-container")).toBeTruthy();
      expect(result.screen.getByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("announces itself as an alert rather than a plain dialog", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const dialog = slot("alert-dialog-dialog")!;

      // The distinction is the whole component: an alert dialog interrupts, and a screen reader
      // treats the two roles differently.
      expect(dialog.getAttribute("role")).toBe("alertdialog");
      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("nests backdrop, container and dialog in that order", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const backdrop = slot("alert-dialog-backdrop")!;
      const container = slot("alert-dialog-container")!;
      const dialog = result.screen.getByRole("alertdialog");

      expect(backdrop.contains(container)).toBe(true);
      expect(container.contains(dialog)).toBe(true);
      expect(dialog.getAttribute("data-slot")).toBe("alert-dialog-dialog");

      result.unmount();
    });

    it("carries the block classes", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const expected: [string, string][] = [
        ["alert-dialog-backdrop", "alert-dialog__backdrop"],
        ["alert-dialog-container", "alert-dialog__container"],
        ["alert-dialog-dialog", "alert-dialog__dialog"],
      ];

      for (const [name, className] of expected) {
        expect(slot(name)!.classList.contains(className), name).toBe(true);
      }

      result.unmount();
    });

    it("renders into a caller's container", async () => {
      const portal = document.createElement("div");

      portal.id = "portal";
      document.body.appendChild(portal);

      const result = render({defaultOpen: true, portalContainer: portal});

      await settle();

      expect(portal.querySelector("[data-slot='alert-dialog-backdrop']")).toBeTruthy();

      result.unmount();
      portal.remove();
    });
  });

  describe("opening", () => {
    it("opens on a press of the trigger", async () => {
      const result = render();

      press(result.screen.getByRole("button", {name: "Delete account"}));
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("reports the trigger's relationship to the dialog", async () => {
      const result = render();
      const trigger = result.container.querySelector("[data-slot='button']")!;

      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      press(trigger);
      await settle();

      const dialog = result.screen.getByRole("alertdialog");

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(dialog.id).toBeTruthy();
      expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);

      result.unmount();
    });

    it("exposes a focusable button role for markup that is not pressable", async () => {
      const result = render({withCustomTrigger: true});
      const trigger = slot("alert-dialog-trigger")!;

      expect(trigger.getAttribute("role")).toBe("button");
      expect(trigger.getAttribute("tabindex")).toBe("0");
      expect(trigger.classList.contains("alert-dialog__trigger")).toBe(true);

      press(trigger);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("dismissal", () => {
    it("ignores Escape", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // The opposite default to a modal's, and the reason the component exists: the dialog is
      // asking a question, and Escape would answer it by accident.
      key(result.screen.getByRole("alertdialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("ignores a press outside the dialog", async () => {
      const result = render({defaultOpen: true});

      await settle();

      pressOutside(slot("alert-dialog-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("opens both routes from bare attributes", async () => {
      const result = renderOverrides();

      await settle();

      // Written the way a caller writes them: `is-dismissable` with no value at all, which Vue
      // casts from an empty string. A default applied with `?? false` would swallow that cast and
      // leave the dialog refusing to be dismissed while the markup says otherwise.
      pressOutside(slot("alert-dialog-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeNull();

      result.unmount();
    });

    it("lets Escape through when the caller turns the block off", async () => {
      const result = renderOverrides();

      await settle();

      key(result.screen.getByRole("alertdialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeNull();

      result.unmount();
    });

    it("closes on a press outside once dismissing is asked for", async () => {
      const result = render({defaultOpen: true, isDismissable: true});

      await settle();

      pressOutside(slot("alert-dialog-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeNull();

      result.unmount();
    });

    it("ignores a press inside the dialog", async () => {
      const result = render({defaultOpen: true, isDismissable: true});

      await settle();

      pressOutside(result.screen.getByRole("alertdialog"));
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("needs the click as well as the pointerdown", async () => {
      const result = render({defaultOpen: true, isDismissable: true});

      await settle();

      // Pressing down outside and releasing inside is a drag, not a dismissal.
      slot("alert-dialog-backdrop")!.dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("leaves an element the caller exempted alone", async () => {
      const result = render({defaultOpen: true, isDismissable: true, keepOpenFor: "outside"});

      await settle();

      pressOutside(result.container.querySelector("#outside")!);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });

    it("renders no dismiss button for a screen reader by default", async () => {
      const fixed = render({defaultOpen: true});

      await settle();

      // Nothing to announce a way out of, because there is no way out but the buttons: offering
      // one would let a VoiceOver user leave the question unanswered.
      expect(
        slot("alert-dialog-container")!.querySelector("button[aria-label='Dismiss']"),
      ).toBeNull();

      fixed.unmount();

      const dismissable = render({defaultOpen: true, isDismissable: true});

      await settle();

      const inside = slot("alert-dialog-container")!.querySelector("button[aria-label='Dismiss']");

      expect(inside).toBeTruthy();
      expect(inside!.getAttribute("tabindex")).toBe("-1");

      dismissable.unmount();
    });

    it("closes from the dialog's own slot", async () => {
      const result = render({defaultOpen: true});

      await settle();

      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeNull();

      result.unmount();
    });
  });

  describe("focus", () => {
    it("focuses the dialog when it opens", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const dialog = result.screen.getByRole("alertdialog");

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

      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      // Not merely somewhere sensible: the dialog is rendered at the end of the document, so
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

      press(result.screen.getByTestId("close-from-slot"));
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

      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      expect(changes).toEqual([false]);
      // Held open by the caller, so it stays.
      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("parts", () => {
    it("renders every part with its own slot and class", async () => {
      const result = render({defaultOpen: true, withCloseTrigger: true, withIcon: true});

      await settle();

      const expected: [string, string][] = [
        ["alert-dialog-header", "alert-dialog__header"],
        ["alert-dialog-icon", "alert-dialog__icon"],
        ["alert-dialog-heading", "alert-dialog__heading"],
        ["alert-dialog-body", "alert-dialog__body"],
        ["alert-dialog-footer", "alert-dialog__footer"],
        ["alert-dialog-close-trigger", "alert-dialog__close-trigger"],
      ];

      for (const [name, className] of expected) {
        const element = slot(name);

        expect(element, name).toBeTruthy();
        expect(element!.classList.contains(className), name).toBe(true);
      }

      result.unmount();
    });

    it("renders the heading two levels down", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(slot("alert-dialog-heading")!.tagName).toBe("H2");

      result.unmount();
    });

    it("carries the size modifier the container decided", async () => {
      for (const size of ["xs", "sm", "md", "lg", "cover"] as const) {
        const result = render({defaultOpen: true, size});

        await settle();

        expect(
          slot("alert-dialog-dialog")!.classList.contains(`alert-dialog__dialog--${size}`),
          size,
        ).toBe(true);

        result.unmount();
        await settle();
      }
    });

    it("defaults to the medium size", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(slot("alert-dialog-dialog")!.classList.contains("alert-dialog__dialog--md")).toBe(
        true,
      );

      result.unmount();
    });

    it("carries the backdrop variant the backdrop decided", async () => {
      for (const variant of ["opaque", "blur", "transparent"] as const) {
        const result = render({defaultOpen: true, variant});

        await settle();

        expect(
          slot("alert-dialog-backdrop")!.classList.contains(`alert-dialog__backdrop--${variant}`),
          variant,
        ).toBe(true);

        result.unmount();
        await settle();
      }
    });

    it("defaults to an opaque backdrop", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(
        slot("alert-dialog-backdrop")!.classList.contains("alert-dialog__backdrop--opaque"),
      ).toBe(true);

      result.unmount();
    });

    it("reports the placement on the container and the dialog", async () => {
      const result = render({defaultOpen: true, placement: "top"});

      await settle();

      // Both, because the container animates from it and the dialog takes its margins from it.
      expect(slot("alert-dialog-container")!.getAttribute("data-placement")).toBe("top");
      expect(slot("alert-dialog-dialog")!.getAttribute("data-placement")).toBe("top");

      result.unmount();
    });

    it("places automatically by default", async () => {
      const result = render({defaultOpen: true});

      await settle();

      expect(slot("alert-dialog-container")!.getAttribute("data-placement")).toBe("auto");
      expect(slot("alert-dialog-dialog")!.getAttribute("data-placement")).toBe("auto");

      result.unmount();
    });
  });

  describe("the icon", () => {
    it("warns by default", async () => {
      const result = render({defaultOpen: true, withIcon: true});

      await settle();

      const icon = slot("alert-dialog-icon")!;

      expect(icon.classList.contains("alert-dialog__icon--danger")).toBe(true);
      expect(icon.querySelector("[data-slot='alert-dialog-default-icon']")).toBeTruthy();

      result.unmount();
    });

    it("takes its colours from its own status", async () => {
      for (const status of ["default", "accent", "success", "warning", "danger"] as const) {
        const result = render({defaultOpen: true, iconStatus: status, withIcon: true});

        await settle();

        expect(
          slot("alert-dialog-icon")!.classList.contains(`alert-dialog__icon--${status}`),
          status,
        ).toBe(true);

        result.unmount();
        await settle();
      }
    });

    it("reads its status per icon rather than from the dialog", async () => {
      const result = render({
        defaultOpen: true,
        iconStatus: "warning",
        secondIconStatus: "success",
        withIcon: true,
        withSecondIcon: true,
      });

      await settle();

      const [first, second] = slots("alert-dialog-icon");

      // Two icons in one dialog can say different things, which is only true because the status
      // never reaches the shared context.
      expect(first!.classList.contains("alert-dialog__icon--warning")).toBe(true);
      expect(second!.classList.contains("alert-dialog__icon--success")).toBe(true);
      expect(first!.classList.contains("alert-dialog__icon--success")).toBe(false);

      result.unmount();
    });

    it("draws a different glyph for each status", async () => {
      const seen = new Map<string, string>();

      for (const status of ["default", "accent", "success", "warning", "danger"] as const) {
        const result = render({defaultOpen: true, iconStatus: status, withIcon: true});

        await settle();

        const glyph = slot("alert-dialog-default-icon")!;

        expect(glyph.getAttribute("aria-hidden"), status).toBe("true");
        seen.set(status, glyph.querySelector("path")!.getAttribute("d")!);

        result.unmount();
        await settle();
      }

      // `accent` and `default` share the informational glyph: the status changes what the icon
      // means, not what it depicts.
      expect(seen.get("accent")).toBe(seen.get("default"));
      expect(new Set(seen.values()).size).toBe(4);
    });

    it("gives way to a caller's own icon", async () => {
      const result = render({defaultOpen: true, withCustomIcon: true, withIcon: true});

      await settle();

      expect(result.screen.getByTestId("custom-icon")).toBeTruthy();
      expect(slot("alert-dialog-default-icon")).toBeNull();

      result.unmount();
    });
  });

  describe("labelling", () => {
    it("names the dialog by its heading", async () => {
      const result = render({defaultOpen: true});

      await settle();

      const heading = slot("alert-dialog-heading")!;

      expect(heading.id).toBeTruthy();
      expect(result.screen.getByRole("alertdialog").getAttribute("aria-labelledby")).toBe(
        heading.id,
      );

      result.unmount();
    });

    it("names the dialog by its trigger when nothing inside does", async () => {
      const result = render({defaultOpen: true, withoutHeading: true});

      await settle();

      // An idref to an element that is not rendered is worse than none.
      expect(slot("alert-dialog-heading")).toBeNull();
      expect(result.screen.getByRole("alertdialog").getAttribute("aria-labelledby")).toBe(
        result.container.querySelector("[data-slot='button']")!.id,
      );

      result.unmount();
    });

    it("describes the dialog with nothing", async () => {
      const result = render({defaultOpen: true});

      await settle();

      // Deliberate parity, not an oversight: the body is a plain box rather than a part that
      // announces itself as the description, and React resolves the same way. Pinned here so
      // adding one later is a decision rather than a drift between the two frameworks.
      expect(result.screen.getByRole("alertdialog").hasAttribute("aria-describedby")).toBe(false);

      result.unmount();
    });
  });

  describe("closing", () => {
    it("names the close trigger without being told to", async () => {
      const result = render({defaultOpen: true, withCloseTrigger: true});

      await settle();

      // The close button names itself, and nothing above it may quietly erase that: an icon-only
      // button with no accessible name is unusable with a screen reader.
      expect(slot("alert-dialog-close-trigger")!.getAttribute("aria-label")).toBe("Close");

      result.unmount();
    });

    it("lets a caller rename the close trigger", async () => {
      const result = render({
        closeTriggerLabel: "Not now",
        defaultOpen: true,
        withCloseTrigger: true,
      });

      await settle();

      expect(slot("alert-dialog-close-trigger")!.getAttribute("aria-label")).toBe("Not now");

      result.unmount();
    });

    it("closes from the close trigger", async () => {
      const result = render({defaultOpen: true, withCloseTrigger: true});

      await settle();

      press(slot("alert-dialog-close-trigger")!);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeNull();

      result.unmount();
    });

    it("closes from a wrapped button and still runs its own handler", async () => {
      const result = render({defaultOpen: true, withCloseWrapper: true});

      await settle();

      expect(result.screen.getByTestId("removed").textContent).toBe("kept");

      press(result.screen.getByRole("button", {name: "Delete"}));
      await settle();

      // Both, in that order: the wrapper's close is chained ahead of the button's own handler, the
      // same way React merges a context's props before the element's.
      expect(result.screen.queryByRole("alertdialog")).toBeNull();
      expect(result.screen.getByTestId("removed").textContent).toBe("removed");

      result.unmount();
    });

    it("leaves an unmarked button inside alone", async () => {
      const result = render({defaultOpen: true, withInsideButton: true});

      await settle();

      const inside = result.screen.getByRole("button", {name: "Learn more"});

      // Opt-in, and it matters more here than for a modal: Cancel and Confirm sit side by side in
      // the footer, and only one of them is an answer.
      expect(inside.getAttribute("aria-expanded")).toBeNull();
      expect(inside.getAttribute("aria-controls")).toBeNull();

      press(inside);
      await settle();

      expect(result.screen.queryByRole("alertdialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("animation state", () => {
    it("reports entry as a string rather than an empty attribute", async () => {
      const result = render({defaultOpen: true});

      await settle();

      for (const name of ["alert-dialog-backdrop", "alert-dialog-container"]) {
        const value = slot(name)!.getAttribute("data-entering");

        // The stylesheet matches `[data-entering="true"]`, so an empty attribute would apply
        // nothing while still looking present in a snapshot.
        expect(value === null || value === "true").toBe(true);
      }

      result.unmount();
    });
  });
});
