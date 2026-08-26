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
    // The pairing only reads on screen because the backplate is suppressed - see below.
    expect(styleOf(selected).forcedColorAdjust).toBe("none");
    expect(styleOf(selected).backgroundColor).not.toBe(styleOf(resting).backgroundColor);
  });

  it("opts label-bearing selected surfaces out of colour adjustment", () => {
    // Chromium paints a `Canvas`-coloured backplate behind the text of any element that has
    // text, so that text over an image stays readable. It lands on top of the element's own
    // background, so a `Highlight` fill carrying `HighlightText` renders as a solid plate with
    // an invisible label. `forced-color-adjust: none` is what suppresses it.
    //
    // Nothing about this is visible to `getComputedStyle` - the backplate is a paint-time
    // artefact - so the opt-out itself is what gets asserted. Drop it from any of these and the
    // component still reports the right colours while showing a blank block on screen.
    const cases = [
      mount(`<div class="tag" data-selected="true">t</div>`),
      mount(`<div class="toggle-button" data-selected="true">t</div>`),
      mount(`<div class="calendar__cell" data-selected="true">15</div>`),
      mount(`<table><tbody><tr class="table__row" data-selected="true">
        <td class="table__cell">c</td></tr></tbody></table>`).querySelector(".table__cell")!,
      mount(`<div class="tabs__tab" data-selected="true">Overview</div>`),
    ];

    for (const element of cases) {
      expect(styleOf(element).forcedColorAdjust).toBe("none");
    }
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

  it("marks the active page", () => {
    // An inactive link is transparent and the active one is a plain background, so forced
    // colors flattens the second onto the page and leaves the pair identical.
    const active = mount(`<a class="pagination__link" href="#" data-active="true">2</a>`);
    const plain = mount(`<a class="pagination__link" href="#">3</a>`);

    expect(styleOf(active).backgroundColor).toBe(systemColor("Highlight"));
    expect(styleOf(active).backgroundColor).not.toBe(styleOf(plain).backgroundColor);
    expect(styleOf(active).forcedColorAdjust).toBe("none");
  });

  it.each([
    ["meter", "meter"],
    ["progress-bar", "progress-bar"],
  ])("keeps the %s readable as a proportion", (_name, block) => {
    // Track and fill are both plain backgrounds. Flattened, the whole bar stops rendering -
    // not a weaker indicator, nothing at all.
    const host = mount(`
      <div class="${block}">
        <div class="${block}__track"><div class="${block}__fill"></div></div>
      </div>
    `);
    const track = host.querySelector<HTMLElement>(`.${block}__track`)!;
    const fill = host.querySelector<HTMLElement>(`.${block}__fill`)!;

    expect(styleOf(track).outlineStyle).not.toBe("none");
    expect(styleOf(fill).backgroundColor).toBe(systemColor("Highlight"));
  });

  it("keeps the progress ring's arc apart from its track", () => {
    // Forced colors leaves SVG strokes alone, so this one renders in the library's own palette
    // unless it is mapped over. The track steps aside rather than taking a keyword: every one
    // dark enough to read against `Canvas` is close enough to `Highlight` to swallow the arc in
    // one palette or the other.
    const ring = mount(`
      <div class="progress-circle" aria-valuenow="60">
        <svg class="progress-circle__track" viewBox="0 0 32 32">
          <circle class="progress-circle__track-circle" cx="16" cy="16" r="13"></circle>
          <circle class="progress-circle__fill-circle" cx="16" cy="16" r="13"></circle>
        </svg>
      </div>
    `);

    expect(styleOf(ring.querySelector(".progress-circle__fill-circle")!).stroke).toBe(
      systemColor("Highlight"),
    );
    expect(styleOf(ring.querySelector(".progress-circle__track-circle")!).stroke).toBe(
      systemColor("Canvas"),
    );
  });

  it("keeps today apart from a plain day and from the selected one", () => {
    // Today is a tint and nothing else. An edge rather than a fill, so it survives the day also
    // being selected, which paints the whole cell `Highlight`.
    const today = mount(`<div class="calendar__cell" data-today="true">1</div>`);
    const plain = mount(`<div class="calendar__cell">3</div>`);

    expect(styleOf(today).outlineStyle).not.toBe("none");
    expect(styleOf(plain).outlineStyle).toBe("none");
  });

  it("keeps the slider's track, fill and thumb on screen", () => {
    // Every part of a slider is a background: the bar, the filled portion, the knob. Flattened
    // to `Canvas` the control disappears whole - no track, no value, nothing to grab.
    const slider = mount(`
      <div class="slider" data-orientation="horizontal">
        <div class="slider__track" data-fill-start="true">
          <div class="slider__fill"></div>
          <div class="slider__thumb"></div>
        </div>
      </div>
    `);
    const track = slider.querySelector<HTMLElement>(".slider__track")!;
    const thumb = slider.querySelector<HTMLElement>(".slider__thumb")!;
    const knob = styleOf(thumb, "::after");

    expect(styleOf(track).outlineStyle).not.toBe("none");
    expect(styleOf(slider.querySelector(".slider__fill")!).backgroundColor).toBe(
      systemColor("Highlight"),
    );

    // The knob reads against the bare track on one side and the fill on the other, so it is
    // the ring that has to survive - `shadow-field` is a box-shadow and does not.
    expect(knob.outlineStyle).not.toBe("none");
    expect(knob.backgroundColor).toBe(systemColor("Canvas"));
    // The wrapper matches the fill normally; opaque here it would punch a hole through it.
    // Matched on the alpha rather than the whole colour: forced colors keeps `transparent`
    // transparent but restates it in the palette's own channels.
    expect(styleOf(thumb).backgroundColor).toMatch(/,\s*0\)$/);
  });

  it("keeps the slider's transparent spacer borders from going opaque", () => {
    // The track holds room for the thumb at either end with 0.75rem transparent borders, and a
    // transparent border-color is one of the few things forced colors turns *opaque* - so
    // without help they render as solid blocks at both ends of the bar. The filled end is the
    // exception: there the border carries the fill past the spacer.
    const track = mount(`
      <div class="slider" data-orientation="horizontal">
        <div class="slider__track" data-fill-start="true"></div>
      </div>
    `).querySelector<HTMLElement>(".slider__track")!;

    expect(styleOf(track).borderInlineEndColor).toBe(systemColor("Canvas"));
    expect(styleOf(track).borderInlineStartColor).toBe(systemColor("Highlight"));
  });

  it.each([
    ["button", `<button class="button button--secondary">x</button>`],
    ["toggle-button", `<button class="toggle-button">x</button>`],
    ["tag", `<div class="tag tag--md">x</div>`],
    ["input", `<input class="input" value="x" />`],
    ["textarea", `<textarea class="textarea">x</textarea>`],
    ["input-group", `<div class="input-group"></div>`],
    ["select trigger", `<button class="select__trigger">x</button>`],
  ])("keeps the %s identifiable as a control", (_name, markup) => {
    // Every one of these is a fill and a shadow and nothing else - flattened, they read as bare
    // text with no sign they can be clicked or typed into. The fields make it worse:
    // `--border-width-field` is 0, so their declared border brings nothing back on its own.
    const control = mount(markup);
    const style = styleOf(control);

    expect(style.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineColor).toBe(systemColor("ButtonBorder"));
  });

  it("keeps the emphasised buttons apart from the rest", () => {
    // Forced colors has no keyword for "this is the important one", so the emphasis has to come
    // from solid against outlined - the same split the chip keeps.
    const solid = mount(`<button class="button button--primary">x</button>`);
    const plain = mount(`<button class="button button--secondary">x</button>`);

    expect(styleOf(solid).backgroundColor).toBe(systemColor("CanvasText"));
    expect(styleOf(solid).forcedColorAdjust).toBe("none");
    expect(styleOf(plain).backgroundColor).not.toBe(styleOf(solid).backgroundColor);
  });

  it("keeps a chip looking like a chip", () => {
    // A chip is nothing but its colour, so the mode leaves it as bare label text - not a weaker
    // chip, no chip at all. The status cannot survive (there is no keyword for success or
    // warning), but the shape and the solid/outlined split can.
    const solid = mount(`<span class="chip chip--primary chip--success">Completed</span>`);
    const outlined = mount(`<span class="chip chip--soft chip--success">Completed</span>`);

    expect(styleOf(solid).outlineStyle).not.toBe("none");
    expect(styleOf(outlined).outlineStyle).not.toBe("none");

    // Solid stays solid, and opts out so the backplate does not cover its label.
    expect(styleOf(solid).backgroundColor).toBe(systemColor("CanvasText"));
    expect(styleOf(solid).forcedColorAdjust).toBe("none");
    expect(styleOf(outlined).backgroundColor).not.toBe(styleOf(solid).backgroundColor);
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
