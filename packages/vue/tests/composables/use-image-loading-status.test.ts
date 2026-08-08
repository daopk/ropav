import {beforeEach, describe, expect, it} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {useImageLoadingStatus} from "@/composables/use-image-loading-status";

/** Stand-in for `window.Image`, which jsdom never actually loads. */
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

  /** What `crossOrigin` was at the moment the request started, so the ordering is provable. */
  crossOriginAtRequest: string | null = null;

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
    this.crossOriginAtRequest = this.crossOrigin;

    if (FakeImage.cached.has(value)) {
      this.complete = true;
      this.naturalWidth = 1;
    }
  }
}

const withScope = <T>(setup: () => T): [T, () => void] => {
  const scope = effectScope();
  const result = scope.run(setup) as T;

  return [result, () => scope.stop()];
};

beforeEach(() => {
  FakeImage.instances = [];
  FakeImage.cached.clear();
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

  // The whole point of probing rather than rendering and hoping: a src the browser already
  // holds is usable now, so nothing should ever ask for a fallback. No tick, on purpose.
  it("reports loaded without waiting when the image is already cached", () => {
    FakeImage.cached.add("/cached.png");

    const [status, dispose] = withScope(() => useImageLoadingStatus("/cached.png"));

    expect(status.value).toBe("loaded");

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

  it("applies crossOrigin before it starts the request", () => {
    const [, dispose] = withScope(() =>
      useImageLoadingStatus("/avatar.png", {crossOrigin: "anonymous"}),
    );

    // Set afterwards, the attribute would apply to a request already in flight.
    expect(FakeImage.last?.crossOriginAtRequest).toBe("anonymous");

    dispose();
  });

  it("points the same probe at a new src", async () => {
    const src = shallowRef<string | undefined>("/first.png");
    const [status, dispose] = withScope(() => useImageLoadingStatus(src));

    src.value = "/second.png";
    await nextTick();

    // One probe for the scope: assigning a new src is what aborts the previous request.
    expect(FakeImage.instances).toHaveLength(1);
    expect(FakeImage.last?.src).toBe("/second.png");
    expect(status.value).toBe("loading");

    dispose();
  });

  it("keeps the probe when the src round-trips back", async () => {
    const src = shallowRef<string | undefined>("/first.png");
    const [, dispose] = withScope(() => useImageLoadingStatus(src));

    src.value = undefined;
    await nextTick();
    src.value = "/first.png";
    await nextTick();

    // The request was never aborted, so there is nothing to start again.
    expect(FakeImage.instances).toHaveLength(1);
    expect(FakeImage.last?.src).toBe("/first.png");

    dispose();
  });

  it("ignores a resolution for a src it no longer wants", async () => {
    const src = shallowRef<string | undefined>("/first.png");
    const [status, dispose] = withScope(() => useImageLoadingStatus(src));

    // The window this closes: props have moved on but the watcher has not flushed yet, so
    // the probe is still pointed at the old src when its resolution arrives.
    src.value = "/second.png";
    FakeImage.last?.onload?.();

    expect(status.value).toBe("loading");

    await nextTick();

    expect(FakeImage.last?.src).toBe("/second.png");
    expect(status.value).toBe("loading");

    dispose();
  });

  it("stops reporting once the scope is disposed", () => {
    const [status, dispose] = withScope(() => useImageLoadingStatus("/avatar.png"));

    // Captured before disposing, so what is proven is the guard rather than the detach.
    const load = FakeImage.last!.onload!;

    dispose();
    load();

    expect(status.value).toBe("loading");
  });
});
