import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import CheckboxFixture from "../components/checkbox/fixtures.vue";
import RadioGroupFixture from "../components/radio-group/fixtures.vue";
import SwitchFixture from "../components/switch/fixtures.vue";

import { declaredProperties, mount } from "./golden/render";

import animations from "../../../styles/animations.css?inline";
import base from "../../../styles/base/base.css?inline";
import reset from "../../../styles/base/reset.css?inline";
import scrollbar from "../../../styles/base/scrollbar.css?inline";
import checkbox from "../../../styles/components/checkbox.css?inline";
import fieldError from "../../../styles/components/field-error.css?inline";
import radio from "../../../styles/components/radio.css?inline";
import toggle from "../../../styles/components/switch.css?inline";
import motion from "../../../styles/motion.css?inline";
import slots from "../../../styles/slots.css?inline";
import theme from "../../../styles/themes/default.css?inline";
import tokens from "../../../styles/themes/shared/tokens.css?inline";

/**
 * The component files, imported one at a time in whatever order the app lists them.
 *
 * The full entry imports `field-error.css` ahead of every component that places an error, so it
 * only ever shows one order. The installation guide also offers the files one by one, and an app
 * listing them alphabetically puts `checkbox.css` ahead of `field-error.css`. A toggle's error is
 * where that bit: `field-error.css` zeroes the padding on it, the toggle indents it under its
 * label, and the two used to weigh the same, so whichever file came second won.
 *
 * Each order is mounted in a document of its own, on what the guide says comes first, with the
 * toggles' markup taken from what the components actually render.
 */

/** The guide's first block, in its order — everything a component file is written on top of. */
const FOUNDATION = [
  reset,
  `@layer base {\n${base}\n}`,
  `@layer base {\n${scrollbar}\n}`,
  motion,
  slots,
  animations,
  theme,
  tokens,
].join("\n");

/** The foundation, then the component files in the order given, as `layer(components)`. */
const sheet = (...files: string[]) => `${FOUNDATION}\n@layer components {\n${files.join("\n")}\n}`;

const ORDERS = {
  "field-error.css first, as the full entry has it": sheet(fieldError, checkbox, radio, toggle),
  "field-error.css last": sheet(checkbox, radio, toggle, fieldError),
};

const TOGGLES = ["checkbox", "radio", "switch"] as const;

/** What a fixture renders, invalid, with a description and an error under the toggle. */
const markupOf = async (fixture: unknown, props: Record<string, unknown>) => {
  const { container, unmount } = renderVapor(fixture as never, { props });

  await nextTick();

  const html = container.innerHTML;

  unmount();

  return html;
};

const markup = async () =>
  [
    await markupOf(CheckboxFixture, {
      isInvalid: true,
      withDescription: true,
      withFieldError: true,
    }),
    await markupOf(RadioGroupFixture, {
      isInvalid: true,
      withItemDescription: true,
      withItemFieldError: true,
    }),
    await markupOf(SwitchFixture, { isInvalid: true, withDescription: true, withFieldError: true }),
  ].join("");

const documents: Document[] = [];

/** A document carrying `css`, with the toggles in it, and each toggle's help text. */
const render = (css: string, html: string) => {
  const doc = mount(css);

  documents.push(doc);
  doc.body.innerHTML = html;

  const view = doc.defaultView!;
  const part = (toggle: (typeof TOGGLES)[number], name: string) =>
    view.getComputedStyle(
      doc.querySelector(`.rp-${toggle} > [data-slot="${name}"]`) ??
        expect.unreachable(`no ${name} under .rp-${toggle}`),
    );

  return { doc, part };
};

afterEach(() => {
  for (const doc of documents.splice(0)) doc.defaultView!.frameElement!.remove();
});

describe("a toggle's error, imported file by file", () => {
  it("starts under the label, where the description does, whichever file comes first", async () => {
    const html = await markup();

    for (const [order, css] of Object.entries(ORDERS)) {
      const { part } = render(css, html);
      const indents = Object.fromEntries(
        TOGGLES.map((toggle) => [
          toggle,
          {
            description: part(toggle, "description").paddingInlineStart,
            error: part(toggle, "field-error").paddingInlineStart,
          },
        ]),
      );

      // Past the box and the gap after it for Checkbox and Radio, past the track for Switch.
      expect(indents, order).toEqual({
        checkbox: { description: "28px", error: "28px" },
        radio: { description: "28px", error: "28px" },
        switch: { description: "52px", error: "52px" },
      });
    }
  });

  it("resolves the rest of the error the same in either order", async () => {
    const html = await markup();
    const [first, last] = Object.values(ORDERS).map((css) => render(css, html));
    const properties = declaredProperties(first!.doc.styleSheets);

    for (const toggle of TOGGLES) {
      const read = ({ part }: ReturnType<typeof render>) => {
        const style = part(toggle, "field-error");

        return Object.fromEntries(properties.map((name) => [name, style.getPropertyValue(name)]));
      };

      expect(read(last!), toggle).toEqual(read(first!));
    }
  });
});
