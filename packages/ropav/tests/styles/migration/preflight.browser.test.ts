import { describe, expect, it } from "vitest";

import { componentCases } from "./cases";
import { declaredProperties, renderAll } from "./render";

import withoutReset from "./no-preflight.fixture.css?inline";
import withReset from "@/styles.css?inline";

/**
 * The two entries render the components the same, or the reset is still doing work nobody has
 * written down.
 *
 * `no-preflight.css` has shipped since the entry existed, for apps that already reset their own
 * page, describing itself as identical to `index.css` in every other way. Nothing had ever
 * rendered it. It was not identical: without Tailwind's reset the components came out in the
 * browser's default serif, at `content-box`, and — the one that would have been hardest to find —
 * with every border gone, because the rules size a border with `border-width` alone and let the
 * reset supply the style, so `border-style` fell back to `none` while the source went on saying
 * `1px`.
 *
 * That is what this measures, and it is the reason `base/reset.css` contains what it contains:
 * each group in that file is here because taking it away moves one of these numbers.
 *
 * The golden cannot ask this question. It records each element against a copy of itself with the
 * leaf's own attributes stripped, and a page-wide reset lands on both sides of that subtraction —
 * remove it and the pair moves together, leaving the delta where it was. So this mounts the same
 * cases twice, under the two stylesheets the package ships, and compares the two targets.
 */

/** A document of its own per stylesheet, because two resets cannot share one. */
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

describe("the entry without Tailwind's reset", () => {
  it("renders every component rule the same as the entry with it", () => {
    const withDoc = mount(withReset);
    const withoutDoc = mount(withoutReset);

    // Both entries compile the same component layer, so either side can name the cases.
    const cases = componentCases(withDoc.styleSheets);
    const properties = declaredProperties(withDoc.styleSheets).filter((p) => !p.startsWith("--"));

    const a = renderAll(cases, ["light"], withDoc);
    const b = renderAll(cases, ["light"], withoutDoc);

    const differing = new Map<string, number>();
    const example = new Map<string, string>();
    let compared = 0;

    for (const [id, left] of a.rendered.get("light")!) {
      const right = b.rendered.get("light")!.get(id);

      if (!right) continue;

      compared++;

      const before = withDoc.defaultView!.getComputedStyle(left.target);
      const after = withoutDoc.defaultView!.getComputedStyle(right.target);

      for (const property of properties) {
        const one = before.getPropertyValue(property);
        const two = after.getPropertyValue(property);

        if (one === two) continue;

        differing.set(property, (differing.get(property) ?? 0) + 1);
        if (!example.has(property)) example.set(property, `${id.slice(0, 70)} | ${one} -> ${two}`);
      }
    }

    a.host.remove();
    b.host.remove();

    const ranked = [...differing].sort((x, y) => y[1] - x[1]);

    expect({
      differences: Object.fromEntries(ranked),
      // Guards the harness rather than the stylesheet: an empty report is what a comparison that
      // built nothing also produces.
      ran: compared > 0,
      sample: ranked.slice(0, 8).map(([property]) => `${property}: ${example.get(property)}`),
    }).toEqual({ differences: {}, ran: true, sample: [] });
  });

  /*
   * The other direction, and the reason the scope is written the way it is. A reset that reached
   * past the components would be the same bug as the one it replaces, just quieter: the host's
   * own headings and lists would lose their margins on a page that never asked this package to
   * touch them, and nothing would error.
   *
   * The suffix cases are the ones a naive `[class*="rp-"]` would swallow. Both are plausible
   * names in somebody else's codebase.
   */
  it("leaves markup outside a component alone", () => {
    const doc = mount(withoutReset);
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
});
