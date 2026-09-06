import { afterEach, describe, expect, it } from "vitest";

/**
 * The compiled stylesheet, as a page with no build step gets it.
 *
 * Every other test here reaches the styles through `setup-styles.ts`, which imports the source
 * entry and lets Vite resolve it — proving the entry works for someone who already has a
 * toolchain, and proving nothing at all about the file shipped for someone who does not. That
 * file is the whole of `ropav/styles/bundled.css`, and it was unreachable for a release without
 * anything noticing.
 *
 * So: read as bytes rather than imported, and mounted in an iframe. The import matters because
 * Vite would resolve and rewrite a stylesheet it is handed as CSS, which is exactly the work the
 * file is supposed to have had done already. The iframe matters because this document is already
 * wearing the stylesheet, and every assertion below would pass on an empty file without it.
 */

// A glob rather than a plain import: the file is a build artifact, and `pnpm test` does not
// depend on `pnpm build`. No match leaves this empty, and the suite says so instead of failing.
const bundles = import.meta.glob<string>("../../dist/ropav.min.css", {
  eager: true,
  import: "default",
  query: "?raw",
});

const css = Object.values(bundles)[0];

const frames: HTMLIFrameElement[] = [];

/** A document containing the stylesheet and the markup, and nothing else. */
const mount = (markup: string) => {
  const frame = document.createElement("iframe");

  document.body.appendChild(frame);
  frames.push(frame);

  const doc = frame.contentDocument as Document;
  const style = doc.createElement("style");

  // Assigned rather than written into the markup, so nothing in the file has to be escaped.
  style.textContent = css as string;
  doc.head.appendChild(style);
  doc.body.innerHTML = markup;

  return {
    styleOf: (selector: string) =>
      (frame.contentWindow as Window).getComputedStyle(doc.querySelector(selector) as Element),
    token: (name: string) =>
      (frame.contentWindow as Window)
        .getComputedStyle(doc.documentElement)
        .getPropertyValue(name)
        .trim(),
  };
};

afterEach(() => {
  for (const frame of frames.splice(0)) frame.remove();
});

describe.skipIf(!css)("the compiled stylesheet", () => {
  it("is finished — a browser has nothing left to fetch", () => {
    expect(css).not.toContain("@import");
  });

  it("has nothing left to compile either", () => {
    expect(css).not.toContain("@apply");
  });

  it("styles a component with no build step in between", () => {
    const { styleOf } = mount(`<button class="rp-button rp-button--primary">Save</button>`);

    expect(styleOf(".rp-button").display).toBe("inline-flex");
  });

  /*
   * On a `div`, not the button: a button is `border-box` and margin-free by UA default, so it
   * reads as reset whether one arrived or not. Every `w-full` beside a `px-*` in the component
   * layer is written against this.
   */
  it("carries the reset the component layer is written against", () => {
    const { styleOf } = mount(`<div id="plain"><p id="prose">text</p></div>`);

    expect(styleOf("#plain").boxSizing).toBe("border-box");
    expect(styleOf("#prose").marginBlockStart).toBe("0px");
  });

  it("carries the theme, so a component is painted and not just laid out", () => {
    const { styleOf, token } = mount(`<button class="rp-button rp-button--primary">Save</button>`);

    expect(token("--accent")).not.toBe("");
    // The variant sets `--button-bg` to the accent; the base rule paints it.
    expect(styleOf(".rp-button").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  it("carries the classes it offers by name, not only the ones components wear", () => {
    const { styleOf } = mount(`<div class="status-disabled"></div>`);

    expect(styleOf(".status-disabled").pointerEvents).toBe("none");
  });
});
