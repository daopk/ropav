import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/*
 * A type a module keeps to itself cannot be referenced from the declarations a build emits, so it
 * is written out structurally instead. `ClassValue` refers to itself, and writing that out ran to
 * the depth limit and stopped at `any` — every recipe's `.d.ts` carried twelve nested copies of
 * the class type and a hole where the bottom should be, which is 180 kB of declaration that also
 * type-checks nothing. Exporting the type is what lets the emit name it.
 *
 * The marker below is what the compiler writes where it gave up, so this reads the symptom rather
 * than the cause and catches the next type that grows one, whatever it is called.
 *
 * Only means something after a build, so it is skipped without one rather than making `pnpm test`
 * depend on `pnpm build`.
 */

const stylesDist = path.resolve(import.meta.dirname, "../../../styles/dist");

const ELIDED = "/*elided*/";

const declarationsIn = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return declarationsIn(full);

    return entry.name.endsWith(".d.ts") ? [full] : [];
  });

describe("@ropav/styles declarations", () => {
  const built = fs.existsSync(stylesDist);

  it.skipIf(!built)(
    "name the types they emit rather than unrolling them until they give up",
    () => {
      const gaveUp = declarationsIn(stylesDist)
        .filter((file) => fs.readFileSync(file, "utf8").includes(ELIDED))
        .map((file) => path.relative(stylesDist, file));

      expect(gaveUp).toEqual([]);
    },
  );
});
