import type {CSSProperties} from "vue";

/**
 * Styles that take an element out of sight while leaving it in the accessibility tree
 * and in the tab order.
 *
 * Ported from React Aria's `VisuallyHidden`. A form control that a component draws itself
 * — the checkbox behind a switch, the range input behind a slider thumb — has to stay a
 * real focusable input so the browser keeps handling activation, form submission and
 * reset, and so a screen reader announces it. `display: none` and `visibility: hidden`
 * both remove it from all three.
 *
 * `clip` is deprecated but still carried: `clip-path` is what modern engines honour, while
 * `clip` is the one older WebKit applies. The `1px` box with a `-1px` margin keeps the
 * element from adding scroll width, which `width: 0` would break for screen readers that
 * skip zero-sized nodes.
 */
export const visuallyHiddenStyle: CSSProperties = Object.freeze({
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
});
