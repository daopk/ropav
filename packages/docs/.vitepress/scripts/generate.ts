/**
 * Emits everything under `.vitepress/generated/` from the library's own sources.
 *
 * Run by `predev`, `prebuild` and `pretypecheck`. Output is gitignored — a few seconds of
 * compiler is cheaper than the review noise of regenerating files on every prop rename, and
 * there is no CI to gate a stale one.
 *
 * One checker for all of it: building it is most of the cost.
 */

import { join } from "node:path";

import { createChecker } from "vue-component-meta";

import { emitApi } from "./api";
import { emitControlSpecs } from "./control-specs";
import { ROPAV } from "./shared";
import { emitStories } from "./stories";

const count = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const main = (): void => {
  const checker = createChecker(join(ROPAV, "tsconfig.json"), { schema: { ignore: [] } });

  const specs = emitControlSpecs(checker);
  const families = emitApi(checker);
  const stories = emitStories();

  // eslint-disable-next-line no-console
  console.log(
    `Generated ${count(specs, "playground spec", "playground specs")}, ` +
      `${count(families, "API family", "API families")}, ` +
      `${count(stories, "story entry", "story entries")}.`,
  );
};

main();
