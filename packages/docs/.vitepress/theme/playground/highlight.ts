import type { HighlighterCore } from "shiki/core";

import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import { colorReplacements, themes } from "./code-theme";

let core: Promise<HighlighterCore> | undefined;

/** The regex engine rather than the compiled one, so no binary blob rides along. */
const load = (): Promise<HighlighterCore> =>
  createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [import("@shikijs/langs/vue")],
    themes: [import("@shikijs/themes/github-dark"), import("@shikijs/themes/github-light")],
  });

/**
 * Loaded on the first control a reader touches, never before: at the default state the block
 * the server sent is already the right one.
 */
export const highlight = async (code: string): Promise<string> => {
  core ??= load();

  return (await core).codeToHtml(code, {
    colorReplacements,
    // Emits the custom properties the theme's stylesheet reads, rather than one fixed colour.
    defaultColor: false,
    lang: "vue",
    themes,
  });
};
