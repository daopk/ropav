import type { RouterContext } from "@/components/router-provider/router-provider.context";

import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { RouterProvider } from "@/components/router-provider";
import { useRouterContext } from "@/components/router-provider/router-provider.context";

/**
 * The provider mounted the way a consumer mounts it: from a VDOM host, with the content written in
 * the host and forwarded through the provider's slot.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the host. A provider whose whole job is `provide` has to be checked
 * through the path every real application uses.
 */
const Reader = defineComponent({
  name: "RouterReader",
  props: { onReady: { required: true, type: Function } },
  setup: (props) => {
    props.onReady(useRouterContext());

    return () => h("span", { "data-slot": "reader" });
  },
});

const render = (props: Record<string, unknown>) => {
  let router!: RouterContext | null;

  return {
    ...renderInterop(RouterProvider, {
      props,
      slots: {
        default: () => h(Reader, { onReady: (value: RouterContext | null) => (router = value) }),
      },
    }),
    router: () => router,
  };
};

describe("RouterProvider (interop)", () => {
  it("reaches content written in a VDOM host", () => {
    const navigate = vi.fn();
    const { router, unmount } = render({ navigate });

    router()?.navigate("/next");

    expect(navigate).toHaveBeenCalledWith("/next", undefined);
    unmount();
  });

  it("reaches that content with the optional halves resolved too", () => {
    const { router, unmount } = render({
      isCurrent: (href: string) => href === "/next",
      navigate: vi.fn(),
      resolveHref: (href: string) => `/base${href}`,
    });

    expect(router()?.resolveHref("/next")).toBe("/base/next");
    expect(router()?.isCurrent("/next")).toBe(true);
    unmount();
  });
});
