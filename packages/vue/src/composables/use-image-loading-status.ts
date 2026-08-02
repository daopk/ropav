import type {MaybeRefOrGetter, ShallowRef} from "vue";

import {shallowRef, toValue, watchEffect} from "vue";

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
 * image and fallback without a flash of either. A missing `src` resolves to `"error"`,
 * the state that shows the fallback. Stays `"idle"` when there is no DOM.
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

  watchEffect((onCleanup) => {
    const source = toValue(src);

    if (!source) {
      status.value = "error";

      return;
    }

    const referrerPolicy = toValue(options.referrerPolicy);
    const crossOrigin = toValue(options.crossOrigin);

    let isActive = true;
    const image = new window.Image();

    status.value = "loading";

    image.onload = () => {
      if (isActive) status.value = "loaded";
    };
    image.onerror = () => {
      if (isActive) status.value = "error";
    };

    if (referrerPolicy) image.referrerPolicy = referrerPolicy;
    if (crossOrigin !== undefined) image.crossOrigin = crossOrigin;

    // Assigning `src` last starts the request with every attribute already in place.
    image.src = source;

    onCleanup(() => {
      isActive = false;
    });
  });

  return status;
};
