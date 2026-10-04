import { describe, expect, it, vi } from "vitest";
import { nextTick, shallowRef } from "vue";

import { useDismissable } from "@/composables/use-dismissable";

import { withScope } from "../harness/scope";

const setup = (
  options: Partial<Parameters<typeof useDismissable>[0]> & { isOpen?: unknown } = {},
) => {
  const overlay = document.createElement("div");
  const inside = document.createElement("button");

  overlay.appendChild(inside);
  document.body.appendChild(overlay);

  const onClose = vi.fn();
  const defaults: Parameters<typeof useDismissable>[0] = {
    isDismissable: true,
    isOpen: true,
    onClose,
    overlayRef: overlay,
  };
  const [dismissable, dispose] = withScope(() =>
    useDismissable(Object.assign(defaults, options as Parameters<typeof useDismissable>[0])),
  );

  overlay.addEventListener("keydown", (event) => dismissable.onKeydown(event));

  return {
    dismissable,
    dispose: () => {
      dispose();
      overlay.remove();
    },
    inside,
    onClose,
    overlay,
  };
};

/** A press outside the overlay, as the browser would deliver it. */
const pressOutside = (target: Element = document.body) => {
  target.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, composed: true, pointerId: 1 }),
  );
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, composed: true }));
};

describe("useDismissable", () => {
  describe("interacting outside", () => {
    it("dismisses on a press outside", () => {
      const { dispose, onClose } = setup();

      pressOutside();

      expect(onClose).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("leaves the overlay alone on a press inside a top layer", () => {
      const { dispose, onClose } = setup();
      const region = document.createElement("div");
      const button = document.createElement("button");

      region.setAttribute("data-ropav-top-layer", "true");
      region.appendChild(button);
      document.body.appendChild(region);

      // A toast is rendered outside every overlay and yet is not "outside" it: dismissing a
      // popover because the user closed a toast that appeared over it is not what they asked for.
      pressOutside(button);

      expect(onClose).not.toHaveBeenCalled();

      region.remove();
      dispose();
    });

    it("leaves the overlay alone on a press inside it", () => {
      const { dispose, inside, onClose } = setup();

      pressOutside(inside);

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("ignores a drag that starts outside and ends inside", () => {
      const { dispose, inside, onClose } = setup();

      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, composed: true }),
      );
      inside.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, composed: true }));

      // Deciding on the pointerdown alone would dismiss here, which is wrong: the interaction
      // ended on the overlay.
      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("ignores a press that starts inside and ends outside", () => {
      const { dispose, inside, onClose } = setup();

      inside.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, composed: true }),
      );
      document.body.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, composed: true }),
      );

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("ignores a secondary button", () => {
      const { dispose, onClose } = setup();

      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 2, composed: true }),
      );
      document.body.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 2, composed: true }),
      );

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("does not dismiss while closed", () => {
      const { dispose, onClose } = setup({ isOpen: false });

      pressOutside();

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("does not dismiss when it was not asked to be dismissable", () => {
      const { dispose, onClose } = setup({ isDismissable: false });

      pressOutside();

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("honours a filter that spares some outside elements", () => {
      const spared = document.createElement("button");

      document.body.appendChild(spared);

      const { dispose, onClose } = setup({
        shouldCloseOnInteractOutside: (element) => element !== spared,
      });

      pressOutside(spared);

      // A submenu's own trigger is outside the submenu, and pressing it must not dismiss the
      // submenu it opened.
      expect(onClose).not.toHaveBeenCalled();

      pressOutside();

      expect(onClose).toHaveBeenCalledTimes(1);

      spared.remove();
      dispose();
    });

    it("ignores an interaction with an element already gone from the page", () => {
      const { dispose, onClose } = setup();
      const removed = document.createElement("button");

      // Nothing can be said about whether a detached element is inside the overlay, and this is
      // usually something the overlay's own interaction just removed.
      pressOutside(removed);

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("Escape", () => {
    it("dismisses on Escape", () => {
      const { dispose, onClose, overlay } = setup();

      overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      expect(onClose).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("dismisses on Escape even when interacting outside does not", () => {
      const { dispose, onClose, overlay } = setup({ isDismissable: false });

      overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      expect(onClose).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("leaves Escape alone when keyboard dismissal is disabled", () => {
      const { dispose, onClose, overlay } = setup({ isKeyboardDismissDisabled: true });

      overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("stops Escape so nothing further up also dismisses", () => {
      const { dispose, overlay } = setup();
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Escape",
      });
      const outerSaw = vi.fn();

      document.body.addEventListener("keydown", outerSaw);
      overlay.dispatchEvent(event);

      expect(outerSaw).not.toHaveBeenCalled();

      document.body.removeEventListener("keydown", outerSaw);
      dispose();
    });

    it("ignores other keys", () => {
      const { dispose, onClose, overlay } = setup();

      overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });
  });

  describe("nesting", () => {
    it("dismisses only the innermost overlay on a press outside", () => {
      const outer = setup();
      const inner = setup();

      pressOutside();

      // A click outside a submenu inside a menu closes the submenu and leaves the menu open.
      expect(inner.onClose).toHaveBeenCalledTimes(1);
      expect(outer.onClose).not.toHaveBeenCalled();

      inner.dispose();
      outer.dispose();
    });

    it("dismisses only the innermost overlay on Escape", () => {
      const outer = setup();
      const inner = setup();

      inner.overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      expect(inner.onClose).toHaveBeenCalledTimes(1);
      expect(outer.onClose).not.toHaveBeenCalled();

      inner.dispose();
      outer.dispose();
    });

    it("hands dismissal back to the outer overlay once the inner one closes", async () => {
      const isOpen = shallowRef(true);
      const outer = setup();
      const inner = setup({ isOpen });

      isOpen.value = false;
      await nextTick();

      pressOutside();

      expect(outer.onClose).toHaveBeenCalledTimes(1);

      inner.dispose();
      outer.dispose();
    });
  });

  describe("region", () => {
    /** An overlay inside an app's window, the region it belongs to. */
    const setupInRegion = () => {
      const region = document.createElement("section");
      const content = document.createElement("button");
      const overlay = setup({ region });

      region.append(content, overlay.overlay);
      document.body.appendChild(region);

      return {
        ...overlay,
        content,
        dispose: () => {
          overlay.dispose();
          region.remove();
        },
        region,
      };
    };

    it("neither dismisses on nor swallows a press outside its region", () => {
      const { dispose, onClose } = setupInRegion();
      const elsewhere = document.createElement("button");
      const reached = vi.fn();

      elsewhere.addEventListener("pointerdown", reached);
      document.body.appendChild(elsewhere);

      pressOutside(elsewhere);

      // Another app's window is not behind this overlay: the press is meant for it, whole.
      expect(onClose).not.toHaveBeenCalled();
      expect(reached).toHaveBeenCalledTimes(1);

      elsewhere.remove();
      dispose();
    });

    it("still dismisses on a press outside the overlay inside its region", () => {
      const { content, dispose, onClose } = setupInRegion();

      pressOutside(content);

      expect(onClose).toHaveBeenCalledTimes(1);

      dispose();
    });

    it("closes on Escape while an overlay in another region opened after it", () => {
      const first = setupInRegion();
      const second = setupInRegion();

      first.overlay.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

      // Two windows side by side are not nested, so neither overlay is stacked over the other.
      expect(first.onClose).toHaveBeenCalledTimes(1);
      expect(second.onClose).not.toHaveBeenCalled();

      second.dispose();
      first.dispose();
    });
  });
});
