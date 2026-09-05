import { afterEach, describe, expect, it } from "vitest";

/**
 * State colours held as custom properties.
 *
 * A colour written straight into a state rule cannot be reached from a call site: the resting and
 * the lit value are the same property on the same element, so any one declaration that beats the
 * base rule beats every state rule with it. Reading a property per state is what lets a caller
 * retune one and leave the others standing.
 *
 * Two things need guarding. That each state still paints what the theme says — a misspelled
 * property name is invalid at computed-value time and paints `transparent` instead, with nothing
 * to fail but the eye. And that retuning one state reaches that state and the ones that chain to
 * it by default, and nothing else.
 */

type State = {
  /** The `data-*`s that turn this state on together, or `null` for the resting one. */
  attr: string[] | null;
  /** Knobs this state chains through by default, so retuning one of them moves it too. */
  follows?: string[];
  /** The knob a caller sets. */
  knob: string;
  /** The value expression its default resolves to. */
  paints: string;
  /** `backgroundColor` unless the state paints the text instead. */
  prop?: "backgroundColor" | "color" | "textDecorationColor";
};

type Part = {
  html: string;
  /** Where a caller sets the knob — the element that declares it. */
  knobHost: string;
  name: string;
  /** The element that paints, and the pseudo-element it paints on, if any. */
  paint: string;
  pseudo?: string;
  /** Where the `data-*` goes; the grip's states live on its parent. */
  stateHost: string;
  states: State[];
};

const SIDEBAR = `<div class="rp-sidebar"><div class="rp-sidebar__rail"></div></div>`;
const QUIET_RAIL = `<div class="rp-sidebar"><div class="rp-sidebar__rail rp-sidebar__rail--quiet"></div></div>`;
const SPLITTER = `<div class="rp-splitter__handle"><div class="rp-splitter__handle-grip"></div></div>`;
const ITEM = `<div class="rp-sidebar__item"></div>`;

