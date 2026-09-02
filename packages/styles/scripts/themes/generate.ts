/**
 * Emits `themes/<id>.css` for every preset except the hand-written ones — see `HANDWRITTEN`.
 *
 * Pass `--check-default` to emit the default theme to stdout instead, for comparing the
 * generator against the hand-written file.
 *
 * Run with `pnpm generate:themes`. Output is committed — consumers never run this.
 */

import type { ThemeId, ThemePreset } from "./presets";

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateAccentForeground,
  getColorVariablesForElement,
  getDerivedColorFormulas,
  generateThemeColors,
  parseOklch,
} from "./color";
import { adaptiveAccents, fieldShadowCss, presets, radiusCssMap, themeIds } from "./presets";

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Themes whose CSS is hand-written, and so must not be overwritten here.
 *
 * Both tint their neutral ramp off a different hue than their accent, with a grey chroma that
 * varies per token — neither of which one preset can express. `default` additionally aliases the
 * primitives (`var(--white)`, `var(--eclipse)`), which the generator cannot produce at all. Their
 * presets carry the label, the presentation order and the radii only.
 */
const HANDWRITTEN = new Set<ThemeId>(["default", "hero"]);

/**
 * `--tw-ring-color` is a Tailwind internal; the hand-written default does not set it and
 * neither should a theme.
 */
const SKIP_DERIVED = new Set(["--tw-ring-color"]);

/**
 * The scrollbar thumb tracks `--foreground`, so it has to be re-derived per theme rather
 * than living in the shared token file. Mirrors `themes/default.css`.
 */
const SCROLLBAR_CHAIN: Record<string, string> = {
  "--scrollbar": "var(--scrollbar-thumb)",
  "--scrollbar-color": "var(--scrollbar-thumb) var(--scrollbar-track)",
  "--scrollbar-thumb": "color-mix(in oklch, var(--foreground) 15%, transparent)",
};

/**
 * Tokens that track `--foreground` and so cannot be left to `:root`.
 *
 * Everything else the default theme declares but a generated theme does not — `--spacing`,
 * `--cursor-*`, the primitives, the surface and overlay shadows, `--backdrop` — is either a
 * constant or keyed on the light/dark axis, and `:root` / `.dark` still match an element
 * carrying a `data-theme`, so those come through unchanged.
 */
const FOREGROUND_LINKED: Record<string, string> = {
  "--link": "var(--foreground)",
};

/** Groups the flat variable map into the commented sections used by the default theme. */
const SECTIONS: Array<{ title: string; match: (name: string) => boolean }> = [
  { match: (n) => ["--background", "--foreground"].includes(n), title: "Base Colors" },
  { match: (n) => n.startsWith("--surface") || n.startsWith("--overlay"), title: "Surfaces" },
  { match: (n) => n === "--muted" || n.startsWith("--scrollbar"), title: "Muted and scrollbar" },
  { match: (n) => n.startsWith("--default"), title: "Default" },
  { match: (n) => n.startsWith("--accent") || n === "--focus", title: "Accent" },
  { match: (n) => n.startsWith("--field"), title: "Form Fields" },
  {
    match: (n) =>
      n.startsWith("--success") || n.startsWith("--warning") || n.startsWith("--danger"),
    title: "Status Colors",
  },
  { match: (n) => n.startsWith("--segment") || n === "--link", title: "Component Colors" },
  {
    match: (n) => n.startsWith("--border") || n.startsWith("--separator"),
    title: "Borders and separators",
  },
];

/**
 * Builds one scheme's declarations: authored colours from the generator, then the
 * `color-mix()` chain.
 *
 * The derived block is emitted in full rather than inherited from the default theme.
 * A custom property substitutes `var()` at the element where it is *declared*, so
 * `--accent-hover` declared on `:root` freezes against `:root`'s `--accent` — a subtree
 * `<div data-theme="netflix">` would otherwise inherit the wrong hover colour.
 */
function buildVariables(preset: ThemePreset, scheme: "light" | "dark") {
  const colors = generateThemeColors({
    chroma: preset.chroma,
    grayChroma: preset.base,
    hue: preset.hue,
    lightness: preset.lightness,
    semanticOverrides: preset.semanticOverrides,
  });

  const vars: Record<string, string> = {
    ...getColorVariablesForElement(colors, scheme),
  };

  // An accent that is pure black (Uber) has to flip on dark, or it vanishes.
  const adaptive = adaptiveAccents[`oklch(${preset.lightness} ${preset.chroma} ${preset.hue})`];

  if (adaptive) {
    const accent = adaptive[scheme];
    const parsed = parseOklch(accent);

    vars["--accent"] = accent;
    vars["--accent-foreground"] = parsed
      ? calculateAccentForeground(parsed.l, parsed.c, parsed.h)
      : calculateAccentForeground(scheme === "light" ? 0 : 1, 0, 0);
    vars["--focus"] = accent;
  }

  /*
   * Emitted for both schemes, never one. `:root`'s dark placeholder and a theme's light block
   * have equal specificity, so leaving dark out would let the light shadow win under `.dark`.
   */
  vars["--field-shadow"] = (preset.fieldShadow ?? fieldShadowCss)[scheme];

  delete vars["--scrollbar"];

  for (const [name, value] of Object.entries(getDerivedColorFormulas(scheme))) {
    if (!SKIP_DERIVED.has(name)) vars[name] = value;
  }

  Object.assign(vars, SCROLLBAR_CHAIN, FOREGROUND_LINKED);

  if (adaptive) {
    // A monochrome accent has no hue to tint the soft foreground with, so let it read as
    // the accent itself rather than a muddy blend.
    vars["--accent-soft-foreground"] = adaptive[scheme];
  }

  return vars;
}

