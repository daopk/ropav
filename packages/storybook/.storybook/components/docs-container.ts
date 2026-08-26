import { DocsContainer as StorybookDocsContainer } from "@storybook/addon-docs/blocks";

import { SCHEME_GLOBAL_TYPE_ID, ensureSchemeKey } from "../addons/theme/constants";
import { themes } from "../styles/theme";

type DocsContext = Parameters<typeof StorybookDocsContainer>[0]["context"];

/**
 * The docs page frame renders before the stories inside it, so the decorator has not run
 * yet and the globals have to come from the docs context instead.
 */
const readScheme = (context: DocsContext) => {
  try {
    const { globals } = context.getStoryContext(context.storyById());

    return ensureSchemeKey(globals[SCHEME_GLOBAL_TYPE_ID] as string | undefined);
  } catch {
    return ensureSchemeKey(undefined);
  }
};

/**
 * Themes the documentation page along with the stories it frames.
 *
 * Without this the preview follows the toolbar but the page around it — background,
 * prose, the props table, the chrome of every story preview — stays on Storybook's
 * default light theme, which reads as dark mode being broken on `--docs` pages.
 *
 * Follows the appearance axis, like the manager: Storybook's chrome only has a light and a
 * dark, and the colour themes belong to the library rather than to the page framing it.
 *
 * Called as a plain function rather than rendered as JSX: the docs blocks are React, and
 * this package deliberately has no React of its own (a second copy would break the hooks
 * `DocsContainer` calls). Invoking it keeps every hook on the React instance that renders
 * us, and keeps React out of a Vue package's dependencies.
 *
 * Storybook re-runs the docs render whenever a global changes, so reading the theme at
 * call time is all the reactivity this needs.
 */
export const DocsContainer: typeof StorybookDocsContainer = ({ children, context }) =>
  StorybookDocsContainer({ children, context, theme: themes[readScheme(context)] });
