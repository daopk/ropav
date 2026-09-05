import { afterEach, describe, expect, it } from "vitest";

/**
 * Reduced motion on a pseudo-element.
 *
 * `motion-reduce:` reaches a pseudo-element from the element it originates on, so the variant has
 * to sit on the host. Written inside the `::before`/`::after` block instead, its ancestor
 * condition lands after the pseudo-element and compiles to an empty `:is()` — a selector that
 * matches nothing. The transition keeps running, the declaration is still there to read in the
 * source, and no test that looks at the host notices.
 *
 * These run in a browser because the question is what the compiled selector matches. jsdom does
 * not answer it, and neither does reading the stylesheet.
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
 * The part, nested under a root that carries the opt-in — the variant matches descendants as well
 * as the element, and an ancestor is how an app turns motion off for a subtree.
 */
const mount = (chain: string[], reduced: boolean) => {
  const root = document.createElement("div");

  if (reduced) root.setAttribute("data-reduce-motion", "true");

  let el = root;

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

const transitions = (element: Element, pseudo: string) =>
  getComputedStyle(element, pseudo).transitionProperty;

/** The OS preference would turn the whole thing off and take the baseline with it. */
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});

describe("reduced motion", () => {
  describe.each(parts)("$name", ({ chain, pseudo }) => {
    it.skipIf(prefersReduced)("animates when nothing has asked it not to", () => {
      expect(transitions(mount(chain, false), pseudo)).not.toBe("none");
    });

    it("stops animating under `data-reduce-motion` on an ancestor", () => {
      expect(transitions(mount(chain, true), pseudo)).toBe("none");
    });
  });
});
