import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";
import { waitUntil } from "../../harness/wait-until";

import Fixture from "./fixtures.vue";
import NestedFixture from "./nested-fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`));

const POINTER = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" } as const;

const originOf = (handle: HTMLElement) => {
  const box = handle.getBoundingClientRect();

  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

const startDrag = async (handle: HTMLElement) => {
  const from = originOf(handle);

  handle.dispatchEvent(
    new PointerEvent("pointerdown", { ...POINTER, clientX: from.x, clientY: from.y }),
  );
  await nextTick();

  return from;
};

/**
 * One move, offset along the group's axis.
 *
 * On `window` rather than the handle, which is where `useMove` listens — a drag keeps going once
 * the pointer leaves the element it started on.
 */
const moveBy = async (
  from: { x: number; y: number },
  delta: number,
  orientation: "horizontal" | "vertical" = "horizontal",
) => {
  window.dispatchEvent(
    new PointerEvent("pointermove", {
      ...POINTER,
      clientX: from.x + (orientation === "horizontal" ? delta : 0),
      clientY: from.y + (orientation === "vertical" ? delta : 0),
    }),
  );
  await nextTick();
};

const endDrag = async () => {
  window.dispatchEvent(new PointerEvent("pointerup", POINTER));
  await nextTick();
};

const drag = async (
  handle: HTMLElement,
  delta: number,
  orientation: "horizontal" | "vertical" = "horizontal",
) => {
  const from = await startDrag(handle);

  await moveBy(from, delta, orientation);
  await endDrag();
};

/** Each panel's share of the track, so an assertion does not depend on the viewport. */
const shares = (container: HTMLElement, orientation: "horizontal" | "vertical" = "horizontal") => {
  const panels = slots(container, "splitter-panel");
  const sizes = panels.map((panel) => {
    const box = panel.getBoundingClientRect();

    return orientation === "horizontal" ? box.width : box.height;
  });
  const total = sizes.reduce((sum, size) => sum + size, 0);

  return sizes.map((size) => size / total);
};

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {
    props: { class: "h-64 w-[40rem]", ...props },
  });

  await nextTick();
  await settled(result.container);

  return result;
};

/**
 * The parts of Splitter only a real browser can show: the panels have to be laid out before a
 * pixel delta means anything, and the divider's hover growth is a computed style on a
 * pseudo-element.
 */
