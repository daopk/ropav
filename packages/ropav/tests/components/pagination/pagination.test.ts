import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderPagination = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const nav = result.container.querySelector("nav")!;

  return {
    ...result,
    ellipsis: nav.querySelector<HTMLElement>('[data-slot="pagination-ellipsis"]')!,
    links: [...nav.querySelectorAll<HTMLButtonElement>('[data-slot="pagination-link"]')],
    nav,
    next: nav.querySelector<HTMLButtonElement>('[data-slot="pagination-next"]')!,
    previous: nav.querySelector<HTMLButtonElement>('[data-slot="pagination-previous"]')!,
    summary: nav.querySelector<HTMLElement>('[data-slot="pagination-summary"]')!,
  };
};

describe("Pagination", () => {
  describe("root", () => {
    it("renders a labelled navigation landmark", () => {
      const { nav, unmount } = renderPagination();

      expect(nav.tagName).toBe("NAV");
      expect(nav).toHaveAttribute("role", "navigation");
      expect(nav).toHaveAttribute("aria-label", "pagination");
      expect(nav).toHaveAttribute("data-slot", "pagination");
      expect(nav).toHaveClass("rp-pagination");

      unmount();
    });

    it("merges a caller class", () => {
      const { nav, unmount } = renderPagination({ class: "mt-4" });

      expect(nav).toHaveClass("rp-pagination", "mt-4");

      unmount();
    });

    it.each(["sm", "md", "lg"] as const)("renders the %s size", (size) => {
      const { nav, unmount } = renderPagination({ size });

      expect(nav).toHaveClass(`rp-pagination--${size}`);

      unmount();
    });
  });

  describe("summary", () => {
    // The summary mixes numbers and words, which an RTL ancestor would otherwise reorder.
    it("resolves its own base direction from its text", () => {
      const { summary, unmount } = renderPagination();

      expect(summary).toHaveAttribute("dir", "auto");
      expect(summary).toHaveClass("rp-pagination__summary");

      unmount();
    });
  });

  describe("structure", () => {
    it("renders the list as a ul of li items", () => {
      const { nav, unmount } = renderPagination();
      const list = nav.querySelector('[data-slot="pagination-content"]')!;

      expect(list.tagName).toBe("UL");
      expect(list).toHaveClass("rp-pagination__content");

      const items = [...nav.querySelectorAll('[data-slot="pagination-item"]')];

      expect(items).toHaveLength(6);
      expect(items.every((item) => item.tagName === "LI")).toBe(true);
      expect(items[0]).toHaveClass("rp-pagination__item");

      unmount();
    });
  });

  describe("link", () => {
    it("renders a button that never submits a form by accident", () => {
      const { links, unmount } = renderPagination();

      expect(links).toHaveLength(3);
      expect(links[0]!.tagName).toBe("BUTTON");
      expect(links[0]!.type).toBe("button");
      expect(links[0]).toHaveClass("rp-pagination__link");

      unmount();
    });

    it("marks the page being viewed as the current one", () => {
      const { links, unmount } = renderPagination({ activePage: 2 });

      expect(links[1]).toHaveAttribute("aria-current", "page");
      expect(links[1]).toHaveAttribute("data-active", "true");

      // Absent rather than "false": the stylesheet keys on the attribute being present.
      expect(links[0]).not.toHaveAttribute("aria-current");
      expect(links[0]).not.toHaveAttribute("data-active");

      unmount();
    });

    it("calls the click handler with the page it stands for", async () => {
      const onLinkClick = vi.fn();
      const { links, unmount } = renderPagination({ onLinkClick });

      links[2]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await nextTick();

      expect(onLinkClick).toHaveBeenCalledWith(3);

      unmount();
    });

    // Written even though a native button is already tabbable: Safari does not focus one
    // unless an explicit tab index says so.
    it("exposes an explicit tab index", () => {
      const { links, unmount } = renderPagination();

      expect(links[0]).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("publishes hover and press so the stylesheet can key on them", async () => {
      const { links, unmount } = renderPagination();
      const link = links[0]!;

      link.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      await nextTick();
      expect(link).toHaveAttribute("data-hovered", "true");

      link.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
      await nextTick();
      expect(link).toHaveAttribute("data-pressed", "true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();
      expect(link).not.toHaveAttribute("data-pressed");

      link.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
      await nextTick();
      expect(link).not.toHaveAttribute("data-hovered");

      unmount();
    });
  });

  describe("previous and next", () => {
    it("carry the nav modifier on top of the shared link class", () => {
      const { next, previous, unmount } = renderPagination();

      expect(previous).toHaveClass("rp-pagination__link", "rp-pagination__link--nav");
      expect(next).toHaveClass("rp-pagination__link", "rp-pagination__link--nav");

      unmount();
    });

    it("stops being reachable once disabled", () => {
      const { previous, unmount } = renderPagination({ isPreviousDisabled: true });

      expect(previous.disabled).toBe(true);
      expect(previous).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("calls its click handler", async () => {
      const onNextClick = vi.fn();
      const { next, unmount } = renderPagination({ onNextClick });

      next.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await nextTick();

      expect(onNextClick).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("icons", () => {
    it("hides the default chevrons from assistive technology", () => {
      const { nav, unmount } = renderPagination();
      const previousIcon = nav.querySelector('[data-slot="pagination-previous-icon"]')!;
      const nextIcon = nav.querySelector('[data-slot="pagination-next-icon"]')!;

      expect(previousIcon).toHaveAttribute("aria-hidden", "true");
      expect(previousIcon.querySelector("svg")).not.toBeNull();
      expect(nextIcon).toHaveAttribute("aria-hidden", "true");
      expect(nextIcon.querySelector("svg")).not.toBeNull();

      unmount();
    });
  });

  describe("ellipsis", () => {
    it("renders a decorative gap marker", () => {
      const { ellipsis, unmount } = renderPagination();

      expect(ellipsis).toHaveAttribute("aria-hidden", "true");
      expect(ellipsis).toHaveClass("rp-pagination__ellipsis");
      expect(ellipsis).toHaveTextContent("…");

      unmount();
    });
  });
});
