import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import { AvatarGroupOverflow } from "@/components/avatar-group";

import AvatarGroupFixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) =>
  renderVapor(AvatarGroupFixture, { props });

const groupIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="avatar-group"]');

const overflowIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="avatar-group-overflow"]');

const avatarsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>(".rp-avatar"),
];

describe("AvatarGroup", () => {
  describe("structure", () => {
    it("renders a group with its data-slot", () => {
      const { container, unmount } = renderGroup();
      const group = groupIn(container);

      expect(group).not.toBeNull();
      expect(group?.classList.contains("rp-avatar-group")).toBe(true);

      unmount();
    });

    it("merges a caller class", () => {
      const { container, unmount } = renderGroup({ class: "shadow-lg" });
      const group = groupIn(container);

      expect(group?.classList.contains("rp-avatar-group")).toBe(true);
      expect(group?.classList.contains("shadow-lg")).toBe(true);

      unmount();
    });

    it("carries no role of its own, leaving one to the caller", () => {
      const { container, unmount } = renderGroup();

      expect(groupIn(container)?.hasAttribute("role")).toBe(false);

      unmount();
    });
  });

  describe("overflow", () => {
    it("renders the count as an avatar inside the group", () => {
      const { container, unmount } = renderGroup({ count: 5 });
      const overflow = overflowIn(container);

      expect(overflow?.classList.contains("rp-avatar")).toBe(true);
      expect(overflow?.classList.contains("rp-avatar-group__overflow")).toBe(true);
      expect(overflow?.textContent).toBe("+5");
      expect(groupIn(container)?.contains(overflow ?? null)).toBe(true);

      unmount();
    });

    it("renders slot content in place of the count", () => {
      const { container, unmount } = renderGroup({ count: 5, overflowLabel: "5 more" });

      expect(overflowIn(container)?.textContent).toBe("5 more");

      unmount();
    });

    it("renders on its own, outside any group", () => {
      const { container, unmount } = renderVapor(AvatarGroupOverflow, { props: { count: 2 } });
      const overflow = overflowIn(container);

      expect(overflow?.textContent).toBe("+2");
      expect(overflow?.classList.contains("rp-avatar-group__overflow")).toBe(false);

      unmount();
    });
  });

  describe("styling", () => {
    it.each([
      ["front", "first", "rp-avatar-group--front-first"],
      ["orientation", "vertical", "rp-avatar-group--vertical"],
      ["overlap", "none", "rp-avatar-group--overlap-none"],
      ["overlap", "lg", "rp-avatar-group--overlap-lg"],
      ["overlap", "sm", "rp-avatar-group--overlap-sm"],
      ["size", "lg", "rp-avatar-group--lg"],
      ["size", "sm", "rp-avatar-group--sm"],
    ])("applies the %s modifier class for %s", (prop, value, expected) => {
      const { container, unmount } = renderGroup({ [prop]: value });

      expect(groupIn(container)?.classList.contains(expected)).toBe(true);

      unmount();
    });

    it("defaults to a horizontal, medium group stacked in document order", () => {
      const { container, unmount } = renderGroup();
      const classes = groupIn(container)?.classList;

      expect(classes?.contains("rp-avatar-group--horizontal")).toBe(true);
      expect(classes?.contains("rp-avatar-group--md")).toBe(true);
      expect(classes?.contains("rp-avatar-group--overlap-md")).toBe(true);
      expect(classes?.contains("rp-avatar-group--front-first")).toBe(false);

      unmount();
    });
  });

  describe("inherited size", () => {
    it("passes its size to every avatar, the overflow count included", () => {
      const { container, unmount } = renderGroup({ count: 5, size: "lg" });
      const avatars = avatarsIn(container);

      expect(avatars).toHaveLength(4);
      for (const avatar of avatars) {
        expect(avatar.classList.contains("rp-avatar--lg")).toBe(true);
      }

      unmount();
    });

    it("lets an avatar override the size it inherits", () => {
      const { container, unmount } = renderGroup({ childSize: "sm", size: "lg" });
      const [first, second] = avatarsIn(container);

      expect(first?.classList.contains("rp-avatar--sm")).toBe(true);
      expect(second?.classList.contains("rp-avatar--lg")).toBe(true);

      unmount();
    });
  });
});
