import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { h } from "vue";

import { Link } from "@/components/link";
import { RouterProvider } from "@/components/router-provider";

/**
 * The link written the way a consumer writes it: inside a VDOM host, under a provider it has to
 * reach through the slot.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the host. Link began consuming a context the day it started asking a
 * router about navigation, so the boundary the interop suite exists for now runs through it.
 */
const render = (props: Record<string, unknown>, linkProps: Record<string, unknown>) => {
  const result = renderInterop(RouterProvider, {
    props,
    slots: {
      default: () => h(Link, linkProps, { default: () => "Call to action" }),
    },
  });
  const link = result.container.querySelector('[data-slot="link"]');

  if (!link) throw new Error("link not rendered");

  return { ...result, link };
};

const click = (element: Element) => {
  const event = new MouseEvent("click", { bubbles: true, button: 0, cancelable: true });

  element.dispatchEvent(event);

  return event;
};

describe("Link (interop)", () => {
  it("reaches a router provided above a VDOM host", () => {
    const navigate = vi.fn();
    const { link, unmount } = render({ navigate }, { href: "/next" });
    const event = click(link);

    expect(navigate).toHaveBeenCalledWith("/next", undefined);
    expect(event.defaultPrevented).toBe(true);

    unmount();
  });

  it("renders the href that router resolved", () => {
    const { link, unmount } = render(
      { navigate: vi.fn(), resolveHref: (href: string) => `/base${href}` },
      { href: "/next" },
    );

    expect(link).toHaveAttribute("href", "/base/next");

    unmount();
  });

  it("asks that router about the current page", () => {
    const { link, unmount } = render(
      { isCurrent: (href: string) => href === "/next", navigate: vi.fn() },
      { ariaCurrent: "auto", href: "/next" },
    );

    expect(link).toHaveAttribute("aria-current", "page");

    unmount();
  });
});
