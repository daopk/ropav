/** The playground panels: the catalogue's allowlist, filled in from the library's types. */

import type { ControlSpec } from "../playgrounds/types";
import type { ComponentMetaChecker, PropertyMeta } from "vue-component-meta";

import { join } from "node:path";

import { catalogue, optionOrder } from "../playgrounds/catalogue";

import { emit, HEADER, isAuthored, sorted, SRC } from "./shared";

export const ranked = (id: string, prop: string): readonly string[] =>
  optionOrder[`${id}.${prop}`] ?? optionOrder[prop] ?? [];

export const order = (members: string[], rank: readonly string[]): string[] => {
  const place = new Map(rank.map((member, index) => [member, index]));

  return [...members].sort((a, b) => {
    const left = place.get(a) ?? Number.MAX_SAFE_INTEGER;
    const right = place.get(b) ?? Number.MAX_SAFE_INTEGER;

    return left === right ? a.localeCompare(b) : left - right;
  });
};

/** The raw members of a union type, or `undefined` for a type that is not one. */
export const enumMembers = (prop: PropertyMeta): string[] | undefined => {
  const { schema } = prop;

  if (typeof schema !== "object" || schema.kind !== "enum" || !Array.isArray(schema.schema)) {
    return undefined;
  }

  return schema.schema.filter(
    (member): member is string => typeof member === "string" && member !== "undefined",
  );
};

/** Those members as written values, for a union of string literals. */
export const literalMembers = (members: string[]): string[] | undefined =>
  members.length > 0 && members.every((member) => member.startsWith('"'))
    ? members.map((member) => JSON.parse(member) as string)
    : undefined;

/**
 * Read from `schema` rather than `type`, which reports the alias wherever one exists —
 * `TypographyAlign | undefined` instead of the members behind it.
 */
const toControl = (
  prop: PropertyMeta,
  id: string,
): Pick<ControlSpec, "kind" | "options"> | undefined => {
  if (typeof prop.schema === "string") {
    if (prop.schema === "string") return { kind: "string" };
    if (prop.schema === "number") return { kind: "number" };

    return undefined;
  }

  const members = enumMembers(prop);

  if (!members) return undefined;

  const values = literalMembers(members);

  if (values) return { kind: "enum", options: order(values, ranked(id, prop.name)) };

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
export const toDefault = (
  prop: PropertyMeta,
): Pick<ControlSpec, "defaultText" | "defaultValue"> => {
  const text = prop.tags.find((tag) => tag.name === "default")?.text ?? prop.default;

  if (text === undefined || text === "undefined") return {};

  try {
    return { defaultValue: JSON.parse(text) as boolean | number | string };
  } catch {
    return { defaultText: text };
  }
};

export const emitControlSpecs = (checker: ComponentMetaChecker): number => {
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

  emit(
    "control-specs.ts",
    `${HEADER}

import type { PlaygroundSpec } from "../playgrounds/types.ts";

export const specs: Record<string, PlaygroundSpec> = {
${specs.join("\n")}
};
`,
  );

  return specs.length;
};
