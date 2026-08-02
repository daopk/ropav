import {addons} from "storybook/manager-api";

import {themes} from "../../styles/theme";

import {DEFAULT_THEME, THEME_GLOBAL_TYPE_ID, ensureThemeKey} from "./constants";

/**
 * Theme the Storybook UI along with the preview.
 *
 * The decorator only reaches inside the preview iframe, so without this the chrome
 * around a dark story stays light. The theme is read from the same global the toolbar
 * writes, and reapplied on the lifecycle events that would otherwise reset the config
 * back to its default.
 */
addons.register("heroui-theme-manager", (api) => {
  let lastTheme = DEFAULT_THEME;

  const applyTheme = (theme: string | undefined) => {
    lastTheme = ensureThemeKey(theme);
    addons.setConfig({theme: themes[lastTheme]});
  };

  const init = () => {
    const channel = api.getChannel() ?? addons.getChannel();

    if (!channel) {
      setTimeout(init, 100);

      return;
    }

    applyTheme(api.getGlobals?.()?.[THEME_GLOBAL_TYPE_ID] as string | undefined);

    channel.on("GLOBALS_UPDATED", (payload: {globals?: Record<string, unknown>}) => {
      applyTheme(payload?.globals?.[THEME_GLOBAL_TYPE_ID] as string | undefined);
    });

    for (const event of ["STORIES_CONFIGURED", "STORY_RENDERED", "DOCS_RENDERED"]) {
      channel.on(event, () => applyTheme(lastTheme));
    }
  };

  init();
});
