/**
 * `llms.txt` and `llms-full.txt`: the site restated for a reader that fetches rather than browses.
 *
 * The arrangements are not written here. A family with a playground renders its catalogue node
 * through the same function the browser calls; one without renders the demo its page shows first.
 * Either way the snippet in the file is a snippet that runs.
 */

import type { ApiPart, ApiProp } from "../types";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { catalogue } from "../playgrounds/catalogue";
import { renderCode } from "../theme/playground/code";

import { DOCS, emitPublic, SITE } from "./shared";

/** Said once in the preamble rather than 124 times in the tables. */
const isForwarded = (prop: ApiProp): boolean => prop.name.startsWith("aria");

const RULES = `Ropav components are compound: a family root provides context and named parts
arrange inside it. The arrangement is the API, and it is not guessable from the names.

- A part only works inside its root. Contexts are strict, so a part rendered outside its family
  throws during setup rather than degrading. There is no standalone SelectTrigger.
- Collections arrive as data, not as children. Select takes a required \`items\` array;
  \`item-text-value\` is the string typeahead matches and \`item-key\` is the identity.
- Overlays take a positional trigger. Modal, Popover, Dropdown, Drawer and AlertDialog make their
  first child the trigger. There is no trigger slot.
- The part holding the state is not always the root. Table takes \`class\` and \`variant\`;
  TableContent owns \`aria-label\`, \`selection-mode\`, \`v-model:selected-keys\` and
  \`v-model:sort-descriptor\`.
- An indicator belongs to its item. TabsIndicator goes inside each TabsTab, ListBoxItemIndicator
  inside ListBoxItem, MenuItemIndicator inside MenuItem.
- Menu parts are shared. There is no DropdownItem — compose MenuItem inside DropdownMenu.
- Menu is the open list and needs its own Surface; Dropdown is that menu in a popover.
- Every collection item needs an \`id\`, and a \`text-value\` when its content is not plain text.
- Props are camelCase in the types and kebab-case in a template: \`itemTextValue\` is written
  \`item-text-value\`.
- Every component forwards \`class\`, \`aria-label\`, \`aria-labelledby\` and \`aria-describedby\`;
  those are not repeated per component.`;

interface Page {
  description: string;
  slug: string;
  title: string;
}

/** `title` and `description` as each page already declares them, for the index's link lines. */
const pages = (dir: string): Page[] => {
  const found: Page[] = [];

  for (const file of readdirSync(join(DOCS, dir)).sort()) {
    if (!file.endsWith(".md")) continue;

    const source = readFileSync(join(DOCS, dir, file), "utf8");
    const front = /^---\n([\s\S]*?)\n---/.exec(source)?.[1];

    if (!front) continue;

    const title = /^title: (.+)$/m.exec(front)?.[1];
    const description = /^description: (.+)$/m.exec(front)?.[1];

    if (!title || !description) continue;

    found.push({
      description,
      slug: file === "index.md" ? "" : file.slice(0, -".md".length),
      title,
    });
  }

  return found;
};

const link = (dir: string, page: Page): string =>
  `- [${page.title}](${SITE}/${dir}/${page.slug}): ${page.description}`;

/** The `<template>` of an SFC, which is the arrangement with the wiring left behind. */
const template = (file: string): string | undefined => {
  if (!existsSync(file)) return undefined;

  const source = readFileSync(file, "utf8");
  const found = /^<template>\n([\s\S]*?)\n<\/template>$/m.exec(source)?.[1];

  return found?.replace(/^ {2}/gm, "");
};

const rootOf = (parts: readonly ApiPart[] | undefined): ApiPart | undefined =>
  parts?.find((part) => part.root);

/**
 * A playground's node tree renders to the same snippet the site shows. The API defaults are
 * restated as the control set rather than left empty: `renderCode` writes only what differs from
 * one, so they add nothing to the root, and a node whose box `follows` a control needs the value
 * in hand to pick the case that box is written as.
 */
const arrangement = (name: string, root: ApiPart | undefined): string | undefined => {
  const entry = catalogue[name];

  if (entry) {
    const controls = (root?.props ?? []).map((prop) => ({
      defaultValue: prop.default?.replace(/^"|"$/g, ""),
      description: "",
      kind: "string" as const,
      name: prop.name,
    }));

    return renderCode(
      { controls, id: name, node: entry.node },
      Object.fromEntries(controls.map((control) => [control.name, control.defaultValue])),
    );
  }

  const page = join(DOCS, "components", `${name}.md`);

  if (!existsSync(page)) return undefined;

  const demo = /<<< @\/\.vitepress\/theme\/demos\/([a-z0-9-]+)\.vue/.exec(
    readFileSync(page, "utf8"),
  );

  if (!demo) return undefined;

  return template(join(DOCS, ".vitepress", "theme", "demos", `${demo[1]}.vue`));
};

const spell = (prop: ApiProp): string =>
  `${prop.name}${prop.required ? "!" : "?"}: ${prop.type}` +
  `${prop.default === undefined ? "" : ` = ${prop.default}`}`;

/**
 * A name and a type say enough on their own. The words are kept where they do not: a required
 * prop, a callback whose contract is unguessable, and a default written as prose.
 */
const earnsWords = (prop: ApiProp): boolean =>
  prop.required || prop.type.includes("=>") || /^[a-z]/.test(prop.default ?? "");

