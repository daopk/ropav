import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { DEFAULT_TOAST_TIMEOUT, ToastContent, ToastQueue } from "@/components/toast";

import ToastCustomFixture from "./fixtures-custom.vue";
import ToastOrphanTitleFixture from "./fixtures-orphan-title.vue";
import ToastFixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown>) => {
  const result = renderVapor(ToastFixture, { props });

  mounted.push(result);

  return result;
};

/**
 * The region is teleported to `body` and only appears once something is queued, so it settles a
 * flush after the add and the toasts a flush after that.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

const POINTER = { bubbles: true, button: 0, composed: true, pointerId: 1 } as const;

/** A press as the browser delivers it: `usePress` listens to the pointer events, not the click. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const closeButton = () => document.body.querySelector<HTMLElement>('button[aria-label="Close"]');

const region = () => document.body.querySelector('[role="region"]');

const toasts = () => [...document.body.querySelectorAll<HTMLElement>('[role="alertdialog"]')];

describe("Toast", () => {
  afterEach(() => {
    while (mounted.length > 0) {
      try {
        mounted.pop()!.unmount();
      } catch {
        /* already unmounted */
      }
    }
    document.body.innerHTML = "";
  });

  describe("region", () => {
    it("renders nothing until a toast is queued", async () => {
      const queue = new ToastQueue();

      render({ queue });
      await settle();

      // The stack has no resting state: an empty region would still be a fixed, focusable landmark
      // sitting over the page.
      expect(region()).toBeNull();

      queue.add({ title: "Saved" });
      await settle();

      expect(region()).not.toBeNull();
    });

    it("exposes the region with a data-slot and a notification count label", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await settle();

      expect(slot("toast-region")).toBe(region());
      expect(region()).toHaveAttribute("aria-label", "1 notification.");

      queue.add({ title: "Second" });
      await settle();

      expect(region()).toHaveAttribute("aria-label", "2 notifications.");
    });

    it("writes the stack geometry out as custom properties", async () => {
      const queue = new ToastQueue();

      render({ gap: 20, queue, scaleFactor: 0.1, width: 320 });
      queue.add({ title: "Saved" });
      await settle();

      const style = region()!.getAttribute("style");

      expect(style).toContain("--gap: 20px");
      expect(style).toContain("--scale-factor: 0.1");
      expect(style).toContain("--toast-width: 320px");
    });

    it("supports a width given as a string", async () => {
      const queue = new ToastQueue();

      render({ queue, width: "50vw" });
      queue.add({ title: "Saved" });
      await settle();

      expect(region()!.getAttribute("style")).toContain("--toast-width: 50vw");
    });

    it("wraps the toasts in a list that takes no part in the layout", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await settle();

      const list = region()!.querySelector("ol")!;

      // The list carries the semantics; the stylesheet builds the stack out of absolute
      // positioning, so neither the list nor its rows may generate a box.
      expect(list.style.display).toBe("contents");
      expect(list.querySelector("li")!.style.display).toBe("contents");
    });
  });

  describe("default toast", () => {
    it("renders an alert dialog with a title, description and close button", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ description: "All done", title: "Saved", variant: "success" });
      await settle();

      const toast = toasts()[0]!;

      expect(toast).toBe(slot("toast"));
      expect(toast).toHaveAttribute("data-frontmost", "true");
      expect(toast.className).toContain("rp-toast--success");
      expect(slot("toast-title")).toHaveTextContent("Saved");
      expect(slot("toast-description")).toHaveTextContent("All done");
      expect(slot("toast-indicator")).not.toBeNull();
      expect(slot("toast-default-icon")).not.toBeNull();
      expect(document.body.querySelector('button[aria-label="Close"]')).not.toBeNull();
    });

    it("renders no indicator when the indicator is null", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ indicator: null, title: "Saved" });
      await settle();

      expect(slot("toast-indicator")).toBeNull();
    });

    it("renders a custom indicator instead of the default icon", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ indicator: "★", title: "Saved" });
      await settle();

      expect(slot("toast-indicator")).toHaveTextContent("★");
      expect(slot("toast-default-icon")).toBeNull();
    });

    it("renders a spinner in place of the indicator while loading", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ isLoading: true, title: "Saving" });
      await settle();

      expect(slot("toast-indicator")!.querySelector('[data-slot="spinner"]')).not.toBeNull();
      expect(slot("toast-default-icon")).toBeNull();
    });

    it("renders an action button that reports its press", async () => {
      const queue = new ToastQueue();
      const onPress = vi.fn();

      render({ queue });
      queue.add({ actionProps: { label: "Undo", onPress }, title: "Saved" });
      await settle();

      const action = slot("toast-action-button")!;

      expect(action).toHaveTextContent("Undo");

      press(action);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("renders no action button without a label to put on it", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ actionProps: { onPress: vi.fn() }, title: "Saved" });
      await settle();

      expect(slot("toast-action-button")).toBeNull();
    });

    it("omits a title that was not given", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ description: "All done" });
      await settle();

      expect(slot("toast-title")).toBeNull();
      expect(slot("toast-description")).not.toBeNull();
    });

    it("points at the description only when one is rendered", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ description: "All done", title: "Saved" });
      await settle();

      expect(toasts()[0]!.getAttribute("aria-describedby")).toBe(
        slot("toast-description")!.getAttribute("id"),
      );
    });

    it("points at no description when none is rendered", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await settle();

      // The claim is what resolves this: an id nothing carries would be a dangling reference.
      expect(toasts()[0]).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("stacking", () => {
    it("puts the newest toast at the front and indexes the rest behind it", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      const [front, behind] = toasts();

      expect(front).toHaveTextContent("Second");
      expect(front).toHaveAttribute("data-frontmost", "true");
      expect(front).toHaveAttribute("data-index", "0");

      expect(behind).not.toHaveAttribute("data-frontmost");
      expect(behind).toHaveAttribute("data-index", "1");
    });

    it("offsets and scales each toast by its place in the stack", async () => {
      const queue = new ToastQueue();

      render({ gap: 10, queue, scaleFactor: 0.1 });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      const [front, behind] = toasts();

      expect(front!.style.translate).toBe("0 0px 0");
      expect(front!.style.scale).toBe("1");
      // A bottom stack grows upwards, away from the edge it is pinned to.
      expect(behind!.style.translate).toBe("0 -10px 0");
      expect(behind!.style.scale).toBe("0.9");
      // The front toast has to paint over the ones behind it.
      expect(Number(front!.style.zIndex)).toBeGreaterThan(Number(behind!.style.zIndex));
    });

    it("offsets a top-placed stack downwards instead", async () => {
      const queue = new ToastQueue();

      render({ gap: 10, placement: "top", queue });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      expect(toasts()[1]!.style.translate).toBe("0 10px 0");
    });

    it("names each toast for the view transition that animates it", async () => {
      const queue = new ToastQueue();

      render({ queue });
      const key = queue.add({ title: "Saved" });

      await settle();

      // The generated key is not a valid custom-ident on its own.
      expect(toasts()[0]!.style.viewTransitionName).toBe(
        `rp-toast-${key.replace(/[^a-zA-Z0-9]/g, "-")}`,
      );
    });

    it("hides the toasts past the visible limit without dropping them", async () => {
      const queue = new ToastQueue();

      render({ maxVisibleToasts: 1, queue });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      const [front, behind] = toasts();

      expect(front).not.toHaveAttribute("data-hidden");
      expect(behind).toHaveAttribute("data-hidden", "true");
      // Still rendered: closing the toast in front of it brings it back.
      expect(behind).toHaveTextContent("First");
      expect(behind!.style.opacity).toBe("0");
      expect(behind!.style.pointerEvents).toBe("none");
    });

    it("takes the visible limit from the queue when the region does not say", async () => {
      const queue = new ToastQueue({ maxVisibleToasts: 1 });

      render({ queue });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      expect(toasts()[1]).toHaveAttribute("data-hidden", "true");
    });

    it("only lets the frontmost toast into the tab order", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "First" });
      await settle();
      queue.add({ title: "Second" });
      await settle();

      expect(toasts()[0]).toHaveAttribute("tabindex", "0");
      expect(toasts()[1]).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("placement", () => {
    it("exposes the placement modifier on both the region and the toast", async () => {
      const queue = new ToastQueue();

      render({ placement: "top end", queue });
      queue.add({ title: "Saved" });
      await settle();

      expect(region()!.className).toContain("rp-toast-region--top-end");
      expect(toasts()[0]!.className).toContain("rp-toast--top-end");
    });
  });

  describe("closing", () => {
    it("calls onClose once when the close button is pressed", async () => {
      const queue = new ToastQueue();
      const onClose = vi.fn();

      render({ queue });
      queue.add({ title: "Saved" }, { onClose });
      await settle();

      press(closeButton()!);
      await settle();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(region()).toBeNull();
    });

    it("exposes a keyboard path to the close button", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await settle();

      // What jsdom can answer: the frontmost toast is the entry point and the close button is
      // reachable inside it. Whether Enter on a native button produces a click is the browser's
      // job, so the dismissal itself is asserted in the browser suite instead — asserting it here
      // would mean dispatching the click ourselves, which proves nothing.
      expect(toasts()[0]).toHaveAttribute("tabindex", "0");

      const button = closeButton()!;

      expect(toasts()[0]!.contains(button)).toBe(true);

      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe("auto dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it("dismisses a toast after the default timeout", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await settle();

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT - 1);
      await settle();
      // Asserted alive first: "gone afterwards" cannot tell a running clock from one that never
      // started.
      expect(region()).not.toBeNull();

      vi.advanceTimersByTime(1);
      await settle();

      expect(region()).toBeNull();
    });

    it("keeps a toast with no timeout until something closes it", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" }, { timeout: 0 });
      await settle();

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 10);
      await settle();

      expect(region()).not.toBeNull();
    });
  });

  describe("custom content", () => {
    it("renders a caller's own tree instead of the default one", async () => {
      const queue = new ToastQueue();

      const result = renderVapor(ToastCustomFixture, { props: { queue } });

      mounted.push(result);
      queue.add({ title: "Saved" });
      await settle();

      expect(document.body.querySelector('[data-testid="custom"]')).toHaveTextContent("Saved");
      // The default tree is replaced rather than added to.
      expect(slot("toast-close")).toBeNull();
    });
  });

  describe("context", () => {
    it("refuses to render a part outside a provider", () => {
      expect(() => renderVapor(ToastContent)).toThrow(/`ToastRegionContext` was consumed outside/);
    });

    it("refuses to render a part outside a toast", async () => {
      const queue = new ToastQueue();

      queue.add({ title: "Saved" });

      // Thrown while the region renders its rows, so it surfaces on the flush rather than the call.
      await expect(async () => {
        mounted.push(renderVapor(ToastOrphanTitleFixture, { props: { queue } }));
        await settle();
      }).rejects.toThrow(/`ToastItemContext` was consumed outside/);
    });
  });
});
