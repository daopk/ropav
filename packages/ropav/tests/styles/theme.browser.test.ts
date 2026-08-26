import { afterEach, describe, expect, it } from "vitest";

// The bundled alternative themes. `setup-styles.ts` only pulls in the default one, which is
// all a component test needs; these have to be asked for, exactly as a consumer asks for them.
import "../../../styles/themes/netflix.css";
import "../../../styles/themes/uber.css";

/**
 * The theme layer.
 *
 * Nothing else guards it. A theme is a set of custom properties and the rules that carry them
 * are ordinary CSS, so the whole thing can be broken by a reordered `@import` or a changed
 * layer without a single component test noticing — every component would keep rendering, just
 * in the wrong colours.
 *
 * These run in a browser because the questions are all cascade questions: which rule wins, and
 * what a `var()` inside a `color-mix()` resolves against. jsdom answers neither.
 */

const hosts: HTMLElement[] = [];

/** A themed element, plus a child, since inheritance is half of what is under test. */
const mount = (attrs: Record<string, string>) => {
  const host = document.createElement("div");

  for (const [name, value] of Object.entries(attrs)) host.setAttribute(name, value);

  host.appendChild(document.createElement("span"));
  document.body.appendChild(host);
  hosts.push(host);

  return { child: host.firstElementChild as HTMLElement, host };
};

const token = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

const root = () => document.documentElement;

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

describe("theme layer (browser)", () => {
  it("leaves the document on the default theme when other themes are loaded", () => {
    // Importing a theme must not apply it. Every bundled theme is scoped to its own
    // `data-theme`, so loading ten of them changes nothing until one is asked for.
    expect(token(root(), "--accent")).toBe("oklch(0.6204 0.195 253.83)");
  });

  it("swaps the palette for the subtree carrying data-theme", () => {
    const { host } = mount({ "data-theme": "netflix" });

    expect(token(host, "--accent")).not.toBe(token(root(), "--accent"));
    expect(token(host, "--radius")).toBe("0.125rem");
  });

  it("re-derives color-mix tokens against the theme, not the document", () => {
    // The reason each generated theme carries its full derived block instead of leaning on
    // the default theme's. A custom property substitutes `var()` where it is *declared*, so
    // `--accent-hover` declared once on `:root` would freeze against the root's `--accent`
    // and a themed subtree would inherit the wrong hover colour.
    const { child, host } = mount({ "data-theme": "netflix" });

    expect(token(host, "--accent-hover")).toContain(token(host, "--accent"));
    expect(token(host, "--accent-hover")).not.toBe(token(root(), "--accent-hover"));

    // And the resolved value, not the formula, is what inherits.
    expect(token(child, "--accent-hover")).toBe(token(host, "--accent-hover"));
  });

  it("keeps the light/dark axis orthogonal to the theme", () => {
    const light = mount({ "data-theme": "netflix" });
    const dark = mount({ class: "dark", "data-theme": "netflix" });

    expect(token(dark.host, "--background")).not.toBe(token(light.host, "--background"));
    expect(getComputedStyle(dark.host).colorScheme).toBe("dark");
    expect(getComputedStyle(light.host).colorScheme).toBe("light");
  });

  it("applies the dark palette to a theme nested inside a dark subtree", () => {
    // `.dark [data-theme]`, rather than the two attributes landing on one element. Uber is
    // the case that proves it: its accent is pure black, and it has to invert or vanish.
    const { host } = mount({ class: "dark" });
    const themed = document.createElement("div");

    themed.setAttribute("data-theme", "uber");
    host.appendChild(themed);

    expect(token(themed, "--accent")).toBe("oklch(0.9848 0 0)");
  });

  it("inherits structural tokens from the default theme", () => {
    // Generated themes only carry colours. Everything keyed on neither the theme nor the
    // palette - spacing, cursors, the backdrop, the shadows - still comes from `:root` and
    // `.dark`, both of which keep matching an element that carries a `data-theme`.
    const { host } = mount({ "data-theme": "netflix" });

    expect(token(host, "--spacing")).toBe(token(root(), "--spacing"));
    expect(token(host, "--backdrop")).toBe(token(root(), "--backdrop"));
    expect(token(host, "--cursor-interactive")).toBe(token(root(), "--cursor-interactive"));
  });

  it("keeps the theme layer below the component layer", () => {
    // What P0-3a was about. Theme tokens must not be able to outrank component rules, or a
    // theme could silently take over styles it was never meant to reach.
    const probe = document.createElement("style");

    probe.textContent = `
      @layer components { #layer-probe { color: rgb(0, 128, 0) } }
      @layer theme { #layer-probe { color: rgb(255, 0, 0) } }
    `;
    document.head.appendChild(probe);

    const { host } = mount({ id: "layer-probe" });

    expect(getComputedStyle(host).color).toBe("rgb(0, 128, 0)");

    probe.remove();
  });
});
