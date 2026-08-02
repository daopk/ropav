import {
  DOCS_RENDERED,
  GLOBALS_UPDATED,
  SET_GLOBALS,
  STORY_RENDERED,
} from "storybook/internal/core-events";
import {addons} from "storybook/manager-api";

import {themes} from "../../styles/theme";

import {DEFAULT_THEME, THEME_GLOBAL_TYPE_ID, ensureThemeKey} from "./constants";

/**
 * Theme the Storybook UI along with the preview: the decorator only reaches inside the
 * preview iframe, so without this the chrome around a dark story stays light.
 *
 * The event names have to come from `core-events` — their values are camelCase, so
 * listening for the constant *names* subscribes to events that are never emitted.
 */
addons.register("heroui-theme-manager", (api) => {
  let applied: string | undefined;

  const applyTheme = (theme: string | undefined) => {
    const next = ensureThemeKey(theme);

    // `setConfig` re-renders the whole manager, so only push real changes.
    if (next === applied) return;

    applied = next;
    addons.setConfig({theme: themes[next]});
  };

  const applyGlobals = (globals: Record<string, unknown> | undefined) =>
    applyTheme(globals?.[THEME_GLOBAL_TYPE_ID] as string | undefined);

  // `api.getChannel()` is optional; the store's is not.
  const channel = api.getChannel() ?? addons.getChannel();

  // `setGlobals` carries what the preview booted with, `globalsUpdated` every toolbar
  // change, and a render covers a preview that announced its globals before this ran.
  channel.on(SET_GLOBALS, (payload: {globals?: Record<string, unknown>}) =>
    applyGlobals(payload?.globals),
  );
  channel.on(GLOBALS_UPDATED, (payload: {globals?: Record<string, unknown>}) =>
    applyGlobals(payload?.globals),
  );

  const syncFromApi = () => applyGlobals(api.getGlobals());

  channel.on(STORY_RENDERED, syncFromApi);
  channel.on(DOCS_RENDERED, syncFromApi);

  applyTheme(DEFAULT_THEME);
});