const describe = (prop: ApiProp): string => {
  const sentence = /^.*?[.](?=\s|$)/.exec(prop.description)?.[0] ?? prop.description;

  return earnsWords(prop) && sentence ? ` — ${sentence}` : "";
};

const partLines = (part: ApiPart): string[] => {
  const props = part.props.filter((prop) => !isForwarded(prop));
  const slots = part.slots.filter((slot) => slot.props.length > 0);
  const lines: string[] = [];

  if (part.root) {
    lines.push(...props.map((prop) => `- ${spell(prop)}${describe(prop)}`));
  } else if (props.length > 0) {
    lines.push(`${part.name}: ${props.map(spell).join("; ")}`);
  }

  for (const event of part.events)
    lines.push(`${part.root ? "" : `${part.name} `}@${event.name}: ${event.payload}`);

  for (const slot of slots) {
    const payload = slot.props.map((prop) => `${prop.name}: ${prop.type}`).join("; ");

    lines.push(`${part.root ? "" : `${part.name} `}#${slot.name}: { ${payload} }`);
  }

  return lines;
};

const family = (name: string, parts: readonly ApiPart[], hosts: readonly string[]): string => {
  const names = parts.map((part) => part.name);
  const root = rootOf(parts);
  const code = arrangement(name, root);
  const rest = parts.filter((part) => !part.root);
  const bare = rest.filter((part) => partLines(part).length === 0);
  const block: string[] = [`## ${names[0] ?? name}`, ""];

  if (names.length > 0) block.push(`\`import { ${names.join(", ")} } from "ropav"\``);

  if (existsSync(join(DOCS, "components", `${name}.md`))) {
    block.push(`Page: ${SITE}/components/${name}`);
  }

  block.push("");

  if (code) block.push("```vue-html", code, "```", "");
  else if (hosts.length > 0) block.push(`Arranged inside: ${hosts.join(", ")}.`, "");
  else block.push("No worked example yet.", "");

  if (root) block.push(...partLines(root));

  for (const part of rest) {
    if (bare.includes(part)) continue;

    block.push(...partLines(part));
  }

  if (bare.length > 0) block.push(`Structure only: ${bare.map((part) => part.name).join(", ")}.`);

  return `${block.join("\n").trimEnd()}\n`;
};

export const emitLlms = (api: Record<string, readonly ApiPart[]>): number => {
  const names = Object.keys(api).sort();
  const dir = join(DOCS, ".vitepress", "theme", "patterns");
  const patterns = readdirSync(dir)
    .sort()
    .map((file) => ({
      name: file.slice(0, -".vue".length),
      source: readFileSync(join(dir, file), "utf8").trim(),
    }));

  const code = new Map([
    ...names.map((name) => [name, arrangement(name, rootOf(api[name]))] as const),
    ...patterns.map((pattern) => [`the ${pattern.name} pattern`, pattern.source] as const),
  ]);

  /*
   * A family with no arrangement of its own is usually a part of somebody else's — Label,
   * MenuItem, ListBoxItem. Saying whose beats saying nothing, and the snippet is already here.
   */
  const hosts = (name: string): string[] => {
    if (code.get(name)) return [];

    const tags = api[name]?.map((part) => new RegExp(`<${part.name}[\\s/>]`)) ?? [];

    return [...code.keys()].filter((host) => {
      const snippet = code.get(host);

      return host !== name && snippet !== undefined && tags.some((tag) => tag.test(snippet));
    });
  };

  const index = [
    "# Ropav",
    "",
    "> Accessible Vue 3 components for Vapor Mode, with the keyboard, focus and screen-reader",
    "> behaviour implemented rather than approximated.",
    "",
    RULES,
    "",
    `- [Full reference](${SITE}/llms-full.txt): every family's arrangement and props, in one file.`,
    "",
    "## Start here",
    "",
    ...pages("guide").map((page) => link("guide", page)),
    "",
    "## Patterns",
    "",
    ...pages("patterns").map((page) => link("patterns", page)),
    "",
    "## Components",
    "",
    ...pages("components").map((page) => link("components", page)),
    "",
    "## Theming",
    "",
    ...pages("theming").map((page) => link("theming", page)),
    "",
  ].join("\n");

  const full = [
    "# Ropav — full reference",
    "",
    `Generated from the library's own sources. The site is ${SITE}.`,
    "",
    "```bash",
    "npm install ropav",
    "```",
    "",
    '```ts\nimport "ropav/styles/bundled.css";\nimport { Button } from "ropav";\n```',
    "",
    "The published package also carries one subpath per family — `import { Button } from",
    '"ropav/button"` — so a bundler drops what is never imported.',
    "",
    "## Rules",
    "",
    RULES,
    "",
    "# Patterns",
    "",
    "Whole screen fragments, each a single file that runs as it stands. The app shell is the",
    "frame the others go inside: put them in its `SidebarInset`, which already sets `min-width:",
    "0`, so a table wider than the room it is given scrolls rather than stopping the sidebar",
    "collapsing. An overlay is teleported out of the inset, so that `overflow: hidden` never",
    "clips a menu, a dialog or a toast.",
    "",
    ...patterns.map(
      (pattern) => `## Pattern: ${pattern.name}\n\n\`\`\`vue\n${pattern.source}\n\`\`\`\n`,
    ),
    "# Components",
    "",
    ...names.map((name) => family(name, api[name] ?? [], hosts(name))),
  ].join("\n");

  emitPublic("llms.txt", index);
  emitPublic("llms-full.txt", full);

  return 2;
};
