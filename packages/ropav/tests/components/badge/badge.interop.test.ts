import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h } from "vue";

import { BadgeLabel, BadgeRoot } from "@/components/badge";

describe("Badge under a vdom host", () => {
  it("leaves bare host text unwrapped because the host fills its slot only on insertion", () => {
    const { container, unmount } = renderInterop(BadgeRoot, {
      slots: { default: () => "5" },
    });

    expect(container.querySelector('[data-slot="badge"]')).toHaveTextContent("5");
    expect(container.querySelector('[data-slot="badge-label"]')).toBeNull();

    unmount();
  });

  it("styles a label written in and forwarded from the host", () => {
    const { container, unmount } = renderInterop(BadgeRoot, {
      props: { color: "danger", size: "lg" },
      slots: {
        default: () => h(BadgeLabel, { class: "tabular-nums" }, { default: () => "99+" }),
      },
    });

    const badge = container.querySelector('[data-slot="badge"]');
    const label = container.querySelector('[data-slot="badge-label"]');

    expect(badge).toHaveClass("badge--danger", "badge--lg");
    expect(label).toHaveClass("badge__label", "tabular-nums");
    expect(label).toHaveTextContent("99+");

    unmount();
  });
});
