import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import PortalProviderFixture from "./fixtures.vue";

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
