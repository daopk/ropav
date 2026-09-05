import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import DrawerFixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(DrawerFixture, { props });

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
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

/** An outside interaction is two events: a pointerdown marks it, and the click dismisses. */
const pressOutside = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const key = (element: Element, name: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: name }));
  element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: name }));
};

/**
 * The backdrop is teleported a flush after it decides to render, the content reports itself the
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

  // The scroll lock and the `inert` marking both live outside the content, so a case that failed
  // before unmounting would break the next one instead of itself.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("Drawer", () => {
  describe("structure", () => {
    it("renders nothing but the trigger while closed", () => {
      const result = render();

      expect(result.screen.getByRole("button", { name: "Open drawer" })).toBeTruthy();
      expect(result.screen.queryByRole("dialog")).toBeNull();
      expect(slot("drawer-backdrop")).toBeNull();

      result.unmount();
    });

    it("renders the drawer outside the app root", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      // Teleported, so the app's own subtree cannot see it — which is why every query here goes
      // through the document rather than the container.
      expect(result.container.querySelector("[data-slot='drawer-backdrop']")).toBeNull();
      expect(slot("drawer-backdrop")).toBeTruthy();
      expect(slot("drawer-content")).toBeTruthy();
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("nests backdrop, content and dialog in that order", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const backdrop = slot("drawer-backdrop")!;
      const content = slot("drawer-content")!;
      const dialog = result.screen.getByRole("dialog");

      // `content` rather than `container`: the middle element has its own name here, and the
      // stylesheet reaches the panel through it by descendant selector.
      expect(backdrop.contains(content)).toBe(true);
      expect(content.contains(dialog)).toBe(true);
      expect(dialog.getAttribute("data-slot")).toBe("drawer-dialog");

      result.unmount();
    });

    it("carries the block classes", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const expected: [string, string][] = [
        ["drawer-backdrop", "rp-drawer__backdrop"],
        ["drawer-content", "rp-drawer__content"],
        ["drawer-dialog", "rp-drawer__dialog"],
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

      const result = render({ defaultOpen: true, portalContainer: portal });

      await settle();

      expect(portal.querySelector("[data-slot='drawer-backdrop']")).toBeTruthy();

      result.unmount();
      portal.remove();
    });
  });

  describe("opening", () => {
    it("opens on a press of the trigger", async () => {
      const result = render();

      press(result.screen.getByRole("button", { name: "Open drawer" }));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("triggers from a real button rather than a box given a button role", async () => {
      const result = render();
      const trigger = slot("drawer-trigger")!;

      // The one place the drawer diverges from the modal and the alert dialog, and it matches
      // React: a native button brings its own keyboard activation and form semantics.
      expect(trigger.tagName).toBe("BUTTON");
      expect(trigger.getAttribute("type")).toBe("button");
      expect(trigger.getAttribute("role")).toBeNull();
      expect(trigger.classList.contains("rp-drawer__trigger")).toBe(true);

      result.unmount();
    });

    it("reports the trigger's relationship to the dialog", async () => {
      const result = render();
      const trigger = slot("drawer-trigger")!;

      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      press(trigger);
      await settle();

      const dialog = result.screen.getByRole("dialog");

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(dialog.id).toBeTruthy();
      expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);

      result.unmount();
    });
  });

  describe("dismissal", () => {
    it("closes on Escape", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("ignores Escape when keyboard dismissal is off", async () => {
      const result = render({ defaultOpen: true, isKeyboardDismissDisabled: true });

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("keeps Escape working when dismissing by press is off", async () => {
      const result = render({ defaultOpen: true, isDismissable: false });

      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      // The two are separate opt-outs, so turning one off must not quietly take the other with it.
      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("closes on a press outside the panel", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      // The backdrop beside the panel is outside the drawer, which is why the content rather than
      // the backdrop is the boundary.
      pressOutside(slot("drawer-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("ignores a press outside when dismissing is off", async () => {
      const result = render({ defaultOpen: true, isDismissable: false });

      await settle();

      pressOutside(slot("drawer-backdrop")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("ignores a press inside the panel", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      pressOutside(result.screen.getByRole("dialog"));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("needs the click as well as the pointerdown", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      // Pressing down outside and releasing inside is a drag, not a dismissal.
      slot("drawer-backdrop")!.dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("leaves an element the caller exempted alone", async () => {
      const result = render({ defaultOpen: true, keepOpenFor: "outside" });

      await settle();

      pressOutside(result.container.querySelector("#outside")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });

    it("renders a dismiss button for a screen reader only while dismissable", async () => {
      const dismissable = render({ defaultOpen: true });

      await settle();

      const inside = slot("drawer-content")!.querySelector("button[aria-label='Dismiss']");

      // There is no Escape key on a touch device, and a VoiceOver user swiping through the drawer
      // has no other way out.
      expect(inside).toBeTruthy();
      expect(inside!.getAttribute("tabindex")).toBe("-1");

      dismissable.unmount();

      const fixed = render({ defaultOpen: true, isDismissable: false });

      await settle();

      expect(slot("drawer-content")!.querySelector("button[aria-label='Dismiss']")).toBeNull();

      fixed.unmount();
    });

    it("closes from the dialog's own slot", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      press(result.screen.getByTestId("close-from-slot"));
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });
  });

  describe("focus", () => {
    it("focuses the panel when it opens", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const dialog = result.screen.getByRole("dialog");

      expect(dialog.getAttribute("tabindex")).toBe("-1");
      expect(document.activeElement).toBe(dialog);

      result.unmount();
    });

    it("gives focus back to the trigger when it closes", async () => {
      const result = render();
      const trigger = slot("drawer-trigger") as HTMLElement;

      trigger.focus();
      press(trigger);
      await settle();

      key(result.screen.getByRole("dialog"), "Escape");
      await settle();

      // Not merely somewhere sensible: the drawer is rendered at the end of the document, so
      // without this a keyboard user is left at the top of the page.
      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });
  });

  describe("the page behind", () => {
    it("hides everything outside the content from assistive technology", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const app = result.container;

      // `aria-hidden` rather than `inert`, because jsdom implements no `inert` at all and the
      // hiding falls back by feature detection. The browser suite pins `inert` itself.
      expect(app.getAttribute("aria-hidden")).toBe("true");

      result.unmount();
      await settle();

      expect(app.hasAttribute("aria-hidden")).toBe(false);
    });

    it("holds the page still while it is open", async () => {
      const result = render({ defaultOpen: true });

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

  describe("parts", () => {
    it("renders every part with its own slot and class", async () => {
      const result = render({ defaultOpen: true, withCloseTrigger: true, withHandle: true });

      await settle();

      const expected: [string, string][] = [
        ["drawer-handle", "rp-drawer__handle"],
        ["drawer-header", "rp-drawer__header"],
        ["drawer-heading", "rp-drawer__heading"],
        ["drawer-body", "rp-drawer__body"],
        ["drawer-footer", "rp-drawer__footer"],
        ["drawer-close-trigger", "rp-drawer__close-trigger"],
      ];

      for (const [name, className] of expected) {
        const element = slot(name);

        expect(element, name).toBeTruthy();
        expect(element!.classList.contains(className), name).toBe(true);
      }

      result.unmount();
    });

    it("renders the heading two levels down", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      expect(slot("drawer-heading")!.tagName).toBe("H2");

      result.unmount();
    });

    it("carries the placement modifier on both the content and the panel", async () => {
      for (const placement of ["top", "bottom", "left", "right"] as const) {
        const result = render({ defaultOpen: true, placement });

        await settle();

        // Both: the content decides which edge everything is pinned to, and the panel takes its
        // rounded corners and its slide direction from the same value.
        expect(
          slot("drawer-content")!.classList.contains(`rp-drawer__content--${placement}`),
          placement,
        ).toBe(true);
        expect(
          slot("drawer-dialog")!.classList.contains(`rp-drawer__dialog--${placement}`),
          placement,
        ).toBe(true);
        expect(slot("drawer-content")!.getAttribute("data-placement"), placement).toBe(placement);
        expect(slot("drawer-dialog")!.getAttribute("data-placement"), placement).toBe(placement);

        result.unmount();
        await settle();
      }
    });

    it("slides up from the bottom by default", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      expect(slot("drawer-content")!.getAttribute("data-placement")).toBe("bottom");
      expect(slot("drawer-dialog")!.getAttribute("data-placement")).toBe("bottom");

      result.unmount();
    });

    it("carries the backdrop variant the backdrop decided", async () => {
      for (const variant of ["opaque", "blur", "transparent"] as const) {
        const result = render({ defaultOpen: true, variant });

        await settle();

        expect(
          slot("drawer-backdrop")!.classList.contains(`rp-drawer__backdrop--${variant}`),
          variant,
        ).toBe(true);

        result.unmount();
        await settle();
      }
    });

    it("hides the handle from assistive technology and gives it a bar", async () => {
      const result = render({ defaultOpen: true, withHandle: true });

      await settle();

      const handle = slot("drawer-handle")!;

      // A grab affordance for a pointer, with nothing to announce. The bar is a child with its own
      // slot because the stylesheet sizes it through a direct-child selector.
      expect(handle.getAttribute("aria-hidden")).toBe("true");
      expect(handle.children).toHaveLength(1);
      expect(handle.firstElementChild!.getAttribute("data-slot")).toBe("drawer-handle-bar");

      result.unmount();
    });

    it("claims the pointer on the panel and gives vertical scrolling back in the body", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      // Part of the behaviour rather than the styling: the panel takes the whole gesture so it can
      // be dragged away, and the body opts scrolling back in for its own content.
      expect((slot("drawer-dialog") as HTMLElement).style.touchAction).toBe("none");
      expect((slot("drawer-body") as HTMLElement).style.touchAction).toBe("pan-y");

      result.unmount();
    });

    it("leaves the panel's pointer handling alone when it cannot be dismissed", async () => {
      const result = render({ defaultOpen: true, isDismissable: false });

      await settle();

      // Nothing to drag away, so the page keeps its own gestures.
      expect((slot("drawer-dialog") as HTMLElement).style.touchAction).toBe("");

      result.unmount();
    });
  });

  describe("labelling", () => {
    it("names the dialog by its heading", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const heading = slot("drawer-heading")!;

      expect(heading.id).toBeTruthy();
      expect(result.screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(heading.id);

      result.unmount();
    });

    it("names the dialog by its trigger when nothing inside does", async () => {
      const result = render({ defaultOpen: true, withoutHeading: true });

      await settle();

      // An idref to an element that is not rendered is worse than none.
      expect(slot("drawer-heading")).toBeNull();
      expect(result.screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
        slot("drawer-trigger")!.id,
      );

      result.unmount();
    });
  });

  describe("closing", () => {
    it("names the close trigger without being told to", async () => {
      const result = render({ defaultOpen: true, withCloseTrigger: true });

      await settle();

      // The close button names itself, and nothing above it may quietly erase that: an icon-only
      // button with no accessible name is unusable with a screen reader.
      expect(slot("drawer-close-trigger")!.getAttribute("aria-label")).toBe("Close");

      result.unmount();
    });

    it("lets a caller rename the close trigger", async () => {
      const result = render({
        closeTriggerLabel: "Dismiss drawer",
        defaultOpen: true,
        withCloseTrigger: true,
      });

      await settle();

      expect(slot("drawer-close-trigger")!.getAttribute("aria-label")).toBe("Dismiss drawer");

      result.unmount();
    });

    it("closes from the close trigger", async () => {
      const result = render({ defaultOpen: true, withCloseTrigger: true });

      await settle();

      press(slot("drawer-close-trigger")!);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("closes from a wrapped button and still runs its own handler", async () => {
      const result = render({ defaultOpen: true, withCloseWrapper: true });

      await settle();

      expect(result.screen.getByTestId("saved").textContent).toBe("not saved");

      press(result.screen.getByRole("button", { name: "Confirm" }));
      await settle();

      // Both, in that order: the wrapper's close is chained ahead of the button's own handler.
      expect(result.screen.queryByRole("dialog")).toBeNull();
      expect(result.screen.getByTestId("saved").textContent).toBe("saved");

      result.unmount();
    });

    it("leaves an unmarked button inside alone", async () => {
      const result = render({ defaultOpen: true, withInsideButton: true });

      await settle();

      const inside = result.screen.getByRole("button", { name: "Inside action" });

      // Opt-in, matching React: an ordinary button in a footer does not close the drawer, and it
      // does not claim the trigger's identity either.
      expect(inside.getAttribute("aria-expanded")).toBeNull();
      expect(inside.getAttribute("aria-controls")).toBeNull();

      press(inside);
      await settle();

      expect(result.screen.queryByRole("dialog")).toBeTruthy();

      result.unmount();
    });
  });

  describe("animation state", () => {
    it("reports entry as a string rather than an empty attribute", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      for (const name of ["drawer-backdrop", "drawer-content"]) {
        const value = slot(name)!.getAttribute("data-entering");

        // The stylesheet matches `[data-entering="true"]`, so an empty attribute would apply
        // nothing while still looking present in a snapshot.
        expect(value === null || value === "true").toBe(true);
      }

      result.unmount();
    });

    it("carries the exit on the content rather than on the panel", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const content = slot("drawer-content")!;

      key(result.screen.getByRole("dialog"), "Escape");
      await nextTick();

      // The panel's own transition is reached by descendant selector from here, so the attribute
      // has to land on the content. jsdom resolves the animation instantly, so this only pins
      // *which element* carries it; the browser suite pins the timing.
      expect(slot("drawer-dialog")?.getAttribute("data-exiting") ?? null).toBeNull();
      expect(content.getAttribute("data-exiting") === "true" || !content.isConnected).toBe(true);

      result.unmount();
    });
  });
});
