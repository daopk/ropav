import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const itemFor = (container: HTMLElement, key: string) =>
  container.querySelector<HTMLElement>(`[data-slot="menu-item"][data-key="${key}"]`)!;

const labelIn = (item: HTMLElement) => item.querySelector<HTMLElement>('[data-slot="label"]')!;

const ITEMS = [
  { id: "copy", label: "Copy" },
  { id: "forget", label: "Forget", variant: "danger" as const },
];

const probes: HTMLElement[] = [];

/** What a value expression resolves to, read the way the browser resolves it for a component. */
const resolve = (value: string) => {
  const probe = document.createElement("div");

  document.body.appendChild(probe);
  probes.push(probe);
  probe.style.color = value;

  return getComputedStyle(probe).color;
};

afterEach(() => {
  for (const probe of probes.splice(0)) probe.remove();
});

/**
 * What the danger variant paints, which no jsdom test can reach.
 *
 * The class landing is not the assertion — that held throughout a release where the variant
 * painted nothing, because both rules it carried were descendant selectors and an item's own text
 * is not a descendant. So each case here reads a colour off the element a reader would be looking
 * at, and the item beside it is what keeps a green result from meaning the theme paints everything
 * danger.
 */
describe("Menu (browser)", () => {
  describe("the danger variant", () => {
    it("colours an item whose text sits straight in the slot", () => {
      const { container, unmount } = render({ items: ITEMS });
      const forget = itemFor(container, "forget");

      expect(forget).toHaveClass("rp-menu-item--danger");
      expect(getComputedStyle(forget).color).toBe(resolve("var(--danger)"));
      expect(getComputedStyle(itemFor(container, "copy")).color).not.toBe(resolve("var(--danger)"));

      unmount();
    });

    /*
     * The composition the docs demo uses, and the reason the rule on the item is additive rather
     * than a replacement: a label sets a colour on itself, so it does not inherit the item's — it
     * has to be overridden where it is declared. The plain item is the half that proves that
     * override is still load-bearing; without it this text falls back to the line below.
     */
    it("colours an item whose text is wrapped in a label", () => {
      const { container, unmount } = render({ items: ITEMS, withLabel: true });

      expect(getComputedStyle(labelIn(itemFor(container, "forget"))).color).toBe(
        resolve("var(--danger)"),
      );
      expect(getComputedStyle(labelIn(itemFor(container, "copy"))).color).toBe(
        resolve("var(--foreground)"),
      );

      unmount();
    });

    /*
     * The pairing to keep an eye on, because both halves want the same element: disabling dims the
     * item rather than recolouring it, so the two rules never compete and a disabled danger item
     * stays recognisably danger. A disabled rule reaching for `color` would take this over — it
     * sits earlier in the file, but on a longer selector.
     */
    it("survives being disabled, which dims the item rather than recolouring it", () => {
      const { container, unmount } = render({ disabledKeys: ["forget"], items: ITEMS });
      const forget = itemFor(container, "forget");

      expect(forget).toHaveAttribute("data-disabled", "true");
      expect(getComputedStyle(forget).color).toBe(resolve("var(--danger)"));
      expect(Number(getComputedStyle(forget).opacity)).toBeLessThan(1);

      unmount();
    });
  });
});
