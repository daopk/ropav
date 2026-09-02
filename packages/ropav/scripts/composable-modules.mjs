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
  "drag-collection",
  "drag-manager",
  "drag-modality",
  "droppable-collection-registry",
  "focus-responder",
  "press-responder",
  "table-drag-collection",
  "use-auto-scroll",
  "use-autocomplete",
  "use-calendar",
  "use-calendar-cell",
  "use-calendar-grid",
  "use-calendar-heading",
  "use-calendar-state",
  "use-calendar-year-picker",
  "use-checkbox-group-state",
  "use-collator",
  "use-collection",
  "use-collection-auto-focus",
  "use-color-area",
  "use-color-area-gradient",
  "use-color-area-state",
  "use-color-channel-field",
  "use-color-channel-field-state",
  "use-color-field",
  "use-color-field-state",
  "use-color-picker-state",
  "use-color-slider",
  "use-color-slider-state",
  "use-color-swatch",
  "use-combo-box",
  "use-combo-box-state",
  "use-controllable-state",
  "use-css-variable",
  "use-date-field",
  "use-date-field-state",
  "use-date-formatter",
  "use-date-picker",
  "use-date-picker-group",
  "use-date-picker-state",
  "use-date-segment",
  "use-default-date-props",
  "use-description",
  "use-dialog-trigger",
  "use-disclosure-group",
  "use-disclosure-group-navigation",
  "use-disclosure-panel",
  "use-dismissable",
  "use-display-names",
  "use-drag",
  "use-drag-and-drop",
  "use-draggable-collection",
  "use-draggable-collection-state",
  "use-draggable-item",
  "use-drawer-drag",
  "use-drop",
  "use-drop-indicator",
  "use-droppable-collection",
  "use-droppable-collection-state",
  "use-droppable-item",
  "use-enter-exit",
  "use-field-ids",
  "use-filter",
  "use-focus-scope",
  "use-form-reset",
  "use-form-validation",
  "use-form-validation-state",
  "use-formatted-text-field",
  "use-grid-keyboard",
  "use-grid-selection-announcement",
  "use-id",
  "use-image-loading-status",
  "use-input-otp",
  "use-interaction-states",
  "use-labels",
  "use-list-data",
  "use-list-keyboard",
  "use-locale",
  "use-localized-string-formatter",
  "use-long-press",
  "use-measured-height",
  "use-media-query",
  "use-menu",
  "use-modal-overlay",
  "use-modal-transition",
  "use-move",
  "use-number-field",
  "use-number-field-state",
  "use-number-formatter",
  "use-overlay-position",
  "use-overlay-trigger",
  "use-overlay-trigger-state",
  "use-password-manager-badge",
  "use-press",
  "use-prevent-scroll",
  "use-radio-group-state",
  "use-range-calendar",
  "use-range-calendar-state",
  "use-safely-mouse-to-submenu",
  "use-scroll-wheel",
  "use-search-field",
  "use-select",
  "use-select-state",
  "use-selection-manager",
  "use-shared-element",
  "use-single-select-list-state",
  "use-slider",
  "use-slider-state",
  "use-slider-thumb",
  "use-spin-button",
  "use-tab-list-state",
  "use-table-collection",
  "use-table-column-layout",
  "use-text-field",
  "use-time-field-state",
  "use-toast",
  "use-toast-region",
  "use-toggle-group-state",
  "use-toolbar",
  "use-tooltip-trigger",
  "use-tooltip-trigger-state",
  "use-typeahead",
  "use-viewport-size",
  "use-virtual-drop",
  "use-virtualizer",
  "use-virtualizer-scroll",
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
  "use-menu-trigger": ["dropdown"],
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
