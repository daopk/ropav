import type { RouterContext } from "@/components/router-provider/router-provider.context";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import RouterHost from "../../fixtures/router-host.vue";

import Fixture from "./fixtures.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let router!: RouterContext | null;

  Object.assign(props, { onReady: (value: RouterContext | null) => (router = value) });

  return { ...renderVapor(Fixture, { props }), router: () => router };
};

describe("RouterProvider", () => {
  describe("the router it supplies", () => {
    it("reaches the content below", () => {
      const navigate = vi.fn();
      const { router, unmount } = setup({ navigate });

      router()?.navigate("/next");

      expect(navigate).toHaveBeenCalledWith("/next", undefined);
      unmount();
    });

    it("passes the navigation options through untouched", () => {
      // Whatever the application's router accepts — this library never reads them.
      const navigate = vi.fn();
      const { router, unmount } = setup({ navigate });

      router()?.navigate("/next", { replace: true });

      expect(navigate).toHaveBeenCalledWith("/next", { replace: true });
      unmount();
    });

    it("follows its navigate being rebound", async () => {
      // The functions delegate to the props rather than being captured from them, so a router
      // created lazily is picked up by links that mounted before it existed.
      const first = vi.fn();
      const second = vi.fn();
      const props = reactive({ navigate: first });
      const { router, unmount } = setup(props);

      props.navigate = second;
      await nextTick();
      router()?.navigate("/next");

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith("/next", undefined);
      unmount();
    });

    it("lets the nearest provider win", () => {
      const outer = vi.fn();
      const innerNavigate = vi.fn();
      const { router, unmount } = setup({ innerNavigate, navigate: outer });

      router()?.navigate("/next");

      expect(outer).not.toHaveBeenCalled();
      expect(innerNavigate).toHaveBeenCalledWith("/next", undefined);
      unmount();
    });
  });

  describe("the optional halves", () => {
    it("resolves an href through the one it was given", () => {
      const { router, unmount } = setup({ resolveHref: (href: string) => `/base${href}` });

      expect(router()?.resolveHref("/next")).toBe("/base/next");
      unmount();
    });

    it("leaves an href as written when it was given none", () => {
      // A router mounted at the root rewrites nothing, and most are.
      const { router, unmount } = setup({});

      expect(router()?.resolveHref("/next")).toBe("/next");
      unmount();
    });

    it("answers the current-route question through the one it was given", () => {
      const { router, unmount } = setup({ isCurrent: (href: string) => href === "/next" });

      expect(router()?.isCurrent("/next")).toBe(true);
      expect(router()?.isCurrent("/other")).toBe(false);
      unmount();
    });

    it("reports nothing as current when it was given no predicate", () => {
      // Absent and "the predicate said no" reach a link as the same answer, so the default is
      // resolved here rather than at every call site.
      const { router, unmount } = setup({});

      expect(router()?.isCurrent("/next")).toBe(false);
      unmount();
    });
  });

  describe("outside a provider", () => {
    it("resolves to no router at all", () => {
      // Loose on purpose: most of the tree runs without a router, and following the href is the
      // right answer there rather than an error.
      let router: RouterContext | null = null;
      let called = false;

      const { unmount } = renderVapor(RouterHost, {
        props: {
          onReady: (value: RouterContext | null) => {
            called = true;
            router = value;
          },
        },
      });

      expect(called).toBe(true);
      expect(router).toBeNull();
      unmount();
    });
  });

  describe("rendering", () => {
    it("renders its content without an element of its own", () => {
      // Every link below reads the router through the context, so a wrapper would add a DOM node
      // that no style or query expects — React Aria's provider renders none either.
      const { container, unmount } = setup({});

      expect(container.firstElementChild?.getAttribute("data-slot")).toBe("router-host");
      expect(container.children).toHaveLength(1);
      unmount();
    });
  });
});