const parts: Part[] = [
  {
    html: SIDEBAR,
    knobHost: ".rp-sidebar",
    name: "the sidebar rail's line",
    paint: ".rp-sidebar__rail",
    pseudo: "::after",
    stateHost: ".rp-sidebar__rail",
    states: [
      { attr: null, knob: "--sidebar-rail-line", paints: "var(--separator)" },
      { attr: ["data-hovered"], knob: "--sidebar-rail-line-hover", paints: "var(--accent)" },
      {
        attr: ["data-dragging"],
        follows: ["--sidebar-rail-line-hover"],
        knob: "--sidebar-rail-line-dragging",
        paints: "var(--accent)",
      },
    ],
  },
  {
    /*
     * The variant that quiets the line states all three knobs on the rail, and the third is why
     * this case exists rather than being a copy of the one above: the shell declares the dragging
     * colour as a `var()` of the hover one, so that substitution happens up there and only the
     * resolved colour reaches the rail. Stating hover here would arrive too late for it.
     *
     * `knobHost` is the rail rather than the shell for the same reason — under this modifier a
     * caller cannot reach the line from the root any more, because the modifier's declaration is
     * the nearer one.
     */
    html: QUIET_RAIL,
    knobHost: ".rp-sidebar__rail",
    name: "the quiet sidebar rail's line",
    paint: ".rp-sidebar__rail",
    pseudo: "::after",
    stateHost: ".rp-sidebar__rail",
    states: [
      { attr: null, knob: "--sidebar-rail-line", paints: "transparent" },
      { attr: ["data-hovered"], knob: "--sidebar-rail-line-hover", paints: "transparent" },
      { attr: ["data-dragging"], knob: "--sidebar-rail-line-dragging", paints: "transparent" },
    ],
  },
  {
    html: ITEM,
    knobHost: ".rp-sidebar__item",
    name: "the sidebar row's fill",
    paint: ".rp-sidebar__item",
    stateHost: ".rp-sidebar__item",
    states: [
      { attr: null, knob: "--sidebar-item-bg", paints: "transparent" },
      { attr: ["data-hovered"], knob: "--sidebar-item-bg-hover", paints: "var(--state-layer)" },
      {
        attr: ["data-pressed"],
        follows: ["--sidebar-item-bg-hover"],
        knob: "--sidebar-item-bg-pressed",
        paints: "var(--state-layer)",
      },
      { attr: ["data-current"], knob: "--sidebar-item-bg-current", paints: "var(--accent-soft)" },
    ],
  },
  {
    html: ITEM,
    knobHost: ".rp-sidebar__item",
    name: "the sidebar row's label",
    paint: ".rp-sidebar__item",
    stateHost: ".rp-sidebar__item",
    states: [
      { attr: null, knob: "--sidebar-item-fg", paints: "var(--foreground)", prop: "color" },
      {
        attr: ["data-current"],
        knob: "--sidebar-item-fg-current",
        paints: "var(--accent-soft-foreground)",
        prop: "color",
      },
    ],
  },
  {
    html: `<input class="rp-input" />`,
    knobHost: ".rp-input",
    name: "the field's fill",
    paint: ".rp-input",
    stateHost: ".rp-input",
    states: [
      { attr: null, knob: "--input-bg", paints: "var(--field-background, var(--default))" },
      { attr: ["data-hovered"], knob: "--input-bg-hover", paints: "var(--field-hover)" },
      { attr: ["data-focused"], knob: "--input-bg-focus", paints: "var(--field-focus)" },
    ],
  },
  {
    // The variant re-points the properties and declares no state rule of its own, so this is also
    // what proves the base's rules read through to it.
    html: `<input class="rp-input rp-input--secondary" />`,
    knobHost: ".rp-input",
    name: "the secondary field's fill",
    paint: ".rp-input",
    stateHost: ".rp-input",
    states: [
      { attr: null, knob: "--input-bg", paints: "var(--default)" },
      { attr: ["data-hovered"], knob: "--input-bg-hover", paints: "var(--default-hover)" },
      { attr: ["data-focused"], knob: "--input-bg-focus", paints: "var(--default)" },
    ],
  },
  {
    // The variant here is an ancestor rather than the element itself, so it also covers a knob
    // re-pointed from one selector up.
    html: `<div class="rp-search-field--secondary"><div class="rp-search-field__group"></div></div>`,
    knobHost: ".rp-search-field__group",
    name: "the secondary search field's group",
    paint: ".rp-search-field__group",
    stateHost: ".rp-search-field__group",
    states: [
      { attr: null, knob: "--search-field-group-bg", paints: "var(--default)" },
      {
        attr: ["data-hovered"],
        knob: "--search-field-group-bg-hover",
        paints: "var(--default-hover)",
      },
      {
        attr: ["data-invalid"],
        knob: "--search-field-group-bg-focus",
        paints: "var(--default)",
      },
    ],
  },
  {
    // Not a fill, and the defaults are `color-mix()` rather than a bare token — both of which the
    // property has to carry through unchanged.
    html: `<a class="rp-link"></a>`,
    knobHost: ".rp-link",
    name: "the link's underline",
    paint: ".rp-link",
    stateHost: ".rp-link",
    states: [
      {
        attr: null,
        knob: "--link-decoration",
        paints: "var(--separator-tertiary)",
        prop: "textDecorationColor",
      },
      {
        attr: ["data-hovered"],
        knob: "--link-decoration-hover",
        paints: "color-mix(in oklab, var(--muted) 50%, transparent)",
        prop: "textDecorationColor",
      },
      {
        attr: ["data-pressed"],
        knob: "--link-decoration-pressed",
        paints: "var(--muted)",
        prop: "textDecorationColor",
      },
    ],
  },
  {
    // A variant that re-points the whole set and declares nothing else, plus the first state that
    // needs two attributes at once.
    html: `<span class="rp-tag rp-tag--default"></span>`,
    knobHost: ".rp-tag",
    name: "the tag's fill",
    paint: ".rp-tag",
    stateHost: ".rp-tag",
    states: [
      { attr: null, knob: "--tag-bg", paints: "var(--default)" },
      { attr: ["data-hovered"], knob: "--tag-bg-hover", paints: "var(--default-hover)" },
      { attr: ["data-selected"], knob: "--tag-bg-selected", paints: "var(--accent-soft)" },
      {
        attr: ["data-selected", "data-hovered"],
        knob: "--tag-bg-selected-hover",
        paints: "var(--accent-soft-hover)",
      },
    ],
  },
  {
    // The states sit on the row but the cell is what paints, so this also covers a knob read one
    // level below where the state lives.
    html: `<table><tbody><tr class="rp-table__row"><td class="rp-table__cell"></td></tr></tbody></table>`,
    knobHost: ".rp-table__cell",
    name: "the table row's fill",
    paint: ".rp-table__cell",
    stateHost: ".rp-table__row",
    states: [
      { attr: null, knob: "--table-cell-bg", paints: "var(--surface)" },
      {
        attr: ["data-hovered"],
        knob: "--table-cell-bg-hover",
        paints: "var(--surface-hover)",
      },
      {
        attr: ["data-selected"],
        knob: "--table-cell-bg-selected",
        paints: "var(--accent-soft)",
      },
      {
        attr: ["data-selected", "data-hovered"],
        knob: "--table-cell-bg-selected-hover",
        paints: "var(--accent-soft-hover)",
      },
      {
        attr: ["data-drop-target"],
        knob: "--table-cell-bg-drop-target",
        paints: "var(--accent-soft)",
      },
    ],
  },
  {
    // The gap between two rows, which has no resting colour — it is only ever seen lit. A
    // windowed table renders its own gaps, so this is the only thing that can paint them.
    html: `<div class="rp-table__drop-indicator"></div>`,
    knobHost: ".rp-table__drop-indicator",
    name: "the table's drop indicator, windowed",
    paint: ".rp-table__drop-indicator",
    stateHost: ".rp-table__drop-indicator",
    states: [
      {
        attr: ["data-drop-target"],
        knob: "--table-drop-indicator-bg",
        paints: "var(--accent)",
      },
    ],
  },
  {
    // The same gap as a real row, which has to take no height — so the cell paints it, on a
    // pseudo-element lifted onto the boundary. Same knob, a different thing wearing it.
    html: `<table class="rp-table__content"><tbody><tr class="rp-table__drop-indicator"><td></td></tr></tbody></table>`,
    knobHost: ".rp-table__drop-indicator",
    name: "the table's drop indicator, in flow",
    paint: ".rp-table__drop-indicator > td",
    pseudo: "::after",
    stateHost: ".rp-table__drop-indicator",
    states: [
      {
        attr: ["data-drop-target"],
        knob: "--table-drop-indicator-bg",
        paints: "var(--accent)",
      },
    ],
  },
  {
    html: `<div class="rp-list-box__drop-indicator"></div>`,
    knobHost: ".rp-list-box__drop-indicator",
    name: "the list box's drop indicator, windowed",
    paint: ".rp-list-box__drop-indicator",
    stateHost: ".rp-list-box__drop-indicator",
    states: [
      {
        attr: ["data-drop-target"],
        knob: "--list-box-drop-indicator-bg",
        paints: "var(--accent)",
      },
    ],
  },
  {
    // In flow it takes no height, so it paints on a pseudo-element lifted onto the boundary.
    html: `<div class="rp-list-box"><div class="rp-list-box__drop-indicator"></div></div>`,
    knobHost: ".rp-list-box__drop-indicator",
    name: "the list box's drop indicator, in flow",
    paint: ".rp-list-box__drop-indicator",
    pseudo: "::after",
    stateHost: ".rp-list-box__drop-indicator",
    states: [
      {
        attr: ["data-drop-target"],
        knob: "--list-box-drop-indicator-bg",
        paints: "var(--accent)",
      },
    ],
  },
  {
    // The most combinatorial box in the library: checked and indeterminate share a colour, and so
    // do the two invalid pairings. The state lives on the block, the paint on the control.
    html: `<div class="rp-checkbox"><span class="rp-checkbox__control"></span></div>`,
    knobHost: ".rp-checkbox__control",
    name: "the checkbox control's fill",
    paint: ".rp-checkbox__control",
    stateHost: ".rp-checkbox",
    states: [
      {
        attr: null,
        knob: "--checkbox-control-bg",
        paints: "var(--field-background, var(--default))",
      },
      {
        attr: ["data-indeterminate"],
        knob: "--checkbox-control-bg-checked",
        paints: "var(--accent)",
      },
      {
        attr: ["data-indeterminate", "data-invalid"],
        knob: "--checkbox-control-bg-invalid",
        paints: "var(--danger)",
      },
    ],
  },
  {
    // The knobs are declared on the cell and read by the day button inside it.
    html: `<div class="rp-range-calendar__cell"><span class="rp-range-calendar__cell-button"></span></div>`,
    knobHost: ".rp-range-calendar__cell",
    name: "the range calendar's day",
    paint: ".rp-range-calendar__cell-button",
    stateHost: ".rp-range-calendar__cell",
    states: [
      {
        attr: ["data-today"],
        knob: "--range-calendar-day-bg-today",
        paints: "var(--accent-soft)",
      },
      {
        attr: ["data-selection-end"],
        knob: "--range-calendar-day-bg-cap",
        paints: "var(--accent)",
      },
      {
        attr: ["data-hovered"],
        knob: "--range-calendar-day-bg-hover",
        paints: "var(--state-layer)",
      },
    ],
  },
  {
    html: SPLITTER,
    knobHost: ".rp-splitter__handle",
    name: "the splitter handle's line",
    paint: ".rp-splitter__handle",
    pseudo: "::after",
    stateHost: ".rp-splitter__handle",
    states: [
      { attr: null, knob: "--splitter-line", paints: "var(--separator)" },
      { attr: ["data-hovered"], knob: "--splitter-line-hover", paints: "var(--accent)" },
      {
        attr: ["data-dragging"],
        follows: ["--splitter-line-hover"],
        knob: "--splitter-line-dragging",
        paints: "var(--accent)",
      },
    ],
  },
  {
    html: SPLITTER,
    knobHost: ".rp-splitter__handle",
    name: "the splitter handle's grip",
    paint: ".rp-splitter__handle-grip",
    stateHost: ".rp-splitter__handle",
    states: [
      { attr: null, knob: "--splitter-grip-bg", paints: "var(--separator)" },
      { attr: ["data-hovered"], knob: "--splitter-grip-bg-hover", paints: "var(--accent)" },
      {
        attr: ["data-dragging"],
        follows: ["--splitter-grip-bg-hover"],
        knob: "--splitter-grip-bg-dragging",
        paints: "var(--accent)",
      },
    ],
  },
];

