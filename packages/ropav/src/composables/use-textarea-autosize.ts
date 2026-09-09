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

export interface UseTextareaAutosizeReturn {
  /** Measure now. Needed from `input`, where the DOM already holds the next text. */
  sync: () => void;
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
 * Size a textarea to its content, clamped to a row range.
 *
 * Measured on the live element rather than a hidden clone: the clone is how `react-textarea-autosize`
 * (and HeroUI v2) leaked an extra node into the document, and the live element already has the
 * font, the padding and the wrapping width. Height is set to `auto` for the read so a previous
 * inline height cannot pin `scrollHeight` to itself, then written back as a pixel height.
 *
 * `scrollHeight` includes padding and not the border. The reset is `border-box`, so the height
 * that is written has to put the border back or the last line is clipped by that much.
 */
const measure = (
  element: HTMLTextAreaElement,
  minRows: number | undefined,
  maxRows: number | undefined,
) => {
  const style = getComputedStyle(element);
  const paddingY = px(style.paddingTop) + px(style.paddingBottom);
  const borderY = px(style.borderTopWidth) + px(style.borderBottomWidth);
  const lineHeight = lineHeightOf(style);
  const borderBox = style.boxSizing === "border-box";
  const extras = borderBox ? paddingY + borderY : 0;
  const min = positive(minRows);
  const max = positive(maxRows);
  const paddingBottom = px(style.paddingBottom);
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

  let overflowY = "hidden";

  if (max !== undefined) {
    const cap = max * lineHeight + extras;

    if (height > cap) {
      height = cap;
      overflowY = "auto";
    }
  }

  element.style.height = `${height}px`;
  element.style.overflowY = overflowY;
  // The caret-following scroll stops at the last line, which in a textarea sits on the
  // padding-box edge — so the last glyphs kiss the border. `scroll-padding` keeps that
  // inset when the UA scrolls for the caret; pinning `scrollTop` when the caret is at
  // the end is what actually brings `padding-bottom` into view.
  element.style.scrollPaddingBottom = overflowY === "auto" ? `${paddingBottom}px` : "";

  if (overflowY === "auto" && atEnd) element.scrollTop = element.scrollHeight;
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
 * Width is observed rather than height. Writing `style.height` is itself a size change, and
 * an observer that did not discriminate would loop.
 */
export const useTextareaAutosize = (
  options: UseTextareaAutosizeOptions,
): UseTextareaAutosizeReturn => {
  let observer: ResizeObserver | undefined;
  let lastWidth = Number.NaN;

  const detach = () => {
    observer?.disconnect();
    observer = undefined;
    lastWidth = Number.NaN;
  };

  const sync = () => {
    const element = toValue(options.element) ?? null;
    const enabled = Boolean(toValue(options.enabled));

    if (!element || !enabled) {
      if (element) clear(element);

      return;
    }

    measure(element, toValue(options.minRows), toValue(options.maxRows));
  };

  const observe = (element: HTMLTextAreaElement | null) => {
    detach();

    if (!element || typeof ResizeObserver === "undefined") return;

    lastWidth = element.getBoundingClientRect().width;

    observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;

      if (width === undefined || width === lastWidth) return;

      lastWidth = width;
      sync();
    });
    observer.observe(element);
  };

  watch(
    () => toValue(options.element) ?? null,
    (element) => {
      observe(element);
      sync();
    },
    { flush: "post", immediate: true },
  );

  watch(
    [
      () => toValue(options.enabled),
      () => toValue(options.minRows),
      () => toValue(options.maxRows),
      () => toValue(options.content),
    ],
    sync,
    { flush: "post" },
  );

  onScopeDispose(detach, true);

  return { sync };
};
