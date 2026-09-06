import { afterAll, afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";

/**
 * Who decides whether a component moves, and how the answer reaches a pseudo-element.
 *
 * The decision is one inherited custom property, `--rp-motion`, and every declaration that
 * animates reads it. See `motion.css` for why it replaced a pair of rules per animated element.
 *
 * These run in a browser because the questions are what the cascade resolved and what the media
 * query matched. Reading the stylesheet answers neither, and jsdom answers neither.
 *
 * The pseudo-element cases are the ones the old mechanism kept getting wrong: a variant written
 * inside a `::before` block compiled to an ancestor condition that landed *after* the
 * pseudo-element and matched nothing, so the transition kept running with the declaration still
 * there to read and nothing on the host looking wrong. Inheritance cannot reproduce that — a
 * pseudo-element takes the property from the element it originates on — but the parts are still
 * listed here, because a pseudo-element is where it would show up again.
 */

/** Every part whose transition lives on a pseudo-element rather than on the element itself. */
const parts = [
  { chain: ["rp-sidebar__rail"], name: "the sidebar rail's line", pseudo: "::after" },
  { chain: ["rp-splitter__handle"], name: "the splitter handle's line", pseudo: "::after" },
  { chain: ["rp-radio__indicator"], name: "the radio's inner dot", pseudo: "::before" },
  { chain: ["rp-checkbox__control"], name: "the checkbox control's fill", pseudo: "::before" },
  { chain: ["rp-slider", "rp-slider__thumb"], name: "the slider thumb's knob", pseudo: "::after" },
];

const roots: HTMLElement[] = [];

/**
 * The part, under a stack of ancestors each carrying an answer.
 *
 * A stack rather than a flag, because "nearest wins" is the thing worth proving: a subtree that
 * turns motion back on inside one that turned it off is exactly what a selector could not say.
 */
const mount = (chain: string[], answers: (string | null)[] = []) => {
  const root = document.createElement("div");
  let el = root;

  answers.forEach((answer, depth) => {
    // Every answer after the first needs an element of its own; stacking two on the root would
    // make the second overwrite the first and the nesting cases pass without nesting anything.
    if (depth > 0) {
      const wrapper = document.createElement("div");

      el.appendChild(wrapper);
      el = wrapper;
    }
    if (answer !== null) el.setAttribute("data-reduce-motion", answer);
  });

  for (const className of chain) {
    const child = document.createElement("div");

    child.className = className;
    el.appendChild(child);
    el = child;
  }

  document.body.appendChild(root);
  roots.push(root);

  return el;
};

const duration = (element: Element, pseudo = "") =>
  getComputedStyle(element, pseudo).transitionDuration;

const moves = (element: Element, pseudo = "") =>
  duration(element, pseudo)
    .split(",")
    .some((value) => value.trim() !== "0s");

/** The OS preference would turn the whole thing off and take the baseline with it. */
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const emulate = (value: string | null) =>
  cdp().send("Emulation.setEmulatedMedia", {
    features: value ? [{ name: "prefers-reduced-motion", value }] : [],
  });

afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});

afterAll(async () => {
  // The emulation is set on the page, and the page outlives this file.
  await emulate(null);
});

describe("reduced motion", () => {
  describe.each(parts)("$name", ({ chain, pseudo }) => {
    it.skipIf(prefersReduced)("animates when nothing has asked it not to", () => {
      expect(moves(mount(chain), pseudo)).toBe(true);
    });

    it("stops under `data-reduce-motion` on an ancestor", () => {
      expect(moves(mount(chain, ["true"]), pseudo)).toBe(false);
    });

    it("takes the answer from the nearest ancestor that gave one", () => {
      expect(moves(mount(chain, ["true", "false"]), pseudo)).toBe(true);
      expect(moves(mount(chain, ["false", "true"]), pseudo)).toBe(false);
    });
  });
});

describe("the system preference", () => {
  const chain = ["rp-sidebar__rail"];
  const pseudo = "::after";

  it("is actually emulated", async () => {
    // Everything below is vacuously true if the emulation did not take.
    await emulate("reduce");
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
  });

  it("stops motion on its own", async () => {
    await emulate("reduce");
    expect(moves(mount(chain), pseudo)).toBe(false);
  });

  /*
   * The case the old gate could not answer. `data-reduce-motion="false"` is documented as an
   * explicit opt back in, and under an OS asking for reduced motion it did nothing at all: the
   * media branch excluded only `"true"`, so the attribute never reached the decision.
   */
  it("gives way to an explicit `false` on an ancestor", async () => {
    await emulate("reduce");
    expect(moves(mount(chain, ["false"]), pseudo)).toBe(true);
  });

  it("still applies to a subtree that said `true`", async () => {
    await emulate("reduce");
    expect(moves(mount(chain, ["false", "true"]), pseudo)).toBe(false);
  });
});
