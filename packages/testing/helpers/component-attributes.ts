/**
 * Every `data-*` a component writes, split by what a sweep is supposed to do with it.
 *
 * Two sweeps ask the same question from opposite ends. `state-colors.test.ts` wants to know which
 * selectors are states, because a colour painted in more than one of them has to go through a
 * custom property or no caller can reach it. The Storybook forced-colors audit wants to know which
 * elements wear a variant, because one that paints a filled box has to keep painting something
 * when the mode strips its colours. Each used to carry its own idea of the answer, and one of them
 * carried it as a pattern over class names — which stops matching the day a variant is written as
 * an attribute instead, and a sweep that matches nothing reports nothing wrong.
 *
 * So the answer is written once, here, as two lists that between them have to name everything the
 * stylesheet uses. Neither list is a filter that can quietly go stale: `state-colors.test.ts`
 * fails on an attribute that appears in a rule and in neither list, which is what makes adding one
 * a decision rather than a default.
 *
 * The split is by what the attribute answers, not by how it is spelled. A state is something the
 * component is doing or has had done to it — pointer, focus, selection, validity, a transition in
 * flight. Configuration is what it was built as: which slot, which way round, which corner it
 * opens towards, whether its scroller is at an end.
 */

/**
 * The component is in this condition now, and could leave it without being rebuilt.
 *
 * `outside-month` and `today` are the calendar's version of that — a cell's relationship to the
 * month around it, which changes as the user pages through. `entering` and `exiting` are the
 * exception that proves the split: a transition is certainly something happening, but nothing
 * paints a resting colour under one, and treating them as configuration is what keeps an
 * animation's own declarations out of the colour audit.
 */
export const STATE_ATTRIBUTES = [
  "active",
  "collapsible",
  "current",
  "disabled",
  "drop-target",
  "dragging",
  "empty",
  "expanded",
  "fill-end",
  "fill-start",
  "filled",
  "focus",
  "focus-visible",
  "focus-within",
  "focused",
  "frontmost",
  "hidden",
  "hovered",
  "indeterminate",
  "invalid",
  "open",
  "outside-month",
  "pending",
  "placeholder",
  "pressed",
  "required",
  "resizing",
  "restoring",
  "selected",
  "selection-end",
  "selection-start",
  "status",
  "today",
  "tree-column",
  "unavailable",
  "visible",
] as const;

/**
 * What the component was built as, and what a caller chose when building it.
 *
 * The variant names a migration introduces belong here — `variant`, `color`, `size` are the shape
 * a modifier class takes once it is an attribute, and they pick an appearance the same way the
 * class did.
 */
export const CONFIGURATION_ATTRIBUTES = [
  "allows-sorting",
  "bottom-scroll",
  "collapsed",
  "color",
  "default-icon",
  "direction",
  "entering",
  "exiting",
  "has-child-items",
  "has-submenu",
  "hide-separator",
  "layout",
  "left-right-scroll",
  "left-scroll",
  "level",
  "light-color",
  "orientation",
  "placement",
  "reduce-motion",
  "right-scroll",
  "selection-mode",
  "side",
  "size",
  "slot",
  "swapped",
  "theme",
  "top-bottom-scroll",
  "top-scroll",
  "type",
  "variant",
  "vibrant-palette",
] as const;

/**
 * The ones that say what an element looks like, which is the population the forced-colors audit
 * holds to still painting something.
 *
 * A subset of the configuration above rather than all of it: `slot` names a part, `placement` a
 * direction, `orientation` an axis, and none of the three decides a colour. These three do, and
 * they are what a modifier class becomes.
 */
export const VARIANT_ATTRIBUTES = ["color", "size", "variant"] as const;
