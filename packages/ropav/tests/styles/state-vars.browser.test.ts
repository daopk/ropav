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

const SIDEBAR = `<div class="sidebar"><div class="sidebar__rail"></div></div>`;
const SPLITTER = `<div class="splitter__handle"><div class="splitter__handle-grip"></div></div>`;
const ITEM = `<div class="sidebar__item"></div>`;

const parts: Part[] = [
  {
    html: SIDEBAR,
    knobHost: ".sidebar",
    name: "the sidebar rail's line",
    paint: ".sidebar__rail",
    pseudo: "::after",
    stateHost: ".sidebar__rail",
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
    html: ITEM,
    knobHost: ".sidebar__item",
    name: "the sidebar row's fill",
    paint: ".sidebar__item",
    stateHost: ".sidebar__item",
    states: [
      { attr: null, knob: "--sidebar-item-bg", paints: "transparent" },
      { attr: ["data-hovered"], knob: "--sidebar-item-bg-hover", paints: "var(--default)" },
      {
        attr: ["data-pressed"],
        follows: ["--sidebar-item-bg-hover"],
        knob: "--sidebar-item-bg-pressed",
        paints: "var(--default)",
      },
      { attr: ["data-current"], knob: "--sidebar-item-bg-current", paints: "var(--accent-soft)" },
    ],
  },
  {
    html: ITEM,
    knobHost: ".sidebar__item",
    name: "the sidebar row's label",
    paint: ".sidebar__item",
    stateHost: ".sidebar__item",
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
    html: `<input class="input" />`,
    knobHost: ".input",
    name: "the field's fill",
    paint: ".input",
    stateHost: ".input",
    states: [
      { attr: null, knob: "--input-bg", paints: "var(--field-background, var(--default))" },
      { attr: ["data-hovered"], knob: "--input-bg-hover", paints: "var(--field-hover)" },
      { attr: ["data-focused"], knob: "--input-bg-focus", paints: "var(--field-focus)" },
    ],
  },
  {
    // The variant re-points the properties and declares no state rule of its own, so this is also
    // what proves the base's rules read through to it.
    html: `<input class="input input--secondary" />`,
    knobHost: ".input",
    name: "the secondary field's fill",
    paint: ".input",
    stateHost: ".input",
    states: [
      { attr: null, knob: "--input-bg", paints: "var(--default)" },
      { attr: ["data-hovered"], knob: "--input-bg-hover", paints: "var(--default-hover)" },
      { attr: ["data-focused"], knob: "--input-bg-focus", paints: "var(--default)" },
    ],
  },
  {
    // The variant here is an ancestor rather than the element itself, so it also covers a knob
    // re-pointed from one selector up.
    html: `<div class="search-field--secondary"><div class="search-field__group"></div></div>`,
    knobHost: ".search-field__group",
    name: "the secondary search field's group",
    paint: ".search-field__group",
    stateHost: ".search-field__group",
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
    html: `<a class="link"></a>`,
    knobHost: ".link",
    name: "the link's underline",
    paint: ".link",
    stateHost: ".link",
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
    html: `<span class="tag tag--default"></span>`,
    knobHost: ".tag",
    name: "the tag's fill",
    paint: ".tag",
    stateHost: ".tag",
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
    html: `<table><tbody><tr class="table__row"><td class="table__cell"></td></tr></tbody></table>`,
    knobHost: ".table__cell",
    name: "the table row's fill",
    paint: ".table__cell",
    stateHost: ".table__row",
    states: [
      { attr: null, knob: "--table-cell-bg", paints: "var(--surface)" },
      {
        attr: ["data-hovered"],
        knob: "--table-cell-bg-hover",
        paints: "color-mix(in oklab, var(--surface) 40%, transparent)",
      },
      {
        attr: ["data-selected"],
        knob: "--table-cell-bg-selected",
        paints: "color-mix(in oklab, var(--surface) 10%, transparent)",
      },
      {
        attr: ["data-drop-target"],
        knob: "--table-cell-bg-drop-target",
        paints: "var(--accent-soft)",
      },
    ],
  },
  {
    // The most combinatorial box in the library: checked and indeterminate share a colour, and so
    // do the two invalid pairings. The state lives on the block, the paint on the control.
    html: `<div class="checkbox"><span class="checkbox__control"></span></div>`,
    knobHost: ".checkbox__control",
    name: "the checkbox control's fill",
    paint: ".checkbox__control",
    stateHost: ".checkbox",
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
    html: `<div class="range-calendar__cell"><span class="range-calendar__cell-button"></span></div>`,
    knobHost: ".range-calendar__cell",
    name: "the range calendar's day",
    paint: ".range-calendar__cell-button",
    stateHost: ".range-calendar__cell",
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
        paints: "var(--default)",
      },
    ],
  },
  {
    html: SPLITTER,
    knobHost: ".splitter__handle",
    name: "the splitter handle's line",
    paint: ".splitter__handle",
    pseudo: "::after",
    stateHost: ".splitter__handle",
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
    knobHost: ".splitter__handle",
    name: "the splitter handle's grip",
    paint: ".splitter__handle-grip",
    stateHost: ".splitter__handle",
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
