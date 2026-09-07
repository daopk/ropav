import { describe, expect, it } from "vitest";

import styles from "@/styles.css?inline";

/**
 * The reset stops at the component.
 *
 * It replaced a page-wide reset — and a page-wide reset from a component library is a bug that
 * only ever shows up in someone else's markup: the host's own headings and lists lose their
 * margins on a page that never asked this package to touch them, and nothing errors. So the scope
 * is `[class^="rp-"]`, `[class*=" rp-"]` and their descendants, and this is the test that says so.
 *
 * The suffix cases are the ones a naive `[class*="rp-"]` would swallow. Both are plausible names
 * in somebody else's codebase, and the naive form was tried: `.corp-rp-widget` lost its margin.
 *
 * The other half of what the reset has to do — supply inside a component everything the page-wide
 * one used to supply everywhere — is `bundled.browser.test.ts`'s subject by way of the whole
 * stylesheet, and was measured rule by rule when the reset was written: without it the components
 * came out in the browser's default serif, at `content-box`, and with every border gone, because
 * the rules size a border with `border-width` alone and let the reset supply the style.
 */

/** A document of its own, because a reset is a property of the page it is on. */
const mount = (css: string): Document => {
  const frame = document.createElement("iframe");

  frame.setAttribute("style", "position:absolute;top:-100000px;left:0;width:1280px;height:720px");
  document.body.appendChild(frame);

  const doc = frame.contentDocument!;

  doc.open();
  doc.write("<!doctype html><html><head></head><body></body></html>");
  doc.close();

  const style = doc.createElement("style");

  style.textContent = css;
  doc.head.appendChild(style);

  return doc;
};

describe("the scoped reset", () => {
  it("leaves markup outside a component alone", () => {
    const doc = mount(styles);
    const host = doc.createElement("div");

    host.innerHTML = `
      <div class="corp-header"><h1 id="heading">Title</h1><ul id="list"><li>One</li></ul></div>
      <div class="corp-rp-widget"><p id="suffix">Not ours</p></div>
      <p class="rpx-thing" id="near-miss">Also not ours</p>
      <div class="rp-card"><h1 id="inside">Ours</h1></div>
    `;
    doc.body.appendChild(host);

    const at = (id: string, property: string) =>
      doc.defaultView!.getComputedStyle(doc.getElementById(id)!).getPropertyValue(property);

    const untouched = {
      heading: {
        margin: at("heading", "margin-block-start"),
        weight: at("heading", "font-weight"),
      },
      list: { padding: at("list", "padding-inline-start"), style: at("list", "list-style-type") },
      nearMiss: at("near-miss", "margin-block-start"),
      suffix: at("suffix", "margin-block-start"),
    };
    // The same heading inside a component, to prove the reset is reaching anything at all.
    const inside = {
      margin: at("inside", "margin-block-start"),
      weight: at("inside", "font-weight"),
    };

    host.remove();

    expect({ inside, untouched }).toEqual({
      inside: { margin: "0px", weight: "400" },
      untouched: {
        heading: { margin: "21.44px", weight: "700" },
        list: { padding: "40px", style: "disc" },
        nearMiss: "16px",
        suffix: "16px",
      },
    });
  });

  /*
   * And the page's own two, which the scope cannot carry: a component root can hold neither the
   * page's font nor its line height without taking them away from the host. An app with no reset
   * of its own renders the components in the browser's default serif, which is behaviour the
   * release note has to lead with rather than something to catch here — so what is asserted is
   * only that the package is not quietly setting them after all.
   */
  it("sets neither the page font nor its line height", () => {
    const doc = mount(styles);
    const html = doc.defaultView!.getComputedStyle(doc.documentElement);

    expect({
      family: html.getPropertyValue("font-family"),
      leading: html.getPropertyValue("line-height"),
    }).toEqual({ family: "Times", leading: "normal" });
  });
});
