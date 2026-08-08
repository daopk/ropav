import {renderVapor} from "@heroui/testing/helpers/vue";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {AvatarFallback} from "@/components/avatar";

import AvatarFixture from "./fixtures.vue";

/** jsdom never loads images, so the probe image is stubbed to drive the status. */
class FakeImage {
  static instances: FakeImage[] = [];

  /** Sources the browser is pretending to hold already, so `complete` is true on assignment. */
  static cached = new Set<string>();

  complete = false;
  naturalWidth = 0;
  crossOrigin: string | null = null;
  referrerPolicy = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  #src = "";

  constructor() {
    FakeImage.instances.push(this);
  }

  static get last() {
    return FakeImage.instances.at(-1);
  }

  get src() {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;

    if (FakeImage.cached.has(value)) {
      this.complete = true;
      this.naturalWidth = 1;
    }
  }
}

beforeEach(() => {
  FakeImage.instances = [];
  FakeImage.cached.clear();
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

    // The prop is `srcSet` for consistency with `crossOrigin` beside it; the attribute it
    // renders is still the `srcset` the DOM knows.
    it("renders srcSet and sizes on the loaded image", async () => {
      const {container, unmount} = renderVapor(AvatarFixture, {
        props: {sizes: "64px", src: "/jane.png", srcSet: "/jane-2x.png 2x"},
      });

      FakeImage.last?.onload?.();
      await nextTick();

      const image = imageIn(container);

      expect(image?.getAttribute("srcset")).toBe("/jane-2x.png 2x");
      expect(image?.getAttribute("sizes")).toBe("64px");

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

  /**
   * The probe's verdict and the element's own events are two channels on purpose. The probe
   * is the only one that speaks before the `<img>` exists, so it is the only one that can
   * report a failure; the element's events are the only ones that describe the real DOM.
   */
  describe("loading status", () => {
    it("calls loadingStatusChange as the image resolves", async () => {
      const onLoadingStatusChange = vi.fn();
      const {unmount} = renderVapor(AvatarFixture, {
        props: {onLoadingStatusChange, src: "/jane.png"},
      });

      FakeImage.last?.onload?.();
      await nextTick();

      expect(onLoadingStatusChange.mock.calls.map(([status]) => status)).toEqual([
        "loading",
        "loaded",
      ]);

      unmount();
    });

    it("calls loadingStatusChange with error when there is no src", () => {
      const onLoadingStatusChange = vi.fn();
      const {unmount} = renderVapor(AvatarFixture, {props: {onLoadingStatusChange}});

      expect(onLoadingStatusChange).toHaveBeenCalledWith("error");

      unmount();
    });

    it("does not call error when there is no src", () => {
      const onError = vi.fn();
      const {unmount} = renderVapor(AvatarFixture, {props: {onError}});

      // There is no `<img>` to fail, so nothing failed.
      expect(onError).not.toHaveBeenCalled();

      unmount();
    });

    it("never reports idle", async () => {
      const onLoadingStatusChange = vi.fn();
      const {unmount} = renderVapor(AvatarFixture, {
        props: {onLoadingStatusChange, src: "/jane.png"},
      });

      FakeImage.last?.onload?.();
      await nextTick();

      expect(onLoadingStatusChange).not.toHaveBeenCalledWith("idle");

      unmount();
    });

    it("calls load from the rendered image", async () => {
      const onLoad = vi.fn();
      const {container, unmount} = renderVapor(AvatarFixture, {
        props: {onLoad, src: "/jane.png"},
      });

      FakeImage.last?.onload?.();
      await nextTick();

      const image = imageIn(container)!;

      image.dispatchEvent(new Event("load"));

      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onLoad.mock.calls[0]![0].target).toBe(image);

      unmount();
    });

    // The fixture puts the image before the fallback, which is what lets the fallback read an
    // already-loaded status the moment it is created.
    it("renders a cached image without showing the fallback first", () => {
      FakeImage.cached.add("/jane.png");

      const {container, unmount} = renderVapor(AvatarFixture, {props: {src: "/jane.png"}});

      expect(imageIn(container)).not.toBeNull();
      expect(fallbackIn(container)).toBeNull();

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
