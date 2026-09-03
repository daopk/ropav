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

type Finding = { file: string; line: number; selector: string; what: string };

/** Every colour a state rule paints without reading a property first. */
const audit = () => {
  const dir = path.join(STYLES, "components");
  const findings: Finding[] = [];

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".css"))) {
    if (file === "index.css") continue;

    const blocks: string[] = [];
    let inComment = false;

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
      if (!blocks.some(isStateSelector)) continue;

      const selector = blocks.filter((block) => !block.startsWith("@")).join(" ");
      const record = (what: string) => findings.push({ file, line: index + 1, selector, what });

      if (line.startsWith("@apply")) {
        for (const utility of line
          .replace(/^@apply\s+/, "")
          .replace(/;$/, "")
          .split(/\s+/)) {
          // Drop any variant prefix, the `!` and an opacity modifier — `hover:bg-default/50!`.
          const [bare = ""] = (utility.replace(/!$/, "").split(":").pop() ?? "").split("/");

          if (DELEGATED.has(bare)) continue;

          const suffix = COLOR_UTILITY.exec(bare)?.[2];

          if (suffix && (colorNames.has(suffix) || suffix.startsWith("["))) record(bare);
        }

        continue;
      }

      const [, property, value] = /^([a-z-]+)\s*:\s*(.+);$/.exec(line) ?? [];

      if (property && value && COLOR_PROPERTY.test(property) && !value.includes("var(--")) {
        record(line);
      }
    }
  }

  return findings;
};

/**
 * Files still painting state colours directly, with the count each is down to. Converting a
 * component means dropping its entry — the goal is an empty object.
 */
const KNOWN_DEBT: Record<string, number> = {
  "accordion.css": 1,
  "autocomplete.css": 3,
  "breadcrumbs.css": 1,
  "calendar-year-picker.css": 6,
  "calendar.css": 13,
  "checkbox.css": 18,
  "close-button.css": 1,
  "color-input-group.css": 1,
  "color-slider.css": 1,
  "combo-box.css": 3,
  "date-input-group.css": 7,
  "input-group.css": 1,
  "input-otp.css": 3,
  "input.css": 1,
  "label.css": 2,
  "link.css": 2,
  "list-box-item.css": 1,
  "menu-item.css": 1,
  "number-field.css": 2,
  "radio-group.css": 1,
  "radio.css": 5,
  "range-calendar.css": 12,
  "search-field.css": 1,
  "segmented-control.css": 2,
  "select.css": 2,
  "switch.css": 3,
  "table.css": 8,
  "tabs.css": 2,
  "tag.css": 5,
  "textarea.css": 1,
  "toast.css": 3,
};

const describeAll = (findings: Finding[]) =>
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
