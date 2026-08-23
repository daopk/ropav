/**
 * Content that sits above the page's layers without belonging to any of them.
 *
 * A toast region is rendered outside every overlay, yet it is not *outside* them in the sense
 * either of them cares about: it must stay readable to assistive technology when a modal opens,
 * and pressing something in it must not dismiss the overlay it happens to be drawn over. Marking
 * the element is what lets both those rules be written once. React Aria spells the same marker
 * `data-react-aria-top-layer`.
 */
export const TOP_LAYER_ATTRIBUTE = "data-ropav-top-layer";

export const TOP_LAYER_SELECTOR = `[${TOP_LAYER_ATTRIBUTE}]`;

/** Whether an element sits inside a top layer, and so is exempt from both rules above. */
export const isInTopLayer = (element: Element): boolean =>
  element.closest(TOP_LAYER_SELECTOR) != null;
