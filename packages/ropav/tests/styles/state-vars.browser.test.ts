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
  /** The `data-*` that turns this state on, or `null` for the resting one. */
  attr: string | null;
  /** Knobs this state chains through by default, so retuning one of them moves it too. */
  follows?: string[];
  /** The knob a caller sets. */
  knob: string;
  /** The value expression its default resolves to. */
  paints: string;
  /** `backgroundColor` unless the state paints the text instead. */
  prop?: "backgroundColor" | "color";
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
      { attr: "data-hovered", knob: "--sidebar-rail-line-hover", paints: "var(--accent)" },
      {
        attr: "data-dragging",
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
      { attr: "data-hovered", knob: "--sidebar-item-bg-hover", paints: "var(--default)" },
      {
        attr: "data-pressed",
        follows: ["--sidebar-item-bg-hover"],
        knob: "--sidebar-item-bg-pressed",
        paints: "var(--default)",
      },
      { attr: "data-current", knob: "--sidebar-item-bg-current", paints: "var(--accent-soft)" },
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
        attr: "data-current",
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
      { attr: "data-hovered", knob: "--input-bg-hover", paints: "var(--field-hover)" },
      { attr: "data-focused", knob: "--input-bg-focus", paints: "var(--field-focus)" },
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
      { attr: "data-hovered", knob: "--input-bg-hover", paints: "var(--default-hover)" },
      { attr: "data-focused", knob: "--input-bg-focus", paints: "var(--default)" },
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
      { attr: "data-hovered", knob: "--splitter-line-hover", paints: "var(--accent)" },
      {
        attr: "data-dragging",
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
      { attr: "data-hovered", knob: "--splitter-grip-bg-hover", paints: "var(--accent)" },
      {
        attr: "data-dragging",
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

  if (state.attr) stateHost.setAttribute(state.attr, "true");

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
