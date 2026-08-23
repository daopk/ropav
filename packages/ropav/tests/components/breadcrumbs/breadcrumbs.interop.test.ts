import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { BreadcrumbsItem, BreadcrumbsRoot } from "@/components/breadcrumbs";

describe("Breadcrumbs under a vdom host", () => {
  it("keeps item registration, current state, and context styling across the host boundary", async () => {
    const { container, unmount } = renderInterop(BreadcrumbsRoot, {
      slots: {
        default: () => [
          h(BreadcrumbsItem, { href: "#home", id: "home" }, { default: () => "Home" }),
          h(BreadcrumbsItem, { id: "current" }, { default: () => "Current" }),
        ],
      },
    });

    await nextTick();

    const items = container.querySelectorAll("[data-slot='breadcrumbs-item']");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveClass("breadcrumbs__item");
    expect(items[1]).toHaveAttribute("data-current", "true");
    expect(items[1]?.querySelector("[data-slot='link']")).toHaveAttribute("aria-current", "page");

    unmount();
  });
});
