import { afterEach, describe, expect, it } from "vitest";

/**
 * What the gap between two rows costs the rows around it.
 *
 * The indicator moves with the pointer, so anything it takes out of the flow it takes out again a
 * row further down a moment later — and the table walks about under the drag. A windowed table
 * never had the problem, because its layout places the band on top of the boundary rather than
 * between the rows; this pins the same for a table in ordinary flow, where the row *is* in the
 * flow and has to be talked out of occupying it.
 *
 * A browser rather than jsdom: the question is what the cascade and the table layout algorithm
 * do with a zero-height row, which is exactly what jsdom has no answer for.
 */

const roots: HTMLElement[] = [];

/** A three-row table, optionally with a gap standing before the middle row. */
const mount = (options: { withIndicator?: boolean; isDropTarget?: boolean } = {}) => {
  const root = document.createElement("div");

  root.innerHTML = `
    <table class="table__content">
      <tbody>
        <tr class="table__row"><td class="table__cell">one</td></tr>
        ${
          options.withIndicator
            ? `<tr class="table__drop-indicator"${
                options.isDropTarget ? ' data-drop-target="true"' : ""
              }><td></td></tr>`
            : ""
        }
        <tr class="table__row" data-probe><td class="table__cell">two</td></tr>
        <tr class="table__row"><td class="table__cell">three</td></tr>
      </tbody>
    </table>
  `;

  document.body.append(root);
  roots.push(root);

  return root;
};

const probeTop = (root: HTMLElement) =>
  root.querySelector("[data-probe]")!.getBoundingClientRect().top -
  root.getBoundingClientRect().top;

const indicatorIn = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".table__drop-indicator")!;

afterEach(() => {
  for (const root of roots.splice(0)) root.remove();
});

describe("the table's drop indicator in flow", () => {
  it("leaves the rows below it where they were", () => {
    const without = probeTop(mount());

    expect(probeTop(mount({ withIndicator: true }))).toBe(without);
    expect(probeTop(mount({ isDropTarget: true, withIndicator: true }))).toBe(without);
  });

  it("takes no height of its own", () => {
    expect(indicatorIn(mount({ isDropTarget: true, withIndicator: true })).offsetHeight).toBe(0);
  });

  /**
   * The line straddles the boundary rather than hanging below it, which is what the windowed
   * layout does with `dropIndicatorThickness` — half above the edge, half below.
   */
  it("centres the line on the boundary it stands for", () => {
    const root = mount({ isDropTarget: true, withIndicator: true });
    const cell = indicatorIn(root).querySelector("td")!;
    const line = getComputedStyle(cell, "::after");

    expect(line.height).toBe("2px");
    expect(line.top).toBe("-1px");
  });
});
