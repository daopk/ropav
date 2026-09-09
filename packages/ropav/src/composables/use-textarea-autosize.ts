import type { MaybeRefOrGetter } from "vue";

import { onScopeDispose, toValue, watch } from "vue";

export interface UseTextareaAutosizeOptions {
  element: MaybeRefOrGetter<HTMLTextAreaElement | null | undefined>;
  /** When false, inline height and overflow are cleared and the native `rows` height is used. */
  enabled: MaybeRefOrGetter<boolean | undefined>;
  /** Floor, in rows. Ignored when `enabled` is false. */
  minRows: MaybeRefOrGetter<number | undefined>;
  /** Ceiling, in rows. Absent, the control grows without a cap. Ignored when `enabled` is false. */
  maxRows: MaybeRefOrGetter<number | undefined>;
  /**
   * Extra sources that should remeasure. Reading `element.value` is not reactive, so the
   * caller passes the text it holds — its own `value` prop, or the surrounding field's.
   */
  content?: MaybeRefOrGetter<unknown>;
}

export interface UseTextareaAutosizeSyncOptions {
  /**
   * From `input` only. A caret at the end then keeps the last line's padding in view.
   * Layout remasures omit this so a scroll the user made is not stolen.
   */
  fromInput?: boolean;
}

export interface UseTextareaAutosizeReturn {
  /** Measure now. Needed from `input`, where the DOM already holds the next text. */
  sync: (options?: UseTextareaAutosizeSyncOptions) => void;
}

