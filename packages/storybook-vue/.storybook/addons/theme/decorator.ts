import type {Decorator} from "@storybook/vue3-vite";

import {THEME_GLOBAL_TYPE_ID, ensureThemeKey} from "./constants";

/**
 * The theme is selected by CSS, so all this has to do is put the selector on the root
 * element of the preview iframe.
 */
const applyPreviewTheme = (theme: string) => {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme);
  root.classList.remove("light", "dark");
  root.classList.add(theme);
};

/**
 * Applied synchronously rather than through a watcher: Storybook re-runs decorators
 * whenever a global changes, so reading `context.globals` is enough, and the attribute
 * lands before the story renders.
 */
export const withTheme: Decorator = (story, context) => {
  applyPreviewTheme(ensureThemeKey(context.globals[THEME_GLOBAL_TYPE_ID] as string | undefined));

  return story();
};
