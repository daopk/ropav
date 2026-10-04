import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick, reactive } from "vue";

import PortalProviderFixture from "./fixtures.vue";
import PlacementFixture from "./placement-fixture.vue";

/** Wait for every animation on the element to finish, so it is measured at its final size. */
const settled = async (element: Element) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

/**
 * A page with an app's window on it: the frame holds the app's content and is its overlays'
 * container and root, and a field outside it stands for the shell or another app.
 */
const page = () => {
  const shell = document.createElement("input");
  const frame = document.createElement("section");
  const content = document.createElement("button");

  shell.setAttribute("aria-label", "Shell field");
  content.textContent = "App content";
  // A containing block for `position: fixed`, as the provider asks of a container.
  frame.style.cssText =
    "contain: layout; position: absolute; left: 40px; top: 120px; width: 360px; height: 280px";
  frame.append(content);
  document.body.append(shell, frame);

  return { content, frame, shell };
};

let cleanup: (() => Promise<void>) | undefined;

afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
  document.body.replaceChildren();
});

const openModalIn = async (frame: HTMLElement) => {
  const result = renderVapor(PortalProviderFixture, {
    props: { container: frame, open: "modal", root: frame },
  });

  await nextTick();
  await nextTick();
  await nextTick();

  const backdrop = frame.querySelector<HTMLElement>("[data-slot='modal-backdrop']")!;
  const dialog = frame.querySelector<HTMLElement>("[role='dialog']")!;

  await settled(backdrop);

  // Closed before unmounting, so nothing is left `inert` for the next case to click through.
  cleanup = async () => {
    dialog.focus();
    await userEvent.keyboard("{Escape}");
    await settled(backdrop);
    result.unmount();
  };

  return { backdrop, dialog };
};

describe("PortalProvider in a browser", () => {
  it("makes only its root inert, and leaves the rest of the page usable", async () => {
    const { content, frame, shell } = page();

    await openModalIn(frame);

    expect(content.inert).toBe(true);
    expect(shell.inert).toBe(false);

    // Focus and typing reach the shell, and the modal neither pulls focus back nor closes.
    await userEvent.click(shell);
    await userEvent.keyboard("hello");

    expect(document.activeElement).toBe(shell);
    expect(shell.value).toBe("hello");
    expect(frame.querySelector("[role='dialog']")).not.toBeNull();
  });

  it("sizes the backdrop to its container rather than to the window", async () => {
    const { frame } = page();
    const { backdrop } = await openModalIn(frame);

    const outer = frame.getBoundingClientRect();
    const inner = backdrop.getBoundingClientRect();

    expect(inner.left).toBeCloseTo(outer.left, 0);
    expect(inner.top).toBeCloseTo(outer.top, 0);
    expect(inner.width).toBeCloseTo(outer.width, 0);
    expect(inner.height).toBeCloseTo(outer.height, 0);
  });
});

/**
 * An app's window away from the page origin: the window is the root, and the overlays go into a
 * layer covering it — or straight into the window. The triggers are placed against the window.
 */
const windowAt = (layered: boolean) => {
  const host = document.createElement("section");

  host.style.cssText = "position: absolute; left: 120px; top: 200px; width: 280px; height: 360px";
  document.body.append(host);

  let container = host;

  if (layered) {
    container = document.createElement("div");
    container.style.cssText = "contain: layout; position: absolute; inset: 0";
    host.append(container);
  } else {
    host.style.contain = "layout";
  }

  return { container, host };
};

const openIn = async (
  layered: boolean,
  open: "popover" | "tooltip",
  triggers: { popover?: string; tooltip?: string },
) => {
  const { container, host } = windowAt(layered);
  const props = reactive({
    container,
    open: undefined as "popover" | "tooltip" | undefined,
    popoverTriggerStyle: triggers.popover,
    root: host,
    tooltipTriggerStyle: triggers.tooltip,
  });
  const result = renderVapor(PlacementFixture, { props });

  // The triggers belong to the window, so they are positioned against it.
  host.append(result.container);
  cleanup = async () => result.unmount();

  props.open = open;

  const overlay = await vi.waitFor(() => {
    const found = container.querySelector<HTMLElement>(
      open === "tooltip" ? "[role='tooltip']" : "[data-trigger]",
    );

    if (!found?.dataset["placement"]) throw new Error("not placed yet");

    return found;
  });

  await settled(overlay);

  const name = open === "tooltip" ? "Tooltip trigger" : "Open popover";
  const trigger = [...result.container.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === name,
  )!;

  return {
    bounds: host.getBoundingClientRect(),
    overlay: overlay.getBoundingClientRect(),
    placement: overlay.dataset["placement"],
    trigger: trigger.getBoundingClientRect(),
  };
};

describe.each([
  ["a layer inside the root", true],
  ["the root itself", false],
])("placing an overlay rendered into %s, away from the page origin", (_name, layered) => {
  it("centres a tooltip on its trigger", async () => {
    const { overlay, placement, trigger } = await openIn(layered, "tooltip", {
      tooltip: "position: absolute; left: 80px; top: 160px",
    });

    expect(placement).toBe("top");
    expect(overlay.left + overlay.width / 2).toBeCloseTo(trigger.left + trigger.width / 2, 0);
    expect(overlay.bottom).toBeLessThanOrEqual(trigger.top);
  });

  it("flips a popover above when the root has no room below its trigger", async () => {
    const { bounds, overlay, placement, trigger } = await openIn(layered, "popover", {
      popover: "position: absolute; left: 20px; top: 300px",
    });

    expect(placement).toBe("top");
    expect(overlay.bottom).toBeLessThanOrEqual(trigger.top);
    expect(overlay.top).toBeGreaterThanOrEqual(bounds.top);
  });

  it("shifts a popover to stay inside the root, short of its padding", async () => {
    const { bounds, overlay, placement } = await openIn(layered, "popover", {
      popover: "position: absolute; right: 0; top: 20px",
    });

    expect(placement).toBe("bottom");
    expect(overlay.right).toBeCloseTo(bounds.right - 12, 0);
    expect(overlay.bottom).toBeLessThanOrEqual(bounds.bottom);
  });
});
