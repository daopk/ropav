import type { Decorator } from "@storybook/vue3-vite";

import {
  SCHEME_GLOBAL_TYPE_ID,
  THEME_GLOBAL_TYPE_ID,
  ensureSchemeKey,
  ensureThemeKey,
} from "./constants";

/**
 * The theme is selected by CSS, so all this has to do is put the selectors on the root
 * element of the preview iframe.
 *
 * Two independent selectors: `data-theme` carries the palette, the class carries the
 * appearance. The stylesheet reads them as `[data-theme="netflix"].dark`.
 */
const applyPreviewTheme = (theme: string, scheme: string) => {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme);
  root.classList.remove("light", "dark");
  root.classList.add(scheme);
};

/**
 * Applied synchronously rather than through a watcher: Storybook re-runs decorators
 * whenever a global changes, so reading `context.globals` is enough, and the attribute
 * lands before the story renders.
 */
export const withTheme: Decorator = (story, context) => {
  applyPreviewTheme(
    ensureThemeKey(context.globals[THEME_GLOBAL_TYPE_ID] as string | undefined),
    ensureSchemeKey(context.globals[SCHEME_GLOBAL_TYPE_ID] as string | undefined),
  );

  return story();
};
