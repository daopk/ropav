import { VARIANT_ATTRIBUTES } from "@ropav/testing/helpers/component-attributes";
import { describe, expect, it } from "vitest";

import { componentCases } from "./migration/cases";
import { mount } from "./migration/render";
import { splitTopLevel, topLevelCombinators } from "./migration/selector-dom";

/**
 * A variant attribute styles the element wearing it, and nothing under it.
 *
 * This is the one property a modifier class had that an attribute could quietly lose. Written as
 * `.rp-sidebar--inset .rp-sidebar__panel`, a rule reaches every panel inside the shell — including
 * the panels of a sidebar nested in another one, which then wears its parent's variant. The class
 * form has the same hazard and the stylesheet avoids it by putting the modifier on the part it
 * styles; moving to attributes is the moment that convention has to become a rule, because an
 * attribute reads as something the shell owns and a descendant selector is the obvious way to
 * spend it.
 *
 * Read off CSSOM rather than the files, so nesting arrives resolved: `&[data-variant] .child`
 * looks like two innocent halves in the source and is one reaching selector by the time it
 * matches.
 */

const VARIANT = new RegExp(String.raw`\[data-(${VARIANT_ATTRIBUTES.join("|")})[\]=]`);

/** Every complex selector whose variant attribute sits left of a combinator. */
const reaching = (sheets: StyleSheetList) => {
  const found: string[] = [];

  for (const item of componentCases(sheets)) {
    for (const complex of splitTopLevel(item.selector, ",")) {
      const rightmost = topLevelCombinators(complex).at(-1);

      if (!rightmost) continue;
      if (VARIANT.test(complex.slice(0, rightmost.at + 1))) found.push(complex);
    }
  }

  return found;
};

describe("a variant attribute", () => {
  it("styles the element that wears it and nothing beneath it", () => {
    expect(reaching(document.styleSheets)).toEqual([]);
  });

  /*
   * Nothing writes a variant attribute yet, so the case above is an empty room until the first
   * component moves. A guard whose first real run is the one it has to catch is a guard nobody has
   * tested, and this suite has been bitten by a sweep that matched nothing before.
   */
  it("is caught when it does reach, combinator or nesting either way", () => {
    const doc = mount(`@layer components {
      .rp-probe[data-variant="soft"] .rp-probe__part { color: red }
      .rp-probe[data-variant="soft"] > .rp-probe__part { color: red }
      .rp-probe { &[data-variant="soft"] { .rp-probe__part { color: red } } }
      .rp-probe[data-variant="soft"]::after { color: red }
      .rp-probe__part[data-variant="soft"] { color: red }
    }`);
    const found = reaching(doc.styleSheets);

    doc.defaultView!.frameElement!.remove();

    // Named rather than counted, so a parser that finds three of the wrong things still fails.
    // The last two rules are not reaches: a pseudo-element is the element's own, and an attribute
    // on the part it styles is the shape the convention asks for.
    expect(found).toEqual([
      '.rp-probe[data-variant="soft"] .rp-probe__part',
      '.rp-probe[data-variant="soft"] > .rp-probe__part',
      ':is(:is(.rp-probe)[data-variant="soft"]) .rp-probe__part',
    ]);
  });
});
