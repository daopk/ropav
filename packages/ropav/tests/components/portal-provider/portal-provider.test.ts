import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick, shallowReactive } from "vue";

import PortalProviderFixture from "./fixtures.vue";

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

/** A page with a region of its own: `root` holds the content and the overlay `container`. */
const region = () => {
  const chrome = document.createElement("button");
  const root = document.createElement("section");
  const content = document.createElement("div");
  const container = document.createElement("div");

  root.append(content, container);
  document.body.append(chrome, root);

  return { chrome, container, content, root };
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("PortalProvider", () => {
  it("renders every overlay below into its container", async () => {
    for (const [open, selector] of [
      ["modal", "[data-slot='modal-backdrop']"],
      ["popover", "[role='dialog']"],
      ["tooltip", "[role='tooltip']"],
    ] as const) {
      const { container } = region();
      const result = renderVapor(PortalProviderFixture, { props: { container, open } });

      await settle();

      expect(container.querySelector(selector), open).toBeTruthy();

      result.unmount();
      document.body.replaceChildren();
    }
  });

  it("leaves the body as the container without one", async () => {
    const result = renderVapor(PortalProviderFixture, { props: { open: "modal" } });

    await settle();

    expect(document.body.querySelector(":scope > [data-slot='modal-backdrop']")).toBeTruthy();

    result.unmount();
  });

  // jsdom has no `inert`, so the hiding falls back to `aria-hidden`: the same walk, the same root.
  const hidden = (element: Element) => element.getAttribute("aria-hidden") === "true";

  it("hides only its root for a modal, and leaves the rest of the page live", async () => {
    const { chrome, container, content, root } = region();
    const result = renderVapor(PortalProviderFixture, {
      props: { container, open: "modal", root },
    });

    await settle();

    expect(hidden(content)).toBe(true);
    expect(hidden(chrome)).toBe(false);
    expect(hidden(root)).toBe(false);

    // Content the page adds later outside the root stays live too.
    const later = document.createElement("aside");

    document.body.append(later);
    await settle();

    expect(hidden(later)).toBe(false);

    result.unmount();
    await settle();

    expect(hidden(content)).toBe(false);
  });

  it("sizes a contained modal to its container, not to the visual viewport", async () => {
    const { container, root } = region();
    const result = renderVapor(PortalProviderFixture, {
      props: { container, open: "modal", root },
    });

    await settle();

    const backdrop = container.querySelector<HTMLElement>("[data-slot='modal-backdrop']");

    expect(backdrop?.style.getPropertyValue("--visual-viewport-height")).toBe("");

    result.unmount();
  });

  it("leaves focus and Tab in the rest of the page alone while a modal is open", async () => {
    const { chrome, container, root } = region();
    const result = renderVapor(PortalProviderFixture, {
      props: { container, open: "modal", root },
    });

    await settle();

    // The rest of the page is not behind this modal, so focus moving there is the user leaving
    // rather than escaping, and Tab pressed there is theirs.
    chrome.focus();

    const tab = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" });

    chrome.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(chrome);

    result.unmount();
  });

  it("follows a container and a root that arrive after the first render", async () => {
    const { chrome, container, content, root } = region();
    // A template ref is `null` on the render that first reads it, which is how a page usually hands
    // its own elements over.
    const props = shallowReactive<{ container: HTMLElement | null; root: HTMLElement | null }>({
      container: null,
      root: null,
    });
    const result = renderVapor(PortalProviderFixture, {
      props: {
        get container() {
          return props.container;
        },
        open: "modal",
        get root() {
          return props.root;
        },
      },
    });

    await settle();

    expect(document.body.querySelector(":scope > [data-slot='modal-backdrop']")).toBeTruthy();
    expect(hidden(chrome)).toBe(true);

    props.container = container;
    props.root = root;
    await settle();

    expect(container.querySelector("[data-slot='modal-backdrop']")).toBeTruthy();
    expect(hidden(content)).toBe(true);
    expect(hidden(chrome)).toBe(false);

    result.unmount();
  });
});
