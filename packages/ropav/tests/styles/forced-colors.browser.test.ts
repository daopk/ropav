import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";

/**
 * The stylesheet under Forced Colors Mode (Windows High Contrast).
 *
 * The mode replaces author colours with the user's palette and, crucially, strips `box-shadow`
 * outright. Every ring in this library is a `box-shadow` - that is what `ring-*` compiles to -
 * layered on top of `outline-none`, so without a fallback a focused control has no indicator at
 * all. The same override flattens any state carried only by `background-color`.
 *
 * Neither failure is visible to the rest of the suite: axe-core has no rule for forced colors,
 * so the browser tests stay green while the focus ring disappears. These assertions are the only
 * thing standing between a refactor and a library that cannot be navigated by keyboard.
 *
 * macOS cannot switch the mode on - "Increase contrast" maps to `prefers-contrast: more` - so it
 * is emulated. The emulation is the part that matters: the browser really does drop `box-shadow`
 * and really does force the palette, only the palette itself is Chromium's default rather than
 * one of the Windows contrast themes.
 */

const hosts: HTMLElement[] = [];

/** Parses an HTML fragment into the document and hands back its root. */
const mount = (html: string) => {
  const template = document.createElement("template");

  template.innerHTML = html.trim();

  const host = template.content.firstElementChild as HTMLElement;

  document.body.appendChild(host);
  hosts.push(host);

  return host;
};

const styleOf = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo);

/**
 * Resolves a system colour keyword to the rgb value this browser paints it as.
 *
 * Asserting against the keyword itself is not possible - `getComputedStyle` reports the resolved
 * colour - and hard-coding the rgb value would pin the test to Chromium's emulated palette.
 */
const systemColor = (keyword: string) => {
  const probe = mount(`<span style="color: ${keyword}"></span>`);

  return styleOf(probe).color;
};

beforeAll(async () => {
  await cdp().send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
});

afterAll(async () => {
  // The emulation is set on the page, and the page outlives this file - leaving it on would
  // hand forced colors to whichever test file Vitest runs here next.
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

describe("forced colors mode (browser)", () => {
  it("is actually emulated", () => {
    // Everything below is vacuously true if the emulation did not take, so fail loudly here
    // rather than silently passing a suite that tested the ordinary palette.
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
  });

  it("strips the box-shadow every ring is built from", () => {
    // The premise of the whole file. If a browser ever stops doing this, the fallbacks below
    // become dead weight and this test says so.
    const button = mount(`<button class="button" data-focus-visible="true">x</button>`);

    expect(styleOf(button).boxShadow).toBe("none");
  });

  it("draws a focus outline where the ring used to be", () => {
    const button = mount(`<button class="button" data-focus-visible="true">x</button>`);
    const style = styleOf(button);

    expect(style.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(style.outlineColor).toBe(systemColor("Highlight"));
  });

  it("draws a focus outline on fields too", () => {
    // `status-focused-field` is a separate utility with its own ring, and the group only takes
    // it while a real input inside is focused - hence the actual `focus()`.
    const group = mount(`
      <div class="input-group">
        <input data-slot="input-group-input" />
      </div>
    `);

    group.querySelector("input")?.focus();

    expect(styleOf(group).outlineStyle).not.toBe("none");
    expect(styleOf(group).outlineColor).toBe(systemColor("Highlight"));
  });

  it("keeps a focused invalid field distinguishable from an unfocused one", () => {
    // Invalid draws a 1px outline unfocused and swaps to a ring when focused. The ring is a
    // box-shadow, so without the fallback both states render as the same 1px outline.
    const resting = mount(`<div class="input-group" data-invalid="true"></div>`);
    const focused = mount(
      `<div class="input-group" data-invalid="true" data-focus-within="true"></div>`,
    );

    expect(Number.parseFloat(styleOf(focused).outlineWidth)).toBeGreaterThan(
      Number.parseFloat(styleOf(resting).outlineWidth),
    );
    expect(styleOf(focused).outlineColor).toBe(systemColor("Highlight"));
  });

  it("marks a selected element that only had a background to show it", () => {
    const resting = mount(`<div class="tag">x</div>`);
    const selected = mount(`<div class="tag" data-selected="true">x</div>`);

    expect(styleOf(selected).backgroundColor).toBe(systemColor("Highlight"));
    expect(styleOf(selected).color).toBe(systemColor("HighlightText"));
    expect(styleOf(selected).backgroundColor).not.toBe(styleOf(resting).backgroundColor);
  });

  it("keeps the switch thumb visible against its track at both ends", () => {
    // The worst case for a background-only state: track and thumb are both flattened to Canvas,
    // so the thumb disappears into the track and the position it slid to shows nothing.
    const off = mount(`
      <div class="switch"><div class="switch__control"><div class="switch__thumb"></div></div></div>
    `);
    const on = mount(`
      <div class="switch" data-selected="true">
        <div class="switch__control"><div class="switch__thumb"></div></div>
      </div>
    `);

    const track = (host: HTMLElement) => styleOf(host.querySelector(".switch__control")!);
    const thumb = (host: HTMLElement) => styleOf(host.querySelector(".switch__thumb")!);

    expect(thumb(off).backgroundColor).not.toBe(track(off).backgroundColor);
    expect(thumb(on).backgroundColor).not.toBe(track(on).backgroundColor);
    expect(track(on).backgroundColor).not.toBe(track(off).backgroundColor);
  });

  it("keeps the checked radio dot visible against its control", () => {
    const radio = mount(
      `<div class="radio" data-selected="true"><span class="radio__indicator"></span></div>`,
    );
    const indicator = radio.querySelector(".radio__indicator")!;

    expect(styleOf(indicator, "::before").backgroundColor).toBe(systemColor("CanvasText"));
  });

  it("keeps a skeleton visible against the page", () => {
    // Its fill flattens to Canvas - the colour of the page behind it - and the shimmer is a
    // gradient, which forced colors removes entirely. Without an outline there is nothing left.
    const skeleton = mount(`<div class="skeleton"></div>`);
    const style = styleOf(skeleton);

    expect(style.backgroundImage).toBe("none");
    expect(style.outlineStyle).not.toBe("none");
    expect(style.outlineColor).toBe(systemColor("GrayText"));
  });

  it("greys out a disabled control", () => {
    // `opacity` survives forced colors, so this is the refinement rather than the repair:
    // GrayText is the signal the platform itself uses.
    const button = mount(`<button class="button" disabled>x</button>`);

    expect(styleOf(button).color).toBe(systemColor("GrayText"));
  });
});
