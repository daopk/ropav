import type { FieldMetricsTree } from "./field-metrics-fixtures.types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import { Button } from "@/components/button";

import Fixture from "./field-metrics-fixtures.vue";

/**
 * Every field stands on the control scale, at every size, on both sides of 40rem, and under any
 * field border a theme draws.
 *
 * The metrics are written out by hand, once per size, in each field's own stylesheet - nine files,
 * thirty-six copies - because every `components/*.css` is a public import that has to stand on its
 * own, so they cannot share a rule. Nothing but this suite holds the copies to one another. A copy
 * that drifts still renders a field, only one that stops lining up with the button beside it, or
 * that zooms the page on focus in mobile Safari.
 *
 * Two things are read on each field. The shell's height is what a caller sees. The control's type,
 * line and padding are the copy itself, and they are read as well because a shell's height cannot
 * always see them: the search, number, colour and date groups state a fixed height, and a select's
 * trigger and an input group state a floor, so a control whose padding drifted would sit inside
 * the same box it did before.
 *
 * The border is the third axis. A field's border sits inside its height rather than on top of it -
 * every copy gives `--rp-border-width-field` back out of its padding - so the shell is held to the
 * height of a button of the same size, rendered beside it, whatever `--rp-field-border-width` the
 * theme sets. The default theme draws none, which is the one width a padding that forgot the
 * border would still pass at.
 *
 * A new size is an entry in `SIZES`; a new field is an entry in `FIELDS` and a branch in the
 * fixture that renders it.
 */

/** The control scale, and the type each size sets from 40rem up. */
const SIZES = [
  { height: 28, size: "xs", type: 12 },
  { height: 32, size: "sm", type: 14 },
  { height: 36, size: "md", type: 14 },
  { height: 40, size: "lg", type: 16 },
] as const;

/** The line the theme sets under each type size - `--rp-text-{xs,sm,base}--line-height`. */
const LINE: Record<number, number> = { 12: 16, 14: 20, 16: 24 };

/**
 * One width either side of the breakpoint. Below it every size sets 16px type, because anything
 * smaller makes mobile Safari zoom the page when the field takes focus; the padding gives back the
 * difference, so the height is the same on both sides.
 */
const WIDTHS = [
  { label: "below 40rem", wide: false, width: 375 },
  { label: "at 40rem and wider", wide: true, width: 1024 },
] as const;

/**
 * The field border, in pixels. 0 is the default theme's; 1 is the edge a theme draws when it draws
 * one. 2 is as wide as the scale has room for, since `xs` below 40rem has only 2px of padding to
 * give back.
 */
const BORDERS = [0, 1, 2] as const;

interface Field {
  tree: FieldMetricsTree;
  /** The `data-slot` of the element that draws the field - its edge, its fill, its height. */
  shell: string;
  /** The `data-slot` of the element the size's type and padding land on. */
  control: string;
  /** Whether the shell stands on the scale at all. */
  onScale?: false;
}

const FIELDS: Field[] = [
  { control: "input", shell: "input", tree: "Input" },
  /*
   * A textarea opens two rows tall and holds a `min-height: 38px` under that, so its box is never
   * 28, 32 or 36px. Its line is: the type and the padding are the same copy every other field
   * carries, and that is the part that can drift.
   */
  { control: "textarea", onScale: false, shell: "textarea", tree: "TextArea" },
  { control: "input-group-input", shell: "input-group", tree: "InputGroup" },
  { control: "search-field-input", shell: "search-field-group", tree: "SearchField" },
  { control: "number-field-input", shell: "number-field-group", tree: "NumberField" },
  { control: "select-trigger", shell: "select-trigger", tree: "Select" },
  { control: "autocomplete-trigger", shell: "autocomplete-trigger", tree: "Autocomplete" },
  /*
   * ComboBox has no copy of its own. The size is set on the root and the `Input` inside takes it
   * through the TextField context, so this entry is that hand-off as well as the metrics.
   */
  { control: "input", shell: "combo-box-input-group", tree: "ComboBox" },
  { control: "color-input-group-input", shell: "color-input-group", tree: "ColorField" },
  { control: "date-input-group-input", shell: "date-input-group", tree: "DateField" },
  { control: "date-input-group-input", shell: "date-input-group", tree: "TimeField" },
  // A size arriving from a TextField around the field, rather than set on it.
  { control: "input", shell: "input", tree: "TextField > Input" },
  { control: "textarea", onScale: false, shell: "textarea", tree: "TextField > TextArea" },
  { control: "input-group-input", shell: "input-group", tree: "TextField > InputGroup" },
];

