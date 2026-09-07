import type { Decorator } from "@storybook/vue3-vite";

import { REDUCE_MOTION_GLOBAL_TYPE_ID } from "./constants";

/**
 * `data-reduce-motion="true"` is a real hook: `motion.css` sets `--rp-motion` from the attribute,
 * after the `prefers-reduced-motion` query and at the same specificity, so an explicit answer
 * outranks the system's one and the nearest ancestor that gave one is what every animated
 * declaration reads.
 */
export const withReduceMotion: Decorator = (story, context) => {
  const root = document.documentElement;

  if (context.globals[REDUCE_MOTION_GLOBAL_TYPE_ID] === "true") {
    root.setAttribute("data-reduce-motion", "true");
  } else {
    root.removeAttribute("data-reduce-motion");
  }

  return story();
};
