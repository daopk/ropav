/**
 * The API tables: every public part of a component family, read from the library's types.
 *
 * Families are collected from the pages themselves — a `<Api family="select" />` anywhere under
 * `components/` is the whole declaration. Nothing has to be kept in step by hand, and a family
 * that no page shows is never compiled.
 */

import type { ApiEvent, ApiPart, ApiProp, ApiSlot, ApiSlotProp } from "../types";
import type { ComponentMetaChecker, PropertyMeta, SlotMeta } from "vue-component-meta";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";

import { enumMembers, literalMembers, order, ranked, toDefault } from "./control-specs";
import { DOCS, emit, HEADER, isAuthored, sorted, SRC } from "./shared";

/** `class` is on every component and says the same thing each time; the guide covers it once. */
const UNIVERSAL = new Set(["class"]);

const families = (): string[] => {
  const dir = join(DOCS, "components");
  const found = new Set<string>();

  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;

    for (const [, name] of readFileSync(join(dir, file), "utf8").matchAll(
      /<Api\s+family="([a-z0-9-]+)"/g,
    )) {
      found.add(name!);
    }
  }

  return [...found].sort();
};

/**
 * The public parts of a family, read structurally from its barrel. A directory listing would
 * report the internals too — a select ships a hidden native select that nothing exports — and
 * the barrel is also where a part's public name is decided (`SelectRoot as Select`).
 */
const parts = (family: string): { file: string; name: string }[] => {
  const path = join(SRC, "components", family, "index.ts");
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const sfc = new Map<string, string>();
  const found: { file: string; name: string }[] = [];

  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.endsWith(".vue") &&
      statement.importClause?.name
    ) {
      sfc.set(statement.importClause.name.text, statement.moduleSpecifier.text);
    }

    // A re-export carries a module specifier; only the local one renames what this file imported.
    if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause) {
      if (!ts.isNamedExports(statement.exportClause)) continue;

      for (const element of statement.exportClause.elements) {
        const local = (element.propertyName ?? element.name).text;
        const file = sfc.get(local);

        if (file) found.push({ file: join("components", family, file), name: element.name.text });
      }
    }
  }

  // The root first, then the parts alphabetically — the order a page introduces them in.
  return found.sort((a, b) => {
    const rootness = Number(b.file.endsWith("-root.vue")) - Number(a.file.endsWith("-root.vue"));

    return rootness || a.name.localeCompare(b.name);
  });
};

/** Alphabetical is what a union normalises to; a size reads `sm, md, lg` or reads wrong. */
const spell = (prop: PropertyMeta, id: string): string => {
  const members = enumMembers(prop);
  const values = members && literalMembers(members);

  if (values) {
    return order(values, ranked(id, prop.name))
      .map((value) => JSON.stringify(value))
      .join(" | ");
  }

  return prop.type.replace(/ \| undefined$/, "");
};

const toProp = (prop: PropertyMeta, id: string): ApiProp => {
  const { defaultText, defaultValue } = toDefault(prop);

  const written = defaultValue === undefined ? defaultText : JSON.stringify(defaultValue);

  return {
    ...(written === undefined ? {} : { default: written }),
    description: prop.description,
    name: prop.name,
    required: prop.required,
    type: spell(prop, id),
  };
};

/** A slot's own props, when the payload resolves to an object rather than a bare type. */
const toSlot = (slot: SlotMeta): ApiSlot => {
  const { schema } = slot;
  const props: ApiSlotProp[] = [];

  if (typeof schema === "object" && schema.kind === "object" && schema.schema) {
    for (const member of Object.values(schema.schema)) {
      props.push({ name: member.name, type: member.type });
    }
  }

  return { name: slot.name, props: props.sort((a, b) => a.name.localeCompare(b.name)) };
};

/** `[event: MouseEvent]` is a parameter list; a reader wants what the handler receives. */
const toEvent = (name: string, type: string): ApiEvent => {
  const inner = /^\[(.*)]$/.exec(type)?.[1] ?? type;
  const payload = inner
    .split(/,(?![^<[(]*[>\])])/)
    .map((part) => part.replace(/^[^:]*:\s*/, "").trim())
    .filter(Boolean)
    .join(", ");

  return { name, payload: payload || "—" };
};

export const emitApi = (checker: ComponentMetaChecker): number => {
  const emitted: string[] = [];

  for (const family of families()) {
    const collected: ApiPart[] = [];

    for (const { file, name } of parts(family)) {
      const meta = checker.getComponentMeta(join(SRC, file));

      collected.push({
        events: meta.events.map((event) => toEvent(event.name, event.type)),
        name,
        props: meta.props
          .filter((prop) => isAuthored(prop) && !UNIVERSAL.has(prop.name))
          .map((prop) => toProp(prop, family))
          .sort((a, b) => a.name.localeCompare(b.name)),
        slots: meta.slots.map(toSlot),
      });
    }

    emitted.push(
      `  "${family}": ${JSON.stringify(collected, sorted, 2)},`.replaceAll("\n", "\n  "),
    );
  }

  emit(
    "api.ts",
    `${HEADER}

import type { ApiPart } from "../types.ts";

export const api: Record<string, readonly ApiPart[]> = {
${emitted.join("\n")}
};
`,
  );

  return emitted.length;
};
