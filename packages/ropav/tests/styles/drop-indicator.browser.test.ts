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
    <table class="rp-table__content">
      <tbody>
        <tr class="rp-table__row"><td class="rp-table__cell">one</td></tr>
        ${
          options.withIndicator
            ? `<tr class="rp-table__drop-indicator"${
                options.isDropTarget ? ' data-drop-target="true"' : ""
              }><td></td></tr>`
            : ""
        }
        <tr class="rp-table__row" data-probe><td class="rp-table__cell">two</td></tr>
        <tr class="rp-table__row"><td class="rp-table__cell">three</td></tr>
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
  root.querySelector<HTMLElement>(".rp-table__drop-indicator")!;

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

/**
 * The list box has the same problem twice over: its options are spaced by a margin between
 * siblings, so a gap standing between two of them would take its own height *and* a second helping
 * of that margin. Every arrangement below has to lay the options out exactly where a list with no
 * gaps at all would.
 */

/** A three-option list, with gaps at the positions named. */
const mountList = (at: ("after" | "before" | "between")[] = []) => {
  const root = document.createElement("div");
  const gap = `<div class="rp-list-box__drop-indicator" data-drop-target="true"></div>`;
  const option = (label: string, probe = false) =>
    `<div data-slot="list-box-item"${probe ? " data-probe" : ""}>${label}</div>`;

  root.innerHTML = `
    <div class="rp-list-box">
      ${at.includes("before") ? gap : ""}
      ${option("one")}
      ${at.includes("between") ? gap : ""}
      ${option("two", true)}
      ${option("three")}
      ${at.includes("after") ? gap : ""}
    </div>
  `;

  document.body.append(root);
  roots.push(root);

  return root;
};

const listBoxIn = (root: HTMLElement) => root.querySelector<HTMLElement>(".rp-list-box")!;

describe("the list box's drop indicator in flow", () => {
  it("leaves the options where a list with no gaps puts them", () => {
    const bare = probeTop(mountList());

    for (const at of [
      ["before"],
      ["between"],
      ["after"],
      ["after", "before", "between"],
    ] as const) {
      expect(probeTop(mountList([...at]))).toBe(bare);
    }
  });

  it("adds nothing to the height of the list", () => {
    const bare = listBoxIn(mountList()).offsetHeight;

    expect(listBoxIn(mountList(["after", "before", "between"])).offsetHeight).toBe(bare);
  });

  it("sits on the edge of the option it stands before", () => {
    const line = getComputedStyle(
      mountList(["between"]).querySelector(".rp-list-box__drop-indicator")!,
      "::after",
    );

    expect(line.height).toBe("2px");
    expect(line.top).toBe("-1px");
  });
});
