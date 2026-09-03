import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The convention: a colour a state rule paints has to go through a custom property.
 *
 * Written straight into the rule it cannot be reached from a call site. The resting and the lit
 * value are the same property on the same element, so the one declaration a caller writes to
 * change either beats every state rule at once — and a utility beats them all regardless of
 * specificity, since `utilities` is a later layer than `components`. The caller's only other
 * option is to restate ropav's whole state set behind `:not()`, which drifts silently the day a
 * state is added.
 *
 * Only a property painted in more than one state needs this. Painted in exactly one, a caller can
 * name that state from the call site — `hover:bg-*` — and there is no other state for it to
 * flatten, so a property of its own would be surface for nothing.
 *
 * This is the part that keeps the convention from drifting back. Everything not yet converted is
 * ledgered below with its count; a new state colour in a clean file fails outright, and one added
 * to a ledgered file pushes its count over and fails too.
 */

const STYLES = path.resolve(import.meta.dirname, "../../../styles");

/** Colour utility suffixes, taken from the theme's own `--color-*` namespace. */
const colorNames = new Set([
  ...readFileSync(path.join(STYLES, "themes/shared/theme.css"), "utf8")
    .matchAll(/--color-([a-z0-9-]+):/g)
    .map((match) => match[1]),
  "transparent",
  "current",
  "inherit",
  "black",
  "white",
]);

const COLOR_UTILITY =
  /^(bg|text|border|ring|fill|stroke|outline|shadow|decoration|caret|placeholder|accent|from|to|via)-(.+)$/;

/** Which property each utility prefix paints, so paints on the same one can be counted together. */
const PAINTS: Record<string, string> = {
  accent: "accent-color",
  bg: "background-color",
  border: "border-color",
  caret: "caret-color",
  decoration: "text-decoration-color",
  fill: "fill",
  from: "background-image",
  outline: "outline-color",
  placeholder: "color",
  ring: "box-shadow",
  shadow: "box-shadow",
  stroke: "stroke",
  text: "color",
  to: "background-image",
  via: "background-image",
};

const COLOR_PROPERTY =
  /^(color|background|background-color|border(-[a-z]+)?-color|fill|stroke|outline-color|text-decoration-color|box-shadow)$/;

/**
 * Utilities that hold the colour centrally, so a component reaching for one declares none of its
 * own — `utilities/index.css` is the single place those are retuned.
 */
const DELEGATED = new Set([
  "focus-field-ring",
  "focus-ring",
  "forced-selected",
  "invalid-field-ring",
  "status-disabled",
  "status-focused",
  "status-focused-field",
  "status-invalid-field",
  "status-pending",
]);

/**
 * `data-*` that pick an arrangement or a variant rather than an interaction state. Everything else
 * counts as state, so a state ropav adds later is caught by default rather than missed.
 */
const CONFIGURATION =
  /\[data-(slot|orientation|placement|side|direction|layout|level|type|theme|vibrant-palette|reduce-motion|selection-mode|collection|key|light-color|default-icon|hide-separator|allows-sorting|has-submenu|has-child-items|entering|exiting|collapsed|[a-z-]*scroll)[\]=]/g;

const STATE_PSEUDO =
  /:(hover|active|focus-visible|focus|focus-within|disabled|checked|indeterminate|invalid|placeholder-shown)\b/;

const isStateSelector = (selector: string) => {
  const withoutConfiguration = selector.replace(CONFIGURATION, "");

  return (
    STATE_PSEUDO.test(withoutConfiguration) ||
    /\[(?:data|aria)-[a-z-]+[\]=]/.test(withoutConfiguration)
  );
};

type Paint = {
  file: string;
  line: number;
  /** The painted box: class names and pseudo-elements, every state marker stripped. */
  part: string;
  property: string;
  selector: string;
  state: boolean;
  /** Already read from a custom property, so there is nothing to flag. */
  viaProperty: boolean;
  what: string;
};