/** Renders a variable map as an indented, sectioned declaration block. */
function renderBlock(vars: Record<string, string>, extra: Record<string, string> = {}) {
  const remaining = new Map(Object.entries(vars));
  const lines: string[] = [];

  for (const [name, value] of Object.entries(extra)) lines.push(`  ${name}: ${value};`);

  for (const section of SECTIONS) {
    const picked = [...remaining.keys()].filter((name) => section.match(name)).sort();

    if (picked.length === 0) continue;

    lines.push("", `  /* ${section.title} */`);
    for (const name of picked) {
      lines.push(`  ${name}: ${remaining.get(name)};`);
      remaining.delete(name);
    }
  }

  const leftovers = [...remaining.keys()].sort();

  if (leftovers.length > 0) {
    lines.push("", "  /* Other */");
    for (const name of leftovers) lines.push(`  ${name}: ${vars[name]};`);
  }

  return lines.join("\n");
}

/** Adds one indent level, leaving blank lines blank. */
function indent(block: string) {
  return block
    .split("\n")
    .map((line) => (line === "" ? line : `  ${line}`))
    .join("\n");
}

function renderTheme(id: ThemeId) {
  const preset = presets[id];
  const light = buildVariables(preset, "light");
  const dark = buildVariables(preset, "dark");

  const layout = {
    // Only `default` pairs its components with its fields. Emitted for every theme regardless,
    // or `:root`'s value would inherit into a `data-theme` subtree.
    "--component-radius": "calc(var(--radius) * 3)",
    "--field-radius": radiusCssMap[preset.formRadius],
    "--radius": radiusCssMap[preset.radius],
  };

  return `/**
 * ${preset.label} theme — GENERATED, do not edit by hand.
 *
 * Run \`pnpm generate:themes\` after changing \`scripts/themes/presets.ts\`.
 * Seed values: lightness ${preset.lightness}, chroma ${preset.chroma}, hue ${preset.hue}, base ${preset.base}.
 *
 * The \`theme\` layer is declared inside this file, so it can be imported with or without a
 * \`layer()\` wrapper:
 *
 *   @import "@ropav/styles";
 *   @import "@ropav/styles/themes/${id}.css";
 *
 * Light is the default; dark needs the \`dark\` class alongside the attribute:
 *   <html data-theme="${id}">               light
 *   <html data-theme="${id}" class="dark">  dark
 */

@layer theme {
  [data-theme="${id}"] {
    color-scheme: light;

${indent(renderBlock(light, { ...layout }))}
  }

  [data-theme="${id}"].dark,
  .dark [data-theme="${id}"] {
    color-scheme: dark;

${indent(renderBlock(dark))}
  }
}
`;
}

function main() {
  const checkDefault = process.argv.includes("--check-default");

  if (checkDefault) {
    process.stdout.write(renderTheme("default"));

    return;
  }

  const generated = themeIds.filter((id) => !HANDWRITTEN.has(id));

  const themesDir = join(stylesDir, "themes");

  mkdirSync(themesDir, { recursive: true });

  const written = generated.map((id) => {
    const file = join(themesDir, `${id}.css`);

    writeFileSync(file, renderTheme(id));

    return file;
  });

  // Every theme but `default`, which already ships in `index.css` — the hand-written ones
  // included, so this is not the same list as what was just generated.
  const bundled = themeIds.filter((id) => id !== "default");

  const all = `/**
 * Every bundled theme — GENERATED, do not edit by hand.
 *
 * Convenience for docs and playgrounds. Apps should import only the themes they offer.
 * Import without a \`layer()\` wrapper.
 */
${bundled.map((id) => `@import "./${id}.css";`).join("\n")}
`;

  const allFile = join(themesDir, "all.css");

  writeFileSync(allFile, all);

  // Hand the output to the repo formatter rather than trying to match its line wrapping
  // here. Without this `pnpm format` rewrites what was just generated, and the generator
  // would dirty the tree on every run.
  execFileSync("oxfmt", [...written, allFile], { stdio: "inherit" });

  // eslint-disable-next-line no-console
  console.log(`Generated ${generated.length} themes: ${generated.join(", ")}`);
}

main();
