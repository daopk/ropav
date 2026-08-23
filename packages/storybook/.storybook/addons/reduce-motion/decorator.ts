import type { Decorator } from "@storybook/vue3-vite";

import { REDUCE_MOTION_GLOBAL_TYPE_ID } from "./constants";

/**
 * `data-reduce-motion="true"` is a real hook: `@ropav/styles` declares a custom variant
 * in `variants/index.css` that makes it take priority over the OS-level
 * `prefers-reduced-motion` media query.
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