const STATE_MARKER = /\[[a-z-]+(?:=(?:"[^"]*"|[^\]]*))?\]|:not\([^)]*\)|:is\([^)]*\)/g;

const partOf = (blocks: string[]) => {
  const selector = blocks.filter((block) => !block.startsWith("@")).join(" ");
  // `data-slot` names a part of a component, so it identifies a box; a state attribute does not.
  // Deduped, because a comma-separated rule would otherwise name the same box once per selector.
  const slots = [...selector.matchAll(/\[data-slot="([^"]+)"\]/g)].map((match) => `@${match[1]}`);
  const rest = selector
    .replace(STATE_MARKER, "")
    .replace(STATE_PSEUDO, "")
    .replaceAll(/[&>,]/g, " ")
    .split(/\s+/)
    .filter((token) => token.startsWith(".") || token.startsWith("::"));

  return [...new Set([...rest, ...slots])].sort().join("");
};

/** Every colour a component paints, resting and stateful alike. */
const allPaints = () => {
  const dir = path.join(STYLES, "components");
  const paints: Paint[] = [];

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".css"))) {
    if (file === "index.css") continue;

    const blocks: string[] = [];
    let inComment = false;
    let pending = "";

    for (const [index, raw] of readFileSync(path.join(dir, file), "utf8").split("\n").entries()) {
      let line = raw.trim();

      if (inComment) {
        inComment = !line.includes("*/");
        continue;
      }

      if (line.startsWith("/*") && !line.includes("*/")) {
        inComment = true;
        continue;
      }

      line = line.replace(/\/\*.*?\*\//g, "").trim();

      if (!line && !pending) continue;

      // A selector or a value can span lines; only `{`, `}` and `;` end a logical one.
      if (!/[{};]$/.test(line)) {
        pending += (pending ? " " : "") + line;
        continue;
      }

      if (pending) {
        line = `${pending} ${line}`;
        pending = "";
      }

      if (!line) continue;

      if (line.endsWith("{")) {
        blocks.push(line.slice(0, -1).trim());
        continue;
      }

      if (line.startsWith("}")) {
        blocks.pop();
        continue;
      }

      // Forced Colors Mode has to use the system keywords, which are not a component's to theme.
      if (blocks.some((block) => block.includes("forced-colors"))) continue;

      const shared = {
        file,
        line: index + 1,
        part: partOf(blocks) || file,
        selector: blocks.filter((block) => !block.startsWith("@")).join(" "),
        state: blocks.some(isStateSelector),
      };

      if (line.startsWith("@apply")) {
        for (const utility of line
          .replace(/^@apply\s+/, "")
          .replace(/;$/, "")
          .split(/\s+/)) {
          // Drop any variant prefix, the `!` and an opacity modifier — `hover:bg-default/50!`.
          const variants = utility.replace(/!$/, "");
          const [bare = ""] = (variants.split(":").pop() ?? "").split("/");

          if (DELEGATED.has(bare)) continue;

          const parts = COLOR_UTILITY.exec(bare);
          const prefix = parts?.[1];
          const suffix = parts?.[2];

          if (!prefix || !suffix) continue;
          if (!colorNames.has(suffix) && !suffix.startsWith("[")) continue;

          // `after:bg-*` paints the pseudo-element, which is a different box from the element.
          const pseudo = /(?:^|:)(before|after):/.exec(variants);

          paints.push({
            ...shared,
            part: shared.part + (pseudo ? `::${pseudo[1]}` : ""),
            property: PAINTS[prefix]!,
            viaProperty: suffix.includes("var(--"),
            what: bare,
          });
        }

        continue;
      }

      const [, property, value] = /^([a-z-]+)\s*:\s*(.+);$/.exec(line) ?? [];

      if (property && value && COLOR_PROPERTY.test(property)) {
        paints.push({
          ...shared,
          property: property.replace(/^border-[a-z]+-color$/, "border-color"),
          viaProperty: value.includes("var(--"),
          what: line,
        });
      }
    }
  }

  return paints;
};

/**
 * A state colour that has to become a property: the same box paints that property somewhere else
 * too, so no one declaration from a call site can reach this state alone.
 */
const audit = () => {
  const paints = allPaints();
  const box = (paint: Paint) => `${paint.file}|${paint.part}|${paint.property}`;
  const painted = new Map<string, number>();

  for (const paint of paints) painted.set(box(paint), (painted.get(box(paint)) ?? 0) + 1);

  return paints.filter(
    (paint) => paint.state && !paint.viaProperty && painted.get(box(paint))! > 1,
  );
};

/**
 * Files still painting state colours directly, with the count each is down to. Converting a
 * component means dropping its entry — the goal is an empty object.
 */
const KNOWN_DEBT: Record<string, number> = {
  "checkbox.css": 13,
  "range-calendar.css": 11,
};

const describeAll = (findings: Paint[]) =>
  findings.map((f) => `${f.file}:${f.line}  ${f.what}  in  ${f.selector}`).join("\n");

const counts = () => {
  const found: Record<string, number> = {};

  for (const finding of audit()) found[finding.file] = (found[finding.file] ?? 0) + 1;

  return found;
};

describe("state colours go through a custom property", () => {
  it("holds for every component not on the ledger", () => {
    const offenders = audit().filter((finding) => !(finding.file in KNOWN_DEBT));

    expect(describeAll(offenders)).toBe("");
  });

  it("holds no more often than the ledger says, so a converted file cannot regress", () => {
    const found = counts();
    const over = Object.entries(found)
      .filter(([file, count]) => file in KNOWN_DEBT && count > KNOWN_DEBT[file]!)
      .map(([file, count]) => `${file}: ${count}, ledgered at ${KNOWN_DEBT[file]}`);

    expect(over).toEqual([]);
  });

  it("carries no stale ledger entry", () => {
    const found = counts();
    const stale = Object.entries(KNOWN_DEBT)
      .filter(([file, count]) => (found[file] ?? 0) !== count)
      .map(([file, count]) => `${file}: ledgered at ${count}, now ${found[file] ?? 0}`);

    expect(stale).toEqual([]);
  });
});
