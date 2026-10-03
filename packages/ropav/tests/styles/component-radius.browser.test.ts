import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";

import Fixture from "./component-radius-fixtures.vue";

// Opt-in like every bundled palette, so the suite imports the one it reads.
import "../../../styles/themes/uber.css";

/**
 * A theme pairs its controls with its fields by setting `--rp-component-radius` alone.
 *
 * That is the promise `theming/custom-theme.md` makes under "Corners": a button under a text field,
 * a toggle button, an alert and both ends of either group all read the one token, at every size,
 * so pointing it at `--rp-field-radius` is the whole change. Nothing else holds them to it - each
 * stylesheet writes the token out for itself, and a copy that reached for a radius of its own would
 * still draw a rounded control, only one that no longer meets the field above it.
 *
 * The bundled palettes are the case that shows the suite can tell: they leave the token at three
 * steps of `--rp-radius`, rounder than their fields, until a theme points it elsewhere.
 */

const SIZES = ["xs", "sm", "md", "lg"] as const;

/** Each corner of a box, in the order `border-radius` lists them, in whole pixels. */
const cornersOf = (element: Element) => {
  const style = getComputedStyle(element);

  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map((value) => Math.round(Number.parseFloat(value)));
};

const byTestId = (container: HTMLElement, id: string) => {
  const element = container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  if (!element) throw new Error(`nothing rendered [data-testid="${id}"]`);

  return element;
};

/** Every corner the token should reach, keyed by what draws it, with the radius each one reads. */
const cornersIn = (container: HTMLElement) => {
  const children = (id: string) => [...byTestId(container, id).children];
  const [hFirst, hMiddle, hLast] = children("button-group-horizontal");
  const [vFirst, vMiddle, vLast] = children("button-group-vertical");
  const [thFirst, thMiddle, thLast] = children("toggle-button-group-horizontal");
  const [tvFirst, tvMiddle, tvLast] = children("toggle-button-group-vertical");

  return {
    alert: cornersOf(byTestId(container, "alert")),
    button: cornersOf(byTestId(container, "button")),
    "button group, horizontal": [hFirst, hMiddle, hLast].map((child) => cornersOf(child!)),
    "button group, vertical": [vFirst, vMiddle, vLast].map((child) => cornersOf(child!)),
    "toggle button": cornersOf(byTestId(container, "toggle-button")),
    "toggle button group, detached": children("toggle-button-group-detached").map(cornersOf),
    "toggle button group, horizontal": [thFirst, thMiddle, thLast].map((child) =>
      cornersOf(child!),
    ),
    "toggle button group, vertical": [tvFirst, tvMiddle, tvLast].map((child) => cornersOf(child!)),
  };
};

/** What every corner above reads when the token resolves to `radius`, the inner ones squared off. */
const expected = (radius: number) => {
  const all = [radius, radius, radius, radius];
  const none = [0, 0, 0, 0];
  // Logical in a row, so the start is the left in this left-to-right page.
  const rowStart = [radius, 0, 0, radius];
  const rowEnd = [0, radius, radius, 0];
  const columnTop = [radius, radius, 0, 0];
  const columnBottom = [0, 0, radius, radius];

  return {
    alert: all,
    button: all,
    "button group, horizontal": [rowStart, none, rowEnd],
    "button group, vertical": [columnTop, none, columnBottom],
    "toggle button": all,
    "toggle button group, detached": [all, all, all],
    "toggle button group, horizontal": [rowStart, none, rowEnd],
    "toggle button group, vertical": [columnTop, none, columnBottom],
  };
};

const unmounts: (() => void)[] = [];

afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount();
  document.documentElement.style.removeProperty("--rp-field-radius");
});

const render = (size: (typeof SIZES)[number], theme?: Record<string, string>) => {
  const { container, unmount } = renderVapor(Fixture, { props: { size } });

  unmounts.push(unmount);

  for (const [name, value] of Object.entries(theme ?? {})) {
    if (name === "data-theme") container.dataset["theme"] = value;
    else container.style.setProperty(name, value);
  }

  return container;
};

const fieldRadiusIn = (container: HTMLElement) => cornersOf(byTestId(container, "field"))[0]!;

describe.each(SIZES)("the corners at %s", (size) => {
  it("meet the field's under the default theme, which points one token at the other", () => {
    const container = render(size);

    expect(fieldRadiusIn(container)).toBe(6);
    expect(cornersIn(container)).toEqual(expected(6));
  });

  it("follow the field's radius when an app moves it on the root", () => {
    // The default theme's `--rp-component-radius` is `var(--rp-field-radius)`, declared on the
    // root, so one token moved there moves both.
    document.documentElement.style.setProperty("--rp-field-radius", "2px");

    const container = render(size);

    expect(fieldRadiusIn(container)).toBe(2);
    expect(cornersIn(container)).toEqual(expected(2));
  });

  it("stay rounder than the field under a bundled palette", () => {
    const container = render(size, { "data-theme": "uber" });

    // Uber's fields are 4px; its controls are three steps of a 4px `--rp-radius`.
    expect(fieldRadiusIn(container)).toBe(4);
    expect(cornersIn(container)).toEqual(expected(12));
  });

  it("meet the field's once that palette sets the one token", () => {
    const container = render(size, {
      "--rp-component-radius": "var(--rp-field-radius)",
      "data-theme": "uber",
    });

    expect(fieldRadiusIn(container)).toBe(4);
    expect(cornersIn(container)).toEqual(expected(4));
  });

  it("leaves a chip round when it is handed its own token", () => {
    const container = render(size);
    const chip = byTestId(container, "chip");

    // What `.rp-chip { --rp-component-radius: 32px }` does: the token is read on the element that
    // draws the corner, so the chip takes it and the controls around it keep the field's.
    chip.style.setProperty("--rp-component-radius", "32px");

    expect(cornersOf(chip)).toEqual([32, 32, 32, 32]);
    expect(cornersIn(container)).toEqual(expected(6));
  });
});
