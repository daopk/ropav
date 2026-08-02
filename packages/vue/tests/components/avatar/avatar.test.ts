import {renderVapor} from "@heroui/testing/helpers/vue";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {AvatarFallback} from "@/components/avatar";

import AvatarFixture from "./fixtures.vue";

/** jsdom never loads images, so the probe image is stubbed to drive the status. */
class FakeImage {
  static instances: FakeImage[] = [];

  crossOrigin: string | null = null;
  referrerPolicy = "";
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeImage.instances.push(this);
  }

  static get last() {
    return FakeImage.instances.at(-1);
  }
}

beforeEach(() => {
  FakeImage.instances = [];
  window.Image = FakeImage as unknown as typeof window.Image;
});

const fallbackIn = (container: HTMLElement) =>
  container.querySelector("[data-slot='avatar-fallback']");
const imageIn = (container: HTMLElement) => container.querySelector("img");

describe("Avatar", () => {
  describe("fallback rendering", () => {
    it("renders the fallback while the image is loading", () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/jane.png"}});

      expect(fallbackIn(container)?.textContent).toBe("JD");
      expect(imageIn(container)).toBeNull();

      unmount();
    });

    it("renders the fallback when there is no src at all", () => {
      const {container, unmount} = renderVapor(AvatarFixture);

      expect(fallbackIn(container)).not.toBeNull();
      expect(imageIn(container)).toBeNull();

      unmount();
    });

    it("swaps the fallback for the image once it loads", async () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/jane.png"}});

      FakeImage.last?.onload?.();
      await nextTick();

      expect(imageIn(container)).not.toBeNull();
      expect(fallbackIn(container)).toBeNull();

      unmount();
    });

    it("keeps the fallback when the image fails", async () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/broken.png"}});

      FakeImage.last?.onerror?.();
      await nextTick();

      expect(imageIn(container)).toBeNull();
      expect(fallbackIn(container)?.textContent).toBe("JD");

      unmount();
    });
  });

  describe("image", () => {
    it("renders src and alt on the loaded image", async () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/jane.png"}});

      FakeImage.last?.onload?.();
      await nextTick();

      const image = imageIn(container);

      expect(image?.getAttribute("src")).toBe("/jane.png");
      expect(image?.getAttribute("alt")).toBe("Jane Doe");

      unmount();
    });

    it("renders the image element class", async () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/jane.png"}});

      FakeImage.last?.onload?.();
      await nextTick();

      expect(imageIn(container)?.classList.contains("avatar__image")).toBe(true);

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class on the root", () => {
      const {container, unmount} = renderVapor(AvatarFixture);

      expect(container.firstElementChild?.classList.contains("avatar")).toBe(true);

      unmount();
    });

    it.each([
      ["size", "lg", "avatar--lg"],
      ["variant", "soft", "avatar--soft"],
    ])("applies the %s modifier class", (prop, value, expected) => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {[prop]: value}});

      expect(container.firstElementChild?.classList.contains(expected)).toBe(true);

      unmount();
    });

    it("applies the root color to the fallback", () => {
      const {container, unmount} = renderVapor(AvatarFixture, {props: {color: "danger"}});

      expect(fallbackIn(container)?.classList.contains("avatar__fallback--danger")).toBe(true);

      unmount();
    });

    it("lets the fallback override the root color", () => {
      const {container, unmount} = renderVapor(AvatarFixture, {
        props: {color: "danger", fallbackColor: "success"},
      });
      const fallback = fallbackIn(container);

      expect(fallback?.classList.contains("avatar__fallback--success")).toBe(true);
      expect(fallback?.classList.contains("avatar__fallback--danger")).toBe(false);

      unmount();
    });
  });

  describe("context", () => {
    it("throws when the fallback renders outside the root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(AvatarFallback)).toThrow(/`AvatarContext` was consumed outside/);

      warn.mockRestore();
    });
  });
});
