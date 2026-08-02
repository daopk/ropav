import {beforeEach, describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useImageLoadingStatus} from "@/composables/use-image-loading-status";

/** Stand-in for `window.Image`, which jsdom never actually loads. */
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

const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

beforeEach(() => {
  FakeImage.instances = [];
  window.Image = FakeImage as unknown as typeof window.Image;
});

describe("useImageLoadingStatus", () => {
  it("reports error when there is no src, so the fallback renders", () => {
    const [status, dispose] = withScope(() => useImageLoadingStatus(undefined));

    expect(status.value).toBe("error");

    dispose();
  });

  it("reports loading as soon as a src is given", () => {
    const [status, dispose] = withScope(() => useImageLoadingStatus("/avatar.png"));

    expect(status.value).toBe("loading");
    expect(FakeImage.last?.src).toBe("/avatar.png");

    dispose();
  });

  it("reports loaded when the image resolves", () => {
    const [status, dispose] = withScope(() => useImageLoadingStatus("/avatar.png"));

    FakeImage.last?.onload?.();

    expect(status.value).toBe("loaded");

    dispose();
  });

  it("reports error when the image fails", () => {
    const [status, dispose] = withScope(() => useImageLoadingStatus("/broken.png"));

    FakeImage.last?.onerror?.();

    expect(status.value).toBe("error");

    dispose();
  });

  it("forwards crossOrigin and referrerPolicy to the probe image", () => {
    const [, dispose] = withScope(() =>
      useImageLoadingStatus("/avatar.png", {
        crossOrigin: "anonymous",
        referrerPolicy: "no-referrer",
      }),
    );

    expect(FakeImage.last?.crossOrigin).toBe("anonymous");
    expect(FakeImage.last?.referrerPolicy).toBe("no-referrer");

    dispose();
  });

  it("restarts the probe when the src changes", async () => {
    const src = shallowRef<string | undefined>("/first.png");
    const [status, dispose] = withScope(() => useImageLoadingStatus(src));

    src.value = "/second.png";
    await nextTick();

    expect(FakeImage.instances).toHaveLength(2);
    expect(FakeImage.last?.src).toBe("/second.png");
    expect(status.value).toBe("loading");

    dispose();
  });

  it("ignores a resolution from a stale probe", async () => {
    const src = shallowRef<string | undefined>("/first.png");
    const [status, dispose] = withScope(() => useImageLoadingStatus(src));

    const stale = FakeImage.last;

    src.value = "/second.png";
    await nextTick();

    stale?.onload?.();

    expect(status.value).toBe("loading");

    dispose();
  });
});