const px = (value: string): number => {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * A used line-height, not the keyword.
 *
 * `normal` is a computed value the platform leaves unresolved, and a row count in `normal`s is
 * not a length. Font-size times 1.2 is the usual stand-in, and is what a missing font-size falls
 * back through as well.
 */
const lineHeightOf = (style: CSSStyleDeclaration): number => {
  const raw = style.lineHeight;
  const parsed = Number.parseFloat(raw);

  if (raw !== "normal" && Number.isFinite(parsed)) return parsed;

  const fontSize = Number.parseFloat(style.fontSize);

  return Number.isFinite(fontSize) ? fontSize * 1.2 : 16;
};

const positive = (value: number | undefined): number | undefined =>
  value !== undefined && value > 0 ? value : undefined;

const clear = (element: HTMLTextAreaElement) => {
  element.style.height = "";
  element.style.overflowY = "";
  element.style.scrollPaddingBottom = "";
};

/**
 * Content-box width, the same box ResizeObserver reports as `contentRect`.
 *
 * `clientWidth` is the padding box minus the scrollbar, so subtracting inline
 * padding lands on the content box without mixing in the border the way
 * `getBoundingClientRect` does.
 */
const contentWidthOf = (element: HTMLTextAreaElement): number => {
  const style = getComputedStyle(element);

  return element.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
};

/** `document.fonts`, or nothing on the server — where `document` itself is missing. */
const fontFaceSet = (): FontFaceSet | undefined => {
  if (typeof document === "undefined") return undefined;

  return document.fonts;
};

/**
 * Size a textarea to its content, clamped to a row range.
 *
 * Measured on the live element rather than a hidden clone: the clone is how `react-textarea-autosize`
 * (and HeroUI v2) leaked an extra node into the document, and the live element already has the
 * font, the padding and the wrapping width. Height is set to `auto` for the read so a previous
 * inline height cannot pin `scrollHeight` to itself, then written back as a pixel height.
 *
 * `scrollHeight` includes padding and not the border. The reset is `border-box`, so the height
 * that is written has to put the border back or the last line is clipped by that much.
 *
 * The bottom-pin is input-only. Typing at the end has to bring `padding-bottom` into view;
 * a width, font or row-range remasure must not yank a scroll the user just made.
 *
 * @returns Whether `maxRows` clamped the height, which is the one case where a field left
 * scrolling its own content is doing what it was asked to.
 */
const measure = (
  element: HTMLTextAreaElement,
  minRows: number | undefined,
  maxRows: number | undefined,
  fromInput: boolean,
): boolean => {
  const style = getComputedStyle(element);
  const paddingY = px(style.paddingTop) + px(style.paddingBottom);
  const borderY = px(style.borderTopWidth) + px(style.borderBottomWidth);
  const lineHeight = lineHeightOf(style);
  const borderBox = style.boxSizing === "border-box";
  const extras = borderBox ? paddingY + borderY : 0;
  const min = positive(minRows);
  const max = positive(maxRows);
  const paddingBottom = px(style.paddingBottom);
  const scrollTop = element.scrollTop;
  const atEnd =
    element.selectionStart === element.value.length &&
    element.selectionEnd === element.value.length;

  // So the native rows height matches the floor we are about to measure against, rather
  // than the UA default of two.
  if (min !== undefined) element.rows = min;

  element.style.height = "auto";
  element.style.overflowY = "hidden";

  let height = element.scrollHeight;

  if (borderBox) height += borderY;
  else height -= paddingY;

  if (min !== undefined) height = Math.max(height, min * lineHeight + extras);

  let capped = false;

  if (max !== undefined) {
    const cap = max * lineHeight + extras;

    if (height > cap) {
      height = cap;
      capped = true;
    }
  }

  element.style.height = `${height}px`;
  // `auto` whether or not a cap clamped, so a stale inline height — used line-height
  // moved and the pinned box never notified the observer — lets the extra glyphs scroll
  // into view instead of clipping them. A field that exactly fits grows no scrollbar:
  // the height written above is `scrollHeight` plus the border, so `clientHeight` lands
  // back on `scrollHeight`.
  element.style.overflowY = "auto";
  // The caret-following scroll stops at the last line, which in a textarea sits on the
  // padding-box edge — so the last glyphs kiss the border. `scroll-padding` keeps that
  // inset when the UA scrolls for the caret; pinning `scrollTop` when the caret is at
  // the end is what actually brings `padding-bottom` into view.
  element.style.scrollPaddingBottom = `${paddingBottom}px`;

  if (fromInput && capped && atEnd) element.scrollTop = element.scrollHeight;
  else element.scrollTop = scrollTop;

  return capped;
};

/**
 * Keep a textarea as tall as its content, optionally between `minRows` and `maxRows`.
 *
 * The caller has to invoke {@link UseTextareaAutosizeReturn.sync} from `input`: reading
 * `element.value` inside a getter is not a reactive dependency, and waiting for a post-flush
 * watch would size against the previous stroke. Controlled values and `minRows` / `maxRows`
 * changes go through the watch, which is post-flush so it runs after `setFormValue` has put
 * the pinned text back.
 *
 * Observers attach only while autosize is on. Native `resize` writes inline `width` and
 * `height` as the pointer drags; an observer that stayed attached with autosize off would
 * `clear` that height on every width change and fight the handle.
 *
 * Width is taken from `contentRect`, and seeded up front from the same content box
 * (`clientWidth` minus inline padding). Seeding from `getBoundingClientRect` mixed in the
 * border, so the loop guard always failed and every mount paid a second layout. Skipping
 * the first delivery instead ate a real shrink: `sync` after `observe` can make a scrollbar
 * appear, the first callback reports the narrower width, and treating that as a seed left
 * wrapped text clipped. Writing `style.height` is itself a size change, and an observer
 * that did not discriminate width would loop.
 *
 * An inline height also hides height-only metric changes from the observer — a webfont that
 * lands after first paint, or `.rp-textarea`'s `@media (width >= 40rem)` type/padding switch
 * on a fixed-width control. Those go through `document.fonts` and `window` `resize`. Used
 * metrics that do not move the box (`--rp-leading`, Firefox text-only zoom) never notify at
 * all, which is why every field settles with `overflow-y: auto` — a stale height then
 * scrolls rather than clips. A leftover clip on a field no cap clamped is the observer
 * backstop for same-width box changes such as padding, which do notify.
 */
export const useTextareaAutosize = (
  options: UseTextareaAutosizeOptions,
): UseTextareaAutosizeReturn => {
  let observer: ResizeObserver | undefined;
  let lastWidth = Number.NaN;
  /** So turning autosize off does not wipe a height the native resize handle wrote. */
  let applied = false;
  /** Whether `maxRows` clamped the last measure, which is when a clip is meant to be there. */
  let capped = false;

  const sync = (syncOptions?: UseTextareaAutosizeSyncOptions) => {
    const element = toValue(options.element) ?? null;
    const enabled = Boolean(toValue(options.enabled));

    if (!element) return;

    if (!enabled) {
      if (applied) {
        clear(element);
        applied = false;
      }

      return;
    }

    capped = measure(
      element,
      toValue(options.minRows),
      toValue(options.maxRows),
      Boolean(syncOptions?.fromInput),
    );
    applied = true;
  };

  const onMetrics = () => {
    sync();
  };

  const detach = () => {
    observer?.disconnect();
    observer = undefined;
    lastWidth = Number.NaN;

    if (typeof window !== "undefined") window.removeEventListener("resize", onMetrics);

    fontFaceSet()?.removeEventListener("loadingdone", onMetrics);
  };

  const observe = (element: HTMLTextAreaElement) => {
    detach();

    if (typeof ResizeObserver !== "undefined") {
      lastWidth = contentWidthOf(element);

      observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;

        if (width === undefined) return;

        const widthChanged = width !== lastWidth;

        lastWidth = width;

        if (widthChanged) {
          sync();

          return;
        }

        // Same-width box change (padding) that started clipping a field no cap clamped.
        // Used-metric changes never reach here: the pinned height holds the border box
        // still, so this observer does not fire, and `auto` leaves them scrollable.
        if (!capped && element.scrollHeight > element.clientHeight) sync();
      });
      observer.observe(element);
    }

    if (typeof window !== "undefined")
      window.addEventListener("resize", onMetrics, { passive: true });

    fontFaceSet()?.addEventListener("loadingdone", onMetrics);
  };

  watch(
    [() => toValue(options.element) ?? null, () => Boolean(toValue(options.enabled))],
    ([element, enabled]) => {
      detach();

      if (!element) return;

      if (enabled) observe(element);

      sync();
    },
    { flush: "post", immediate: true },
  );

  watch(
    [
      () => toValue(options.minRows),
      () => toValue(options.maxRows),
      () => toValue(options.content),
    ],
    () => {
      sync();
    },
    { flush: "post" },
  );

  onScopeDispose(detach, true);

  return { sync };
};
