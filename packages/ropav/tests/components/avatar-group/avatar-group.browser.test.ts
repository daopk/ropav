import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import Fixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const avatarsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>(".rp-avatar"),
];

/**
 * Which avatar paints on top where two of them overlap, asked of the browser rather than read off
 * a `z-index` string — the ladder only matters for what it does to the painting.
 */
const topmostInOverlap = (first: HTMLElement, second: HTMLElement) => {
  const left = first.getBoundingClientRect();
  const right = second.getBoundingClientRect();
  const x = (right.left + left.right) / 2;
  const y = left.top + left.height / 2;

  return document.elementFromPoint(x, y)?.closest(".rp-avatar");
};

describe("AvatarGroup (browser)", () => {
  describe("overlap", () => {
    it("tucks each avatar a quarter of its width under the one before it", () => {
      const { container, unmount } = renderGroup();
      const [first, second] = avatarsIn(container);
      const left = first!.getBoundingClientRect();
      const right = second!.getBoundingClientRect();

      expect(right.left - left.right).toBeCloseTo(-left.width * 0.25, 1);

      unmount();
    });

    it("keeps the tuck proportional at the large size", () => {
      const { container, unmount } = renderGroup({ size: "lg" });
      const [first, second] = avatarsIn(container);
      const left = first!.getBoundingClientRect();
      const right = second!.getBoundingClientRect();

      expect(left.width).toBeGreaterThan(40);
      expect(right.left - left.right).toBeCloseTo(-left.width * 0.25, 1);

      unmount();
    });

    it("spaces the avatars apart and drops the ring when there is no overlap", () => {
      const { container, unmount } = renderGroup({ overlap: "none" });
      const [first, second] = avatarsIn(container);
      const left = first!.getBoundingClientRect();
      const right = second!.getBoundingClientRect();

      expect(right.left - left.right).toBeGreaterThan(0);
      expect(getComputedStyle(first!).boxShadow).toBe("none");

      unmount();
    });

    it("moves the tuck onto the block axis when vertical", () => {
      const { container, unmount } = renderGroup({ orientation: "vertical" });
      const [first, second] = avatarsIn(container);
      const top = first!.getBoundingClientRect();
      const below = second!.getBoundingClientRect();

      expect(below.top - top.bottom).toBeCloseTo(-top.height * 0.25, 1);
      expect(below.left).toBeCloseTo(top.left, 1);

      unmount();
    });

    it("tucks the other way round in a right-to-left group", () => {
      const { container, unmount } = renderGroup();

      container.setAttribute("dir", "rtl");

      const [first, second] = avatarsIn(container);
      const start = first!.getBoundingClientRect();
      const next = second!.getBoundingClientRect();

      expect(next.left).toBeLessThan(start.left);
      expect(start.left - next.right).toBeCloseTo(-start.width * 0.25, 1);

      unmount();
    });
  });

  describe("stacking direction", () => {
    it("paints each avatar over the one before it by default", () => {
      const { container, unmount } = renderGroup();
      const [first, second] = avatarsIn(container);

      expect(topmostInOverlap(first!, second!)).toBe(second);

      unmount();
    });

    it("paints each avatar under the one before it when the first is in front", () => {
      const { container, unmount } = renderGroup({ front: "first" });
      const [first, second, third] = avatarsIn(container);

      expect(topmostInOverlap(first!, second!)).toBe(first);
      expect(topmostInOverlap(second!, third!)).toBe(second);

      unmount();
    });

    it("leaves the reading order alone whichever avatar is in front", () => {
      const inOrder = (props: Record<string, unknown>) => {
        const { container, unmount } = renderGroup(props);
        const lefts = avatarsIn(container).map((el) => el.getBoundingClientRect().left);

        unmount();

        return lefts.every((left, index) => index === 0 || left > lefts[index - 1]!);
      };

      expect(inOrder({ front: "last" })).toBe(true);
      expect(inOrder({ front: "first" })).toBe(true);
    });
  });

  describe("ring", () => {
    it("draws a ring outside each avatar", () => {
      const { container, unmount } = renderGroup();

      expect(getComputedStyle(avatarsIn(container)[0]!).boxShadow).not.toBe("none");

      unmount();
    });

    it("takes the ring colour the caller sets for the surface behind it", () => {
      const { container, unmount } = renderGroup();
      const avatar = avatarsIn(container)[0]!;
      const before = getComputedStyle(avatar).boxShadow;

      container
        .querySelector<HTMLElement>('[data-slot="avatar-group"]')!
        .style.setProperty("--avatar-group-ring-color", "rgb(1, 2, 3)");

      const after = getComputedStyle(avatar).boxShadow;

      expect(after).not.toBe(before);
      expect(after).toContain("rgb(1, 2, 3)");

      unmount();
    });
  });

  describe("focus", () => {
    it("raises the avatar holding focus above every other one", () => {
      const { container, unmount } = renderGroup({ front: "first", withLinks: true });
      const link = container.querySelector<HTMLAnchorElement>("a")!;

      link.focus();

      expect(getComputedStyle(link).zIndex).toBe("20");

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderGroup({ count: 5 });

    await expectNoA11yViolations(container, PALETTE_CONTRAST_DEBT);

    unmount();
  });
});
