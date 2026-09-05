import type { MarkdownRenderer } from "vitepress";

import { specs } from "../generated/control-specs.ts";
import { renderCode } from "../theme/playground/code.ts";
import { defaultState } from "../theme/playground/state.ts";

const BLOCK = /^::: playground (\S+)\n:::$/gm;

/**
 * Expands `::: playground button` into the component plus a real fenced block holding the code
 * for its default state.
 *
 * A source rule rather than a container: the fence has to exist before block parsing, so the
 * site's own highlighter picks it up and the reader gets the same markup, the same theme and
 * the same copy button as every other block on the page. The blank lines are load-bearing —
 * an unknown tag's html block closes at the first one, which is what lets the fence inside be
 * parsed as markdown and handed over as slot content.
 *
 * The code comes from the function the browser calls too, so the block the server sends and
 * the first repaint after a control moves cannot disagree.
 */
export const playgroundBlock = (md: MarkdownRenderer): void => {
  md.core.ruler.before("normalize", "playground", (state) => {
    state.src = state.src.replace(BLOCK, (_match, id: string) => {
      const spec = specs[id];

      if (!spec) {
        throw new Error(`Unknown playground "${id}". Known: ${Object.keys(specs).join(", ")}`);
      }

      return [
        `<Playground component="${id}">`,
        "",
        "```vue",
        renderCode(spec, defaultState(spec)),
        "```",
        "",
        "</Playground>",
      ].join("\n");
    });

    return false;
  });
};
