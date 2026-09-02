import fs from "node:fs";
import path from "node:path";

/**
 * Which composables a consumer can reach. `tests/packaging/composables.test.ts` holds the barrel at
 * `src/composables/index.ts` to this list, and holds every component barrel to the host rule below.
 *
 * The barrel is a publishing manifest, not a consumption one: inside the package a composable is
 * imported by its own path, and `src/index.ts` is the only file that reads the barrel at all. So
 * this list is the whole public composable surface, and editing it is the whole act of deciding it.
 */

/**
 * Public from the main entry: one sorted barrel line each.
 *
 * Listed the opposite way round from `component-dirs.mjs`, on purpose. There a directory is a
 * public component unless it is named, because that is right nearly every time. Here the default
 * has to invert — a composable nobody has classified is internal plumbing far more often than it is
 * API, and a new file must not become supported API by the mere fact that nobody thought about it.
 * Listing what is public makes the safe state the free state.
 *
 * Sorted, and asserted sorted, because this list shrinks over many commits and a reviewable diff
 * depends on it.
 */
export const PUBLIC_MODULES = [
  "focus-responder",
  "press-responder",
  "use-calendar-state",
  "use-checkbox-group-state",
  "use-collator",
  "use-collection",
  "use-color-area-state",
  "use-color-channel-field-state",
  "use-color-field-state",
  "use-color-picker-state",
  "use-color-slider-state",
  "use-combo-box-state",
  "use-controllable-state",
  "use-css-variable",
  "use-date-field-state",
  "use-date-formatter",
  "use-date-picker-state",
  "use-date-range-picker-state",
  "use-description",
  "use-disclosure-group",
  "use-dismissable",
  "use-drag-and-drop",
  "use-enter-exit",
  "use-field-ids",
  "use-filter",
  "use-focus-scope",
  "use-form-reset",
  "use-form-validation-state",
  "use-id",
  "use-interaction-states",
  "use-labels",
  "use-list-data",
  "use-list-keyboard",
  "use-locale",
  "use-localized-string-formatter",
  "use-long-press",
  "use-media-query",
  "use-move",
  "use-number-field-state",
  "use-number-formatter",
  "use-overlay-position",
  "use-overlay-trigger-state",
  "use-press",
  "use-prevent-scroll",
  "use-radio-group-state",
  "use-range-calendar-state",
  "use-select-state",
  "use-selection-manager",
  "use-single-select-list-state",
  "use-slider-state",
  "use-tab-list-state",
  "use-time-field-state",
  "use-toast",
  "use-toggle-group-state",
  "use-tooltip-trigger-state",
  "use-typeahead",
  "use-viewport-size",
];

/** `PUBLIC_MODULES` as a set, for the membership checks that read it. */
export const PUBLIC = new Set(PUBLIC_MODULES);

/**
 * Not public from the main entry, but surfaced through the barrel of each component listed — the
 * rule `INTERNAL_DIRS` already follows, for the same reason: a public prop type that names one of
 * these leaves a consumer unable to annotate what they are allowed to pass.
 *
 * Bare rather than aliased, unlike an internal component part. Composable exports are already
 * globally unique, so there is no collision for an alias to resolve.
 *
 * A module maps to a list because nothing stops two components from surfacing one shared module.
 *
 * @type {Record<string, string[]>}
 */
export const HOST_EXPORTED_MODULES = {
  "use-calendar": ["calendar", "date-range-picker", "range-calendar"],
  "use-calendar-heading": ["calendar", "calendar-year-picker", "range-calendar"],
  "use-calendar-year-picker": ["calendar-year-picker"],
  "use-combo-box": ["combo-box"],
  "use-disclosure-group-navigation": ["disclosure-group"],
  "use-draggable-collection-state": ["list-box"],
  "use-droppable-collection-state": ["list-box"],
  "use-image-loading-status": ["avatar"],
  "use-input-otp": ["input-otp"],
  "use-menu-trigger": ["dropdown"],
  "use-number-field": ["number-field"],
  "use-password-manager-badge": ["input-otp"],
  "use-range-calendar": ["range-calendar"],
  "use-select": ["autocomplete", "select"],
  "use-toolbar": ["toolbar"],
};

/**
 * Read `src/composables` and sort it against the lists above.
 *
 * @param {string} composablesDir Absolute or cwd-relative path to `src/composables`.
 * @returns {{ modules: string[], publicModules: string[], hostExported: string[],
 *   privateModules: string[], missing: string[] }} `modules` is every module on disk, sorted.
 *   `missing` are names the lists claim that no file backs — a stale entry rather than a private
 *   module, so callers report it.
 */
export function readComposableModules(composablesDir) {
  if (!fs.existsSync(composablesDir)) {
    return { hostExported: [], missing: [], modules: [], privateModules: [], publicModules: [] };
  }

  const modules = fs
    .readdirSync(composablesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && entry.name !== "index.ts")
    .map((entry) => path.basename(entry.name, ".ts"))
    .sort();

  const onDisk = new Set(modules);
  const declared = [...PUBLIC_MODULES, ...Object.keys(HOST_EXPORTED_MODULES)];

  return {
    hostExported: modules.filter((name) => name in HOST_EXPORTED_MODULES),
    missing: declared.filter((name) => !onDisk.has(name)).sort(),
    modules,
    privateModules: modules.filter((name) => !PUBLIC.has(name) && !(name in HOST_EXPORTED_MODULES)),
    publicModules: modules.filter((name) => PUBLIC.has(name)),
  };
}
