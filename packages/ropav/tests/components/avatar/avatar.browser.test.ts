import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { waitUntil } from "../../harness/wait-until";

import Fixture from "./fixtures.vue";

/** A 1×1 PNG. Inline so the case does not depend on a file the test server happens to serve. */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

/** A second one, so a case that needs an uncached image can have one of its own. */
const OTHER_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/7yMK/wAAAABJRU5ErkJggg==";

/** Well-formed as a URL and not as a PNG, so the decode is what fails rather than the request. */
const BROKEN = "data:image/png;base64,bm90LWEtcG5n";

const renderAvatar = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const imageIn = (container: HTMLElement) => container.querySelector("img");
const fallbackIn = (container: HTMLElement) =>
  container.querySelector('[data-slot="avatar-fallback"]');

/** Hold the test open for a while, to show that something does *not* arrive. */
const frames = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  await nextTick();
};

/** Puts a src in the browser's cache, which is the state the interesting case depends on. */
const preload = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const probe = new Image();

    probe.onload = () => resolve();
    probe.onerror = () => reject(new Error(`could not preload ${src}`));
    probe.src = src;
  });

/**
 * The one part of Avatar that no environment but a browser can show.
 *
 * `useImageLoadingStatus` probes a detached `Image`, and jsdom never loads one — so both the jsdom
 * avatar suite and the composable's own suite replace `window.Image` with a `FakeImage`. That works
 * for the branching, but the claim the whole design rests on is one the stub decides rather than
 * shows: that an image already in the cache reports `loaded` **synchronously**, so no fallback ever
 * flashes. Asserting that against a fake written to behave that way proves only that the fake
 * behaves that way.
 *
 * Everything here runs against real images and the browser's real cache.
 */
describe("Avatar (browser)", () => {
  it("swaps the fallback for a real image once it loads", async () => {
    const onLoadingStatusChange = vi.fn();
    const { container, unmount } = renderAvatar({ onLoadingStatusChange, src: OTHER_PIXEL });

    await waitUntil("the image to load", () => imageIn(container) !== null);

    expect(onLoadingStatusChange).toHaveBeenLastCalledWith("loaded");
    expect(fallbackIn(container)).toBeNull();

    unmount();
  });

  /**
   * The claim the stub could never test. The probe is a fresh `Image` every mount, so this only
   * holds if the browser answers it from cache before the first render — which is the entire reason
   * `resolve` reads `complete && naturalWidth` instead of waiting for `onload`.
   */
  it("renders a cached image on the first pass, with no fallback in between", async () => {
    await preload(PIXEL);

    const statuses: string[] = [];
    const { container, unmount } = renderAvatar({
      onLoadingStatusChange: (status: string) => statuses.push(status),
      src: PIXEL,
    });

    // No waiting at all: the assertion is that the image is already there.
    expect(imageIn(container)).not.toBeNull();
    expect(fallbackIn(container)).toBeNull();
    expect(statuses).toEqual(["loaded"]);

    unmount();
  });

  it("keeps the fallback when a real image fails to decode", async () => {
    const onLoadingStatusChange = vi.fn();
    const { container, unmount } = renderAvatar({ onLoadingStatusChange, src: BROKEN });

    await waitUntil("the image to fail", () =>
      onLoadingStatusChange.mock.calls.some(([status]) => status === "error"),
    );

    expect(imageIn(container)).toBeNull();
    expect(fallbackIn(container)).not.toBeNull();

    unmount();
  });

  it("reports no verdict at all when there is no src", () => {
    const onLoadingStatusChange = vi.fn();
    const { container, unmount } = renderAvatar({ onLoadingStatusChange });

    // A missing src is an error rather than a silence: it is the state that shows the fallback.
    expect(onLoadingStatusChange).toHaveBeenCalledWith("error");
    expect(imageIn(container)).toBeNull();
    expect(fallbackIn(container)).not.toBeNull();

    unmount();
  });

  /**
   * The invariant, not the mechanism: whatever order the resolutions arrive in, the status ends up
   * describing the src the caller currently holds — going from broken to good must not leave the
   * fallback sitting over a perfectly good image.
   *
   * The guard on `requested` that exists for this is **not** what this case proves, and no case
   * here can. Assigning `image.src` aborts the request already in flight, so with two data URIs the
   * abandoned `error` never fires at all and the guard is never consulted. Showing it would need a
   * response slow enough to land after the switch, which means a controllable server rather than a
   * URL. Recorded rather than faked with a gesture that only looks like it.
   */
  it("keeps the status describing the src the caller holds", async () => {
    const statuses: string[] = [];
    const props = reactive({
      onLoadingStatusChange: (status: string) => statuses.push(status),
      src: BROKEN as string,
    });
    const { container, unmount } = renderAvatar(props);

    props.src = OTHER_PIXEL;

    await waitUntil("the second src to resolve", () => imageIn(container) !== null);

    expect(statuses.at(-1)).toBe("loaded");
    expect(fallbackIn(container)).toBeNull();

    // Held open past the point where a late `error` for the abandoned src would arrive. Without
    // the guard on `requested`, that resolution lands here and puts the fallback back over an
    // image that loaded perfectly well.
    await frames(10);

    expect(statuses.at(-1)).toBe("loaded");
    expect(imageIn(container)).not.toBeNull();

    unmount();
  });

  /**
   * Vapor routes `alt` through `setDOMProp`, which returns early when the new value equals what the
   * element already reports — and an `img` with no `alt` attribute already reports `""`. So the
   * empty default never reaches the DOM unless it is written by hand, and the attribute goes
   * missing altogether, which is the one state that is always wrong. Asserted on a real `<img>`
   * that really loaded, which is the only place a consumer meets it.
   */
  it("writes an empty alt onto a real image rather than omitting it", async () => {
    const { container, unmount } = renderAvatar({ src: OTHER_PIXEL });

    await waitUntil("the image to load", () => imageIn(container) !== null);

    const image = imageIn(container)!;

    expect(image.hasAttribute("alt")).toBe(true);
    expect(image.getAttribute("alt")).toBe("");

    unmount();
  });

  it("carries a given alt through to the loaded image", async () => {
    const { container, unmount } = renderAvatar({ alt: "Jane Doe", src: OTHER_PIXEL });

    await waitUntil("the image to load", () => imageIn(container) !== null);

    expect(imageIn(container)).toHaveAttribute("alt", "Jane Doe");

    unmount();
  });

  it("has no axe violations with a real image or with the fallback", async () => {
    const loaded = renderAvatar({ src: OTHER_PIXEL });

    await waitUntil("the image to load", () => imageIn(loaded.container) !== null);
    // `image-alt` is looking for exactly the `alt` written by hand above, and only a loaded image
    // has one to look at.
    await expectNoA11yViolations(loaded.container, PALETTE_CONTRAST_DEBT);

    loaded.unmount();

    const fallback = renderAvatar({ src: BROKEN });

    await waitUntil("the fallback to show", () => fallbackIn(fallback.container) !== null);
    await expectNoA11yViolations(fallback.container, PALETTE_CONTRAST_DEBT);

    fallback.unmount();
  });
});
