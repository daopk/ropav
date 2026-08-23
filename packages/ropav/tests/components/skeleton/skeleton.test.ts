import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {nextTick, reactive} from "vue";

import {Skeleton, SkeletonRoot, skeletonVariants} from "@/components/skeleton";
import {clearCssVariableCache} from "@/composables/use-css-variable";

import Fixture from "./fixtures.vue";

const renderSkeleton = (props: Record<string, unknown> = {}) => renderVapor(Fixture, {props});

describe("Skeleton", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--skeleton-animation");
    clearCssVariableCache();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--skeleton-animation");
    clearCssVariableCache();
  });

  describe("structure", () => {
    it("renders a div with the public data slot", () => {
      const {container, unmount} = renderSkeleton();
      const skeleton = container.querySelector('[data-slot="skeleton"]');

      expect(skeleton?.tagName).toBe("DIV");
      expect(skeleton).toHaveClass("skeleton");

      unmount();
    });

    it("forwards arbitrary attributes and slot content", () => {
      const {container, getByTestId, unmount} = renderSkeleton();
      const skeleton = container.querySelector('[data-slot="skeleton"]');

      expect(skeleton).toHaveAttribute("data-foo", "bar");
      expect(getByTestId("content")).toHaveTextContent("Loading");

      unmount();
    });
  });

  describe("animation", () => {
    it("uses the variant default when the theme property is absent", () => {
      const {container, unmount} = renderSkeleton();

      expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("skeleton--shimmer");

      unmount();
    });

    it("reads the animation type from the theme custom property", () => {
      document.documentElement.style.setProperty("--skeleton-animation", "pulse");

      const {container, unmount} = renderSkeleton();

      expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("skeleton--pulse");

      unmount();
    });

    it("lets an explicit animation type override the theme", () => {
      document.documentElement.style.setProperty("--skeleton-animation", "pulse");

      const {container, unmount} = renderSkeleton({animationType: "none"});

      expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass("skeleton--none");
      expect(container.querySelector('[data-slot="skeleton"]')).not.toHaveClass("skeleton--pulse");

      unmount();
    });

    it("updates an explicit animation type reactively", async () => {
      const props = reactive({animationType: "pulse" as const});
      const {container, unmount} = renderVapor(Fixture, {props});
      const skeleton = container.querySelector('[data-slot="skeleton"]');

      expect(skeleton).toHaveClass("skeleton--pulse");

      Object.assign(props, {animationType: "none"});
      await nextTick();

      expect(skeleton).toHaveClass("skeleton--none");
      expect(skeleton).not.toHaveClass("skeleton--pulse");

      unmount();
    });
  });

  describe("styling", () => {
    it("merges a caller class", () => {
      const {container, unmount} = renderSkeleton({class: "rounded-full"});

      expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass(
        "skeleton",
        "rounded-full",
      );

      unmount();
    });
  });

  describe("exports", () => {
    it("exposes the root and shared variants", () => {
      expect(Skeleton.Root).toBe(SkeletonRoot);
      expect(skeletonVariants({animationType: "pulse"}).base()).toContain("skeleton--pulse");
    });
  });
});
