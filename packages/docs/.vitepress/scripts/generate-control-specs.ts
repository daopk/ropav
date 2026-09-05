/**
 * Emits `.vitepress/generated/control-specs.ts` from the library's own types.
 *
 * Run by `predev`, `prebuild` and `pretypecheck`. Output is gitignored — three seconds of
 * compiler is cheaper than the review noise of regenerating a file on every prop rename, and
 * there is no CI to gate a stale one.
 */

import type { ControlSpec } from "../playgrounds/types";
import type { PropertyMeta } from "vue-component-meta";

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createChecker } from "vue-component-meta";

import { catalogue, optionOrder } from "../playgrounds/catalogue";

/*
 * Resolved through the package link rather than across the workspace, so this program reaches
 * the library by the same route the site does. The two paths are the same directory but not
 * the same module identity, and a type re-exported through both reads as an ambiguous name.
 */
const ROPAV = dirname(fileURLToPath(import.meta.resolve("ropav/package.json")));
const SRC = join(ROPAV, "src");
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "generated");

/** A prop the library declares, rather than one carried in from the DOM's own attributes. */
const isAuthored = (prop: PropertyMeta): boolean =>
  prop.getDeclarations().some((declaration) => declaration.file.startsWith(SRC));

const ranked = (id: string, prop: string): readonly string[] =>
  optionOrder[`${id}.${prop}`] ?? optionOrder[prop] ?? [];

const order = (members: string[], rank: readonly string[]): string[] => {
  const place = new Map(rank.map((member, index) => [member, index]));

  return [...members].sort((a, b) => {
    const left = place.get(a) ?? Number.MAX_SAFE_INTEGER;
    const right = place.get(b) ?? Number.MAX_SAFE_INTEGER;

    return left === right ? a.localeCompare(b) : left - right;
  });
};

/**
 * Read from `schema` rather than `type`, which reports the alias wherever one exists —
 * `TypographyAlign | undefined` instead of the members behind it.
 */
const toControl = (
  prop: PropertyMeta,
  id: string,
): Pick<ControlSpec, "kind" | "options"> | undefined => {
  const { schema } = prop;

  if (typeof schema === "string") {
    if (schema === "string") return { kind: "string" };
    if (schema === "number") return { kind: "number" };

    return undefined;
  }

  if (typeof schema !== "object" || schema.kind !== "enum" || !Array.isArray(schema.schema)) {
    return undefined;
  }

  const members = schema.schema.filter(
    (member): member is string => typeof member === "string" && member !== "undefined",
  );

  if (members.length > 0 && members.every((member) => member.startsWith('"'))) {
    const values = members.map((member) => JSON.parse(member) as string);

    return { kind: "enum", options: order(values, ranked(id, prop.name)) };
  }

  if (members.length === 2 && members.includes("false") && members.includes("true")) {
    return { kind: "boolean" };
  }
  if (members.length === 1 && members[0] === "string") return { kind: "string" };
  if (members.length === 1 && members[0] === "number") return { kind: "number" };

  return undefined;
};

/**
 * The `@default` tag wins over `withDefaults`, which only ever reports what the SFC restated —
 * a recipe's own default reaches the types through the tag alone. A tag that is prose rather
 * than a value is kept as text and treated as no default, so the prop always writes itself.
 */
const toDefault = (prop: PropertyMeta): Pick<ControlSpec, "defaultText" | "defaultValue"> => {
  const text = prop.tags.find((tag) => tag.name === "default")?.text ?? prop.default;

  if (text === undefined || text === "undefined") return {};

  try {
    return { defaultValue: JSON.parse(text) as boolean | number | string };
  } catch {
    return { defaultText: text };
  }
};

const main = (): void => {
  const checker = createChecker(join(ROPAV, "tsconfig.json"), { schema: { ignore: [] } });
  const specs: string[] = [];

  for (const [id, entry] of Object.entries(catalogue).sort(([a], [b]) => a.localeCompare(b))) {
    const meta = checker.getComponentMeta(join(SRC, entry.file));
    const authored = new Map(meta.props.filter(isAuthored).map((prop) => [prop.name, prop]));
    const controls: ControlSpec[] = [];

    for (const name of entry.controls) {
      const prop = authored.get(name);

      if (!prop) {
        throw new Error(
          `${id}: no prop named "${name}" on ${entry.file}. ` +
            `Declared: ${[...authored.keys()].join(", ")}`,
        );
      }

      const control = toControl(prop, id);

      if (!control) throw new Error(`${id}.${name}: unsupported type ${prop.type}`);

      controls.push({
        ...toDefault(prop),
        ...control,
        description: prop.description,
        name,
      });
    }

    specs.push(
      `  ${id}: ${JSON.stringify({ controls, id, node: entry.node }, sorted, 2)},`.replaceAll(
        "\n",
        "\n  ",
      ),
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const file = join(OUT_DIR, "control-specs.ts");

  writeFileSync(
    file,
    `/**
 * GENERATED from the library's types — do not edit by hand.
 *
 * Run \`pnpm generate\` after changing \`.vitepress/playgrounds/catalogue.ts\`, or let
 * \`predev\` / \`prebuild\` do it.
 */

import type { PlaygroundSpec } from "../playgrounds/types";

export const specs: Record<string, PlaygroundSpec> = {
${specs.join("\n")}
};
`,
  );

  // Handed to the repo formatter rather than matched by hand, the way the theme generator does.
  execFileSync("oxfmt", [file], { stdio: "inherit" });

  const count = specs.length;

  // eslint-disable-next-line no-console
  console.log(`Generated ${count} playground spec${count === 1 ? "" : "s"}.`);
};

/** Keys sorted so the emitted file satisfies the linter, controls grouped by kind. */
function sorted(this: unknown, _key: string, value: unknown): unknown {
  if (Array.isArray(value) || value === null || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

main();
