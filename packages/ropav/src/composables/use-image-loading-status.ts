import type { MaybeRefOrGetter, ShallowRef } from "vue";

import { onScopeDispose, shallowRef, toValue, watch } from "vue";

export type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

export interface UseImageLoadingStatusOptions {
  /** Forwarded to the probe image, so the request matches the one the `<img>` makes. */
  crossOrigin?: MaybeRefOrGetter<string | undefined>;
  /** Forwarded to the probe image. */
  referrerPolicy?: MaybeRefOrGetter<ReferrerPolicy | undefined>;
}

/**
 * Track whether an image loads, so a component can swap in a fallback.
 *
 * Loading is probed with a detached `Image`, which is what lets Avatar decide between
 * image and fallback without a flash of either. An image already in the browser cache is
 * reported as `"loaded"` synchronously, so it never shows a fallback at all. A missing
 * `src` resolves to `"error"`, the state that shows the fallback. Stays `"idle"` when
 * there is no DOM.
 *
 * @example
 * ```ts
 * const status = useImageLoadingStatus(() => props.src);
 * // status.value === "loaded" -> render the image, otherwise the fallback
 * ```
 */
export const useImageLoadingStatus = (
  src: MaybeRefOrGetter<string | undefined>,
  options: UseImageLoadingStatusOptions = {},
): Readonly<ShallowRef<ImageLoadingStatus>> => {
  const status = shallowRef<ImageLoadingStatus>("idle");

  if (typeof window === "undefined") return status;

  // One probe for the whole scope. Pointing it at a new src aborts the request it was
  // already making, which a fresh `Image` per src could never do.
  const image = new window.Image();

  /**
   * The src the probe was last pointed at.
   *
   * Tracked separately because `image.src` reads back resolved against the document, so it
   * can never be compared with the value a caller passed.
   */
  let requested: string | undefined;
  let isLive = true;

  const resolve = (source: string | undefined): ImageLoadingStatus => {
    // `requested` deliberately keeps the src it already held. Clearing it would make the
    // guard below compare `undefined` against `undefined` and let a resolution belonging to
    // the abandoned src through.
    if (!source) return "error";

    const referrerPolicy = toValue(options.referrerPolicy);
    const crossOrigin = toValue(options.crossOrigin);

    // Attributes before `src`, so the request starts with every one of them in place. Only
    // the first request for a given src is affected: pointing the probe at a src it already
    // holds does not re-fetch, so changing an attribute alone applies without a new request.
    if (referrerPolicy) image.referrerPolicy = referrerPolicy;
    if (crossOrigin !== undefined) image.crossOrigin = crossOrigin;

    if (requested !== source) {
      requested = source;
      image.src = source;
    }

    // An image already in the cache is complete right here, so the caller can render it on
    // the very first pass instead of showing a fallback for one tick.
    return image.complete && image.naturalWidth > 0 ? "loaded" : "loading";
  };

  const settle = (next: ImageLoadingStatus) => () => {
    // A resolution for a src the caller has already moved on from must not win, and a
    // disposed scope must not be written to at all.
    if (!isLive || requested !== toValue(src)) return;

    status.value = next;
  };

  image.onload = settle("loaded");
  image.onerror = settle("error");

  // Seeded here rather than through `{immediate: true}` so the first status is in place
  // before anything renders, and so the watch source stays a pure read — `resolve` assigns
  // `image.src`, and the scheduler may re-run a source getter just to track it.
  status.value = resolve(toValue(src));

  watch(
    () => [toValue(src), toValue(options.crossOrigin), toValue(options.referrerPolicy)] as const,
    ([source]) => {
      status.value = resolve(source);
    },
  );

  onScopeDispose(() => {
    isLive = false;
    image.onload = null;
    image.onerror = null;
  });

  return status;
};
