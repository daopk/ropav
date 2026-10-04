import type { FieldNarrowTree } from "./field-narrow-fixtures.types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import Fixture from "./field-narrow-fixtures.vue";

/**
 * A full-width field in a column as narrow as a sidebar keeps what trails its control inside it.
 *
 * Each of these fields is a flex row with an `<input>` in it, and an `<input>` has a width of its
 * own: about twenty characters, whatever the box around it. A flex item will not shrink below its
 * content unless it is told it may, so a control that only says `flex: 1` stays twenty characters
 * wide and shoves the clear button, the suffix or the stepper past the field's edge - or, where the
 * group clips, out of sight. Every one of these controls has to say `min-width: 0`; the rule is
 * copied into each stylesheet because each is a public import that stands on its own, and nothing
 * but this suite holds the copies to one another.
 *
 * Measured on both sides of 40rem, because below it every field sets 16px type and the control's
 * own width grows with it.
 *
 * A new field is an entry in `FIELDS` and a branch in the fixture that renders it.
 */

/**
 * The fixture's column. A sidebar's width, at the narrow end: a search field is about 226px wide
 * at its content at 14px type, so a column any wider would let it pass at 40rem and up.
 */
const COLUMN = 200;

const WIDTHS = [
  { label: "below 40rem", width: 375 },
  { label: "at 40rem and wider", width: 1024 },
] as const;

interface Field {
  tree: FieldNarrowTree;
  /** The `data-slot` of the element that draws the field. */
  shell: string;
  /** The `data-slot` of the last thing in the row, which is the one that gets pushed out. */
  trailing: string;
}

const FIELDS: Field[] = [
  { shell: "search-field-group", trailing: "search-field-clear-button", tree: "SearchField" },
  { shell: "input-group", trailing: "input-group-suffix", tree: "InputGroup" },
  { shell: "input-group", trailing: "input-group-suffix", tree: "TextField > InputGroup" },
  { shell: "number-field-group", trailing: "number-field-increment-button", tree: "NumberField" },
  { shell: "combo-box-input-group", trailing: "combo-box-trigger", tree: "ComboBox" },
  { shell: "color-input-group", trailing: "color-input-group-suffix", tree: "ColorField" },
];

const slot = (container: HTMLElement, name: string) => {
  const element = container.querySelector<HTMLElement>(`[data-slot="${name}"]`);

  if (!element) throw new Error(`nothing rendered [data-slot="${name}"]`);

  return element;
};

/** The inline-end edge, in whole pixels so a subpixel layout does not read as an overflow. */
const end = (element: Element) => Math.round(element.getBoundingClientRect().right);

const unmounts: (() => void)[] = [];

let initial = { height: 0, width: 0 };

beforeAll(() => {
  initial = { height: innerHeight, width: innerWidth };
});

afterAll(async () => {
  // The viewport belongs to the page, and the page outlives this file.
  await page.viewport(initial.width, initial.height);
});

afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount();
});

describe.each(WIDTHS)("a narrow field $label", ({ width }) => {
  beforeAll(async () => {
    await page.viewport(width, initial.height);
  });

  it(`is laid out at ${width}px`, () => {
    expect(innerWidth).toBe(width);
  });

  it.each(FIELDS)("$tree keeps its $trailing inside", ({ shell, trailing, tree }) => {
    const { container, unmount } = renderVapor(Fixture, { props: { tree } });

    unmounts.push(unmount);

    const column = container.querySelector<HTMLElement>("[data-testid='column']")!;
    const field = slot(container, shell);

    // The column first, so a fixture that stopped being narrow fails here rather than passing.
    expect(Math.round(column.getBoundingClientRect().width)).toBe(COLUMN);

    // The field fills the column and no further, and nothing inside it runs past its edge - read
    // from the scroll width too, since a group that clips would hide the overflow from the rects.
    expect(end(field)).toBe(end(column));
    expect(field.scrollWidth).toBe(field.clientWidth);
    expect(end(slot(container, trailing))).toBeLessThanOrEqual(end(field));
  });
});
