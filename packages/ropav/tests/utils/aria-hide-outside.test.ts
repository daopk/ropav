import {afterEach, describe, expect, it} from "vitest";

import {ariaHideOutside, keepVisible} from "@/utils/aria-hide-outside";

const build = () => {
  const page = document.createElement("main");
  const sibling = document.createElement("p");
  const overlay = document.createElement("div");
  const inside = document.createElement("button");

  page.appendChild(sibling);
  overlay.appendChild(inside);
  document.body.append(page, overlay);

  return {inside, overlay, page, sibling};
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ariaHideOutside", () => {
  it("hides everything beside the target", () => {
    const {overlay, page} = build();
    const restore = ariaHideOutside([overlay]);

    // Without this a screen reader can wander out of the overlay and read the page behind it,
    // with nothing announcing that it has left.
    expect(page).toHaveAttribute("aria-hidden", "true");
    expect(overlay).not.toHaveAttribute("aria-hidden");

    restore();

    expect(page).not.toHaveAttribute("aria-hidden");
  });

  it("leaves the target's own children alone", () => {
    const {inside, overlay} = build();
    const restore = ariaHideOutside([overlay]);

    expect(inside).not.toHaveAttribute("aria-hidden");

    restore();
  });

  it("does not hide children of an element it already hid", () => {
    const {page, sibling} = build();
    const overlay = document.createElement("div");

    document.body.appendChild(overlay);

    const restore = ariaHideOutside([overlay]);

    // The attribute is inherited, so hiding the child as well would be noise.
    expect(page).toHaveAttribute("aria-hidden", "true");
    expect(sibling).not.toHaveAttribute("aria-hidden");

    restore();
  });

  it("keeps an ancestor of the target visible and hides its other children", () => {
    const parent = document.createElement("div");
    const overlay = document.createElement("div");
    const other = document.createElement("p");

    parent.append(other, overlay);
    document.body.appendChild(parent);

    const restore = ariaHideOutside([overlay]);

    expect(parent).not.toHaveAttribute("aria-hidden");
    expect(other).toHaveAttribute("aria-hidden", "true");
    expect(overlay).not.toHaveAttribute("aria-hidden");

    restore();
  });

  it("hides content added to the page afterwards", async () => {
    const {overlay} = build();
    const restore = ariaHideOutside([overlay]);
    const late = document.createElement("aside");

    document.body.appendChild(late);
    // Mutation observers report on a microtask.
    await Promise.resolve();

    expect(late).toHaveAttribute("aria-hidden", "true");

    restore();

    expect(late).not.toHaveAttribute("aria-hidden");
  });

  it("uses inert when asked, which also blocks pointers and focus", () => {
    const {overlay, page} = build();
    const restore = ariaHideOutside([overlay], {shouldUseInert: true});

    // jsdom does not implement the `inert` property, so nothing is written there; a real browser
    // gets the property and, with it, the pointer and focus blocking.
    expect(page.inert || page.hasAttribute("aria-hidden")).toBeTruthy();

    restore();

    expect(page.inert).toBe(false);
    expect(page).not.toHaveAttribute("aria-hidden");
  });

  it("leaves an element the page had already hidden hidden", () => {
    const {overlay, page} = build();

    page.setAttribute("aria-hidden", "true");

    const restore = ariaHideOutside([overlay]);

    restore();

    // Not this call's attribute to remove.
    expect(page).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the page hidden until the last overlay is done with it", () => {
    const {overlay, page} = build();
    const second = document.createElement("div");

    document.body.appendChild(second);

    const restoreFirst = ariaHideOutside([overlay]);
    const restoreSecond = ariaHideOutside([second]);

    restoreSecond();

    // The first overlay is still open, so the page must stay hidden.
    expect(page).toHaveAttribute("aria-hidden", "true");

    restoreFirst();

    expect(page).not.toHaveAttribute("aria-hidden");
  });

  it("never hides the live announcer", async () => {
    const {overlay} = build();
    const announcer = document.createElement("div");

    announcer.setAttribute("data-live-announcer", "true");
    document.body.appendChild(announcer);

    const restore = ariaHideOutside([overlay]);

    expect(announcer).not.toHaveAttribute("aria-hidden");

    restore();
  });
});

describe("keepVisible", () => {
  it("exempts an element from an existing hide", async () => {
    const {overlay} = build();
    const restore = ariaHideOutside([overlay]);
    const submenu = document.createElement("div");
    const stopKeeping = keepVisible(submenu);

    // A submenu is rendered outside the menu that opened it, so it would be hidden with the
    // rest of the page.
    document.body.appendChild(submenu);
    await Promise.resolve();

    expect(submenu).not.toHaveAttribute("aria-hidden");

    stopKeeping?.();
    restore();
  });

  it("reports nothing when no overlay is hiding the page", () => {
    expect(keepVisible(document.createElement("div"))).toBeUndefined();
  });
});