describe("Splitter (browser)", () => {
  it("drags the edge under the pointer", async () => {
    await parkPointer();

    const { container, unmount } = await render();
    const handle = slot(container, "splitter-handle");
    const track = slot(container, "splitter").getBoundingClientRect().width;

    await drag(handle, track / 4);

    const [start] = shares(container);

    expect(start).toBeGreaterThan(0.72);
    expect(start).toBeLessThan(0.78);
    unmount();
  });

  it("drags the edge on a vertical group", async () => {
    await parkPointer();

    const { container, unmount } = await render({ orientation: "vertical" });
    const handle = slot(container, "splitter-handle");
    const track = slot(container, "splitter").getBoundingClientRect().height;

    await drag(handle, track / 4, "vertical");

    const [start] = shares(container, "vertical");

    expect(start).toBeGreaterThan(0.72);
    expect(start).toBeLessThan(0.78);
    unmount();
  });

  it("clamps the drag at a panel's minimum", async () => {
    await parkPointer();

    const { container, unmount } = await render({
      panels: [{ id: "a" }, { id: "b", minSize: "40%" }],
    });

    await drag(slot(container, "splitter-handle"), 5000);

    const [, end] = shares(container);

    expect(end).toBeGreaterThan(0.38);
    expect(end).toBeLessThan(0.42);
    unmount();
  });

  it("marks the handle as dragging for the length of the gesture, and clears it on release", async () => {
    await parkPointer();

    const { container, unmount } = await render();
    const handle = slot(container, "splitter-handle");

    const from = await startDrag(handle);

    await moveBy(from, 40);
    expect(handle.dataset["dragging"]).toBe("true");

    await endDrag();
    expect(handle.dataset["dragging"]).toBeUndefined();
    unmount();
  });

  /* The listeners live on `window`, so letting go anywhere still finishes the drag. */
  it("keeps the gesture going once the pointer leaves the handle", async () => {
    await parkPointer();

    const { container, unmount } = await render();
    const handle = slot(container, "splitter-handle");
    const from = await startDrag(handle);

    await moveBy(from, 60);
    await moveBy({ x: from.x, y: from.y - 400 }, 60);

    const [start] = shares(container);

    expect(start).toBeGreaterThan(0.5);
    unmount();
  });

  /*
   * The reason the divider is a pseudo-element rather than the flex item itself: it can thicken
   * without the gutter changing width, so the panels do not jump by a pixel on hover.
   */
  it("thickens the divider on hover without moving the panels", async () => {
    await parkPointer();

    const { container, unmount } = await render();
    const handle = slot(container, "splitter-handle");

    const before = shares(container);
    const resting = getComputedStyle(handle, "::after").width;

    handle.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
    await nextTick();
    await settled(handle);

    expect(getComputedStyle(handle, "::after").width).not.toBe(resting);
    expect(shares(container)).toEqual(before);
    unmount();
  });

  it("reports a resize cursor for its axis", async () => {
    const horizontal = await render();

    expect(getComputedStyle(slot(horizontal.container, "splitter-handle")).cursor).toBe(
      "col-resize",
    );
    horizontal.unmount();

    const vertical = await render({ orientation: "vertical" });

    expect(getComputedStyle(slot(vertical.container, "splitter-handle")).cursor).toBe("row-resize");
    vertical.unmount();
  });

  /* A one-pixel line is not a target anyone can hit, so the target reaches past the gutter. */
  it("extends the grab area past the divider", async () => {
    await parkPointer();

    const { container, unmount } = await render();
    const handle = slot(container, "splitter-handle");
    const box = handle.getBoundingClientRect();
    const outside = document.elementFromPoint(box.right + 4, box.top + box.height / 2);

    expect(handle.contains(outside)).toBe(true);
    unmount();
  });

  it("draws the grip along the divider's own axis", async () => {
    const horizontal = await render({ showGrip: true });
    const upright = slot(horizontal.container, "splitter-handle-grip").getBoundingClientRect();

    expect(upright.width).toBeGreaterThan(0);
    expect(upright.height).toBeGreaterThan(upright.width);
    horizontal.unmount();

    const vertical = await render({ orientation: "vertical", showGrip: true });
    const flat = slot(vertical.container, "splitter-handle-grip").getBoundingClientRect();

    expect(flat.height).toBeGreaterThan(0);
    expect(flat.width).toBeGreaterThan(flat.height);
    vertical.unmount();
  });

  it("recolours the grip along with the divider on hover", async () => {
    await parkPointer();

    const { container, unmount } = await render({ showGrip: true });
    const handle = slot(container, "splitter-handle");
    const grip = slot(container, "splitter-handle-grip");

    const resting = getComputedStyle(grip).backgroundColor;

    handle.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
    await nextTick();
    await settled(grip);

    expect(getComputedStyle(grip).backgroundColor).not.toBe(resting);
    unmount();
  });

  /*
   * A grab area many times the width of the line is one a pointer crosses on its way somewhere else,
   * so the flare waits it out. Asserted on the delay itself rather than by sampling a colour
   * part-way through one: that would be asserting the clock rather than the stylesheet.
   */
  it("waits out a pointer passing through before it highlights, but never a drag", async () => {
    await parkPointer();

    const { container, unmount } = await render({ showGrip: true });
    const handle = slot(container, "splitter-handle");
    const grip = slot(container, "splitter-handle-grip");
    const delays = () => [
      Number.parseFloat(getComputedStyle(handle, "::after").transitionDelay),
      Number.parseFloat(getComputedStyle(grip).transitionDelay),
    ];

    expect(delays()).toEqual([0, 0]);

    handle.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
    await nextTick();

    for (const delay of delays()) expect(delay).toBeGreaterThan(0);

    /* And the drag rule has to win from here, because a drag starts from a hover. */
    const from = await startDrag(handle);

    await moveBy(from, 20);

    expect(handle.dataset["dragging"]).toBe("true");
    expect(delays()).toEqual([0, 0]);

    await endDrag();
    unmount();
  });

  /* Positioned rather than laid out, which is what lets it straddle a gutter narrower than it is. */
  it("costs the panels nothing to show a grip", async () => {
    const plain = await render();
    const before = shares(plain.container);

    plain.unmount();

    const gripped = await render({ showGrip: true });

    expect(shares(gripped.container)).toEqual(before);
    gripped.unmount();
  });

  /*
   * Why the gutter is a hairline with no dead space either side. A panel clips its own contents, so
   * an inner group's divider cannot reach back across a gap to meet the outer one — the only way the
   * two lines meet is for there to be no gap in the first place.
   *
   * Measured off the lines rather than the handles: the handle boxes are adjacent at any gutter
   * width, which is exactly the assertion that would pass while the gap was still there.
   */
  it("meets an outer divider with no gap when groups are nested", async () => {
    const { container, unmount } = renderVapor(NestedFixture, {
      props: { class: "h-64 w-[40rem]" },
    });

    await nextTick();
    await settled(container);

    const [outer, inner] = slots(container, "splitter-handle");
    const gutter = outer!.getBoundingClientRect();
    const width = Number.parseFloat(getComputedStyle(outer!, "::after").width);

    /* The outer line is centred in its gutter; the inner one spans its own handle end to end. */
    const outerLineEnd = gutter.left + (gutter.width + width) / 2;

    expect(inner!.getBoundingClientRect().left).toBeCloseTo(outerLineEnd, 0);
    unmount();
  });

  /*
   * The reason a drag writes each panel back in the unit it declared: a pixel sidebar is a pixel
   * sidebar at every container size, and the fractions beside it absorb the difference. This also
   * covers the `ResizeObserver` wiring, which no jsdom test can reach — the shared stub there
   * never calls back.
   */
  it("holds a pixel panel across a container resize while the fractions re-divide", async () => {
    await parkPointer();

    const { container, unmount } = await render({
      panels: [{ defaultSize: "240px", id: "a" }, { id: "b" }],
    });
    const root = slot(container, "splitter");
    const widths = () =>
      slots(container, "splitter-panel").map((panel) =>
        Math.round(panel.getBoundingClientRect().width),
      );

    const wide = widths();

    expect(wide[0]).toBe(240);

    root.style.width = "24rem";
    await waitUntil("the splitter re-measures its container", () => widths()[1] !== wide[1]);

    const narrow = widths();

    expect(narrow[0]).toBe(240);
    expect(narrow[1]).toBeLessThan(wide[1]!);
    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = await render();

    await expectNoA11yViolations(container);
    unmount();
  });

  it("has no accessibility violations with a grip", async () => {
    const { container, unmount } = await render({ showGrip: true });

    await expectNoA11yViolations(container);
    unmount();
  });

  it("has no accessibility violations on a vertical group", async () => {
    const { container, unmount } = await render({ orientation: "vertical" });

    await expectNoA11yViolations(container);
    unmount();
  });

  it("has no accessibility violations when groups are nested", async () => {
    const { container, unmount } = renderVapor(NestedFixture, {});

    await nextTick();
    await settled(container);

    await expectNoA11yViolations(container);
    unmount();
  });
});