/** A colour a theme would never pick, so a stale read is obvious. */
const SENTINEL = "rgb(1, 2, 3)";

const roots: HTMLElement[] = [];

const mount = (html: string) => {
  const root = document.createElement("div");

  root.innerHTML = html;
  document.body.appendChild(root);
  roots.push(root);

  return root;
};

/** What a value expression resolves to, read the way the browser resolves it for a component. */
const resolve = (value: string) => {
  const probe = mount(`<div></div>`).firstElementChild as HTMLElement;

  probe.style.color = value;

  return getComputedStyle(probe).color;
};

const paintOf = (part: Part, root: HTMLElement, state: State) => {
  const painted = root.querySelector(part.paint)!;

  return getComputedStyle(painted, part.pseudo ?? null)[state.prop ?? "backgroundColor"];
};

/** One mounted part with exactly one state turned on. */
const setUp = (part: Part, state: State) => {
  const root = mount(part.html);
  const stateHost = root.querySelector(part.stateHost)!;

  for (const attr of state.attr ?? []) stateHost.setAttribute(attr, "true");

  return root;
};

const moves = (state: State, knob: string) =>
  state.knob === knob || (state.follows ?? []).includes(knob);

afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});

describe("state colours", () => {
  describe.each(parts)("$name", (part) => {
    it.each(part.states)("paints $attr from $paints", (state) => {
      expect(paintOf(part, setUp(part, state), state)).toBe(resolve(state.paints));
    });

    it.each(part.states)("retunes $knob without disturbing the states below it", (state) => {
      for (const other of part.states) {
        const root = setUp(part, other);

        root.querySelector<HTMLElement>(part.knobHost)!.style.setProperty(state.knob, SENTINEL);

        expect(paintOf(part, root, other)).toBe(
          moves(other, state.knob) ? SENTINEL : resolve(other.paints),
        );
      }
    });
  });
});