const CASES = FIELDS.flatMap((field) => SIZES.map((step) => ({ ...field, ...step })));

const px = (value: string) => Math.round(Number.parseFloat(value));

const heightOf = (element: Element) => Math.round(element.getBoundingClientRect().height);

/** What a size writes onto the control, in whole pixels. */
const metrics = (element: Element) => {
  const style = getComputedStyle(element);

  return {
    fontSize: px(style.fontSize),
    lineHeight: px(style.lineHeight),
    paddingBlock: [px(style.paddingTop), px(style.paddingBottom)],
  };
};

const slot = (container: HTMLElement, name: string) => {
  const element = container.querySelector<HTMLElement>(`[data-slot="${name}"]`);

  if (!element) throw new Error(`nothing rendered [data-slot="${name}"]`);

  return element;
};

const unmounts: (() => void)[] = [];

let initial = { height: 0, width: 0 };

beforeAll(() => {
  initial = { height: innerHeight, width: innerWidth };
});

afterAll(async () => {
  // The viewport belongs to the page, and the page outlives this file - leaving it resized would
  // hand the last width to whichever test file Vitest runs here next.
  await page.viewport(initial.width, initial.height);
});

afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount();
});

describe.each(WIDTHS)("a field $label", ({ wide, width }) => {
  beforeAll(async () => {
    await page.viewport(width, initial.height);
  });

  it(`is laid out at ${width}px`, () => {
    // Every case below would pass at the wrong width for the sizes whose type does not change, so
    // fail here first if the resize did not take.
    expect(innerWidth).toBe(width);
    expect(matchMedia("(width >= 40rem)").matches).toBe(wide);
  });

  describe.each(BORDERS)("under a %ipx field border", (border) => {
    beforeAll(() => {
      // On the root, where the theme declares it and where `--rp-border-width-field` is read.
      document.documentElement.style.setProperty("--rp-field-border-width", `${border}px`);
    });

    afterAll(() => {
      document.documentElement.style.removeProperty("--rp-field-border-width");
    });

    it(`draws ${border}px`, () => {
      // A border that never reached the field would leave every case below measuring the default
      // theme's, so fail here first if the property did not take.
      const { container, unmount } = renderVapor(Fixture, { props: { size: "md", tree: "Input" } });

      unmounts.push(unmount);

      expect(px(getComputedStyle(slot(container, "input")).borderTopWidth)).toBe(border);
    });

    it.each(CASES)("$tree at $size", ({ control, height, onScale, shell, size, tree, type }) => {
      const { container, unmount } = renderVapor(Fixture, { props: { size, tree } });
      const beside = renderVapor(Button, {
        props: { size },
        slots: { default: () => document.createTextNode("Save") },
      });

      unmounts.push(unmount, beside.unmount);

      const fontSize = wide ? type : 16;
      const lineHeight = LINE[fontSize]!;
      const padding = (height - lineHeight) / 2 - border;

      expect(metrics(slot(container, control))).toEqual({
        fontSize,
        lineHeight,
        paddingBlock: [padding, padding],
      });

      if (onScale !== false) {
        expect({
          button: heightOf(slot(beside.container, "button")),
          field: heightOf(slot(container, shell)),
        }).toEqual({ button: height, field: height });
      }
    });
  });
});
