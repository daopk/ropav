import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import SliderFixture from "./fixtures.vue";

const renderSlider = (props: Record<string, unknown> = {}) => renderVapor(SliderFixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`));

/** Drag from the middle of an element by a number of pixels along the main axis. */
const drag = async (element: HTMLElement, deltaX: number, deltaY = 0) => {
  const box = element.getBoundingClientRect();
  const startX = box.left + box.width / 2;
  const startY = box.top + box.height / 2;
  const options = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" };

  element.dispatchEvent(
    new PointerEvent("pointerdown", { ...options, clientX: startX, clientY: startY }),
  );
  await nextTick();

  window.dispatchEvent(
    new PointerEvent("pointermove", {
      ...options,
      clientX: startX + deltaX,
      clientY: startY + deltaY,
    }),
  );
  await nextTick();

  window.dispatchEvent(new PointerEvent("pointerup", options));
  await nextTick();
};

/**
 * The parts of Slider only a real browser can show: the track has to be laid out before a
 * position on it means anything, and the fill and the thumb are measured against it.
 */
describe("Slider (browser)", () => {
  it("moves the thumb along the track under the pointer", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 0, step: 1 });

    await nextTick();

    const track = slot(container, "slider-track");
    const thumb = slot(container, "slider-thumb");
    const input = container.querySelector("input")!;
    // The thumb travels between the spacers at either end, not across the whole box.
    const travel = track.clientWidth;
    const centre = () => {
      const box = thumb.getBoundingClientRect();

      return box.left + box.width / 2;
    };
    const before = centre();

    await drag(thumb, travel / 2);

    // Half the travel from a thumb that started at the minimum is half the range, and the
    // thumb moved exactly as far as the pointer did.
    expect(input.value).toBe("50");
    expect(centre() - before).toBeCloseTo(travel / 2, 0);

    unmount();
  });

  it("lands the thumb under the pointer wherever the track is pressed", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 0, step: 1 });

    await nextTick();

    const track = slot(container, "slider-track");
    const thumb = slot(container, "slider-thumb");
    const box = track.getBoundingClientRect();
    // A quarter of the way along the travel, past the spacer at the start.
    const x = box.left + track.clientLeft + track.clientWidth / 4;

    track.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: box.top + box.height / 2,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    await nextTick();
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await nextTick();

    const landed = thumb.getBoundingClientRect();

    expect(container.querySelector("input")!.value).toBe("25");
    expect(landed.left + landed.width / 2).toBeCloseTo(x, 0);

    unmount();
  });

  it("jumps the nearest thumb to a press on the track", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 0, step: 10 });

    await nextTick();

    const track = slot(container, "slider-track");
    const box = track.getBoundingClientRect();

    track.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    await nextTick();

    expect(container.querySelector("input")!.value).toBe("50");
    expect(slot(container, "slider-thumb").getAttribute("data-dragging")).toBe("true");

    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await nextTick();

    expect(slot(container, "slider-thumb").hasAttribute("data-dragging")).toBe(false);

    unmount();
  });

  it("picks the thumb closest to the press in a range", async () => {
    const { container, unmount } = renderSlider({
      defaultValue: [200, 800],
      maxValue: 1000,
      step: 100,
    });

    await nextTick();

    const track = slot(container, "slider-track");
    const box = track.getBoundingClientRect();
    const [low, high] = slots(container, "slider-thumb");

    // A third along the track is nearer the low thumb.
    track.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: box.left + box.width / 3,
        clientY: box.top + box.height / 2,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    await nextTick();

    expect(low!.getAttribute("data-dragging")).toBe("true");
    expect(high!.hasAttribute("data-dragging")).toBe(false);
    expect(high!.querySelector("input")!.value).toBe("800");

    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));

    unmount();
  });

  it("grows the fill with the value and colours the end of the track it reaches", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 0, step: 100 });

    await nextTick();

    const track = slot(container, "slider-track");
    const fill = slot(container, "slider-fill");
    const startColourWhenEmpty = getComputedStyle(track).borderInlineStartColor;

    expect(fill.getBoundingClientRect().width).toBe(0);

    await drag(slot(container, "slider-thumb"), track.clientWidth);

    expect(container.querySelector("input")!.value).toBe("100");
    expect(fill.getBoundingClientRect().width).toBeGreaterThan(0);
    // Both ends of the track are filled once the thumb is parked on the maximum, and the
    // stylesheet paints them with borders rather than with the fill.
    expect(track.getAttribute("data-fill-start")).toBe("true");
    expect(track.getAttribute("data-fill-end")).toBe("true");
    expect(getComputedStyle(track).borderInlineStartColor).not.toBe(startColourWhenEmpty);
    expect(getComputedStyle(track).borderInlineEndColor).toBe(
      getComputedStyle(track).borderInlineStartColor,
    );

    unmount();
  });

  it("drags upwards on a vertical slider", async () => {
    const { container, unmount } = renderSlider({
      defaultValue: 50,
      orientation: "vertical",
      step: 1,
    });

    await nextTick();

    const thumb = slot(container, "slider-thumb");
    const input = container.querySelector("input")!;

    await drag(thumb, 0, -40);

    // Upwards on the screen is a higher value.
    expect(Number(input.value)).toBeGreaterThan(50);

    unmount();
  });

  it("shrinks the thumb while it is being dragged", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 50 });

    await nextTick();

    const thumb = slot(container, "slider-thumb");
    // Tailwind v4 writes `scale-*` to the `scale` property rather than to `transform`.
    const scaleWhenIdle = getComputedStyle(thumb, "::after").scale;
    const box = thumb.getBoundingClientRect();

    thumb.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
        pointerId: 1,
        pointerType: "mouse",
      }),
    );
    await nextTick();

    expect(thumb.getAttribute("data-dragging")).toBe("true");
    expect(getComputedStyle(thumb, "::after").scale).not.toBe(scaleWhenIdle);
    expect(getComputedStyle(thumb).cursor).toBe("grabbing");

    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));

    unmount();
  });

  it("paints a focus ring on the thumb when it is reached by keyboard", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 50 });

    await nextTick();

    const thumb = slot(container, "slider-thumb");
    const shadowWhenIdle = getComputedStyle(thumb).boxShadow;

    await userEvent.keyboard("{Tab}");
    await nextTick();

    expect(thumb.getAttribute("data-focus-visible")).toBe("true");

    await settled(thumb);

    // `status-focused` draws the ring with a box shadow, not with an outline.
    expect(getComputedStyle(thumb).boxShadow).not.toBe(shadowWhenIdle);

    unmount();
  });

  it("steps with the keyboard once the thumb holds focus", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 50, step: 10 });

    await nextTick();
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{ArrowRight}");
    await nextTick();

    expect(container.querySelector("input")!.value).toBe("60");
    expect(slot(container, "slider-output").textContent).toContain("60");

    unmount();
  });

  it("hands focus to the first thumb when the label is clicked", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 30 });

    await nextTick();
    await userEvent.click(slot(container, "label"));
    await nextTick();

    expect(document.activeElement).toBe(container.querySelector("input"));
    // Clicking the label is a pointer interaction, but the ring has to show where focus went.
    expect(slot(container, "slider-thumb").getAttribute("data-focus-visible")).toBe("true");

    unmount();
  });

  describe("layout", () => {
    it("drops the label row when there is neither a label nor an output", async () => {
      const { container, unmount } = renderSlider({
        ariaLabel: "Volume",
        defaultValue: 50,
        withoutLabel: true,
        withoutOutput: true,
      });

      await nextTick();

      const root = slot(container, "slider");
      const track = slot(container, "slider-track");

      // An empty first row and the gap under it would sit the track below the root's top edge,
      // and off the centre of a row it shares with a button.
      expect(track.getBoundingClientRect().top).toBe(root.getBoundingClientRect().top);
      expect(root.getBoundingClientRect().height).toBe(track.getBoundingClientRect().height);

      unmount();
    });

    it.each([
      ["a label", { withoutOutput: true }],
      ["an output", { ariaLabel: "Volume", withoutLabel: true }],
    ])("keeps a row above the track for %s alone", async (_name, props) => {
      const { container, unmount } = renderSlider({ defaultValue: 50, ...props });

      await nextTick();

      const root = slot(container, "slider");
      const track = slot(container, "slider-track");

      expect(track.getBoundingClientRect().top).toBeGreaterThan(root.getBoundingClientRect().top);

      unmount();
    });

    it("draws a bar thinner than the track and still takes a press beside it", async () => {
      const { container, unmount } = renderSlider({
        ariaLabel: "Volume",
        defaultValue: 0,
        step: 10,
        style: "--slider-track-thickness: 16px; --slider-rail-thickness: 4px",
        withoutLabel: true,
        withoutOutput: true,
      });

      await nextTick();

      const root = slot(container, "slider");
      const track = slot(container, "slider-track");
      const box = track.getBoundingClientRect();

      // The element is the bar; the track's thickness is the room it takes in the row.
      expect(box.height).toBe(4);
      expect(root.getBoundingClientRect().height).toBe(16);
      // The fill and the thumb's frame follow the bar rather than the track.
      expect(slot(container, "slider-fill").getBoundingClientRect().height).toBe(4);

      // 5px above the bar is off the element, but inside the band a press lands on.
      const x = box.left + box.width / 2;
      const y = box.top - 5;

      expect(document.elementFromPoint(x, y)).toBe(track);

      track.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
      await nextTick();
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));

      expect(container.querySelector("input")!.value).toBe("50");

      unmount();
    });

    it("lets the thumb hang past the ends of the track with no inset", async () => {
      const { container, unmount } = renderSlider({
        ariaLabel: "Volume",
        defaultValue: 0,
        style: "--slider-thumb-inset: 0px",
        withoutLabel: true,
      });

      await nextTick();

      const track = slot(container, "slider-track").getBoundingClientRect();
      const thumb = slot(container, "slider-thumb").getBoundingClientRect();

      // Centred on the start of the track, rather than half a knob inside it.
      expect(thumb.left + thumb.width / 2).toBeCloseTo(track.left, 0);

      unmount();
    });

    it("keeps the focus ring outside the knob when the knob is thicker than the bar", async () => {
      const { container, unmount } = renderSlider({
        ariaLabel: "Volume",
        defaultValue: 50,
        style:
          "--slider-track-thickness: 16px; --slider-rail-thickness: 4px; --slider-thumb-length: 12px; --slider-thumb-thickness: 12px",
        withoutLabel: true,
      });

      await nextTick();

      const thumb = slot(container, "slider-thumb");
      const shadowWhenIdle = getComputedStyle(thumb).boxShadow;

      // The ring is a shadow on the thumb element, which the knob would cover were the element
      // only as thick as the bar.
      expect(thumb.getBoundingClientRect().width).toBe(12);
      expect(thumb.getBoundingClientRect().height).toBe(12);

      await userEvent.keyboard("{Tab}");
      await nextTick();
      await settled(thumb);

      expect(thumb.getAttribute("data-focus-visible")).toBe("true");
      expect(getComputedStyle(thumb).boxShadow).not.toBe(shadowWhenIdle);

      unmount();
    });

    it("keeps the knob inside the track at the minimum by default", async () => {
      const { container, unmount } = renderSlider({ defaultValue: 0 });

      await nextTick();

      const track = slot(container, "slider-track").getBoundingClientRect();
      const knob = getComputedStyle(slot(container, "slider-thumb"), "::after");
      const thumb = slot(container, "slider-thumb").getBoundingClientRect();
      const knobStart = thumb.left + thumb.width / 2 - Number.parseFloat(knob.width) / 2;

      expect(knobStart).toBeCloseTo(track.left, 0);

      unmount();
    });
  });

  /**
   * Every other pointer test here synthesises its own events, which cannot see how a listener is
   * attached: a real press has to move the pointer onto the element first, and that hover
   * re-renders it before the press even lands. A handler spread onto a vapor element is
   * re-attached by each of those renders, so only a real pointer exercises the path a user takes.
   */
  describe("real pointer input", () => {
    it("drags the nearest thumb from a press on the track itself", async () => {
      const { container, unmount } = renderSlider({ defaultValue: 0, step: 1 });

      await nextTick();

      const track = slot(container, "slider-track");
      // Positions count from inside the track's border, which is where the thumb's travel
      // between the spacers starts.
      const travel = track.clientWidth;
      const middle = track.clientHeight / 2;

      await userEvent.dragAndDrop(track, track, {
        sourcePosition: { x: travel / 4, y: middle },
        targetPosition: { x: (travel * 3) / 4, y: middle },
      });
      await nextTick();

      // The press lands a quarter along and the drag carries the thumb another half, so it ends
      // under the pointer.
      expect(Math.abs(Number(container.querySelector("input")!.value) - 75)).toBeLessThanOrEqual(1);
      // The release closed the drag rather than leaving the thumb stuck to the pointer.
      expect(slot(container, "slider-thumb").hasAttribute("data-dragging")).toBe(false);

      unmount();
    });

    it("drags the thumb itself under a real pointer", async () => {
      const { container, unmount } = renderSlider({ defaultValue: 50, step: 1 });

      await nextTick();

      const track = slot(container, "slider-track");
      const thumb = slot(container, "slider-thumb");

      // As above, the target counts from inside the border, along the thumb's travel.
      await userEvent.dragAndDrop(thumb, track, {
        targetPosition: { x: (track.clientWidth * 3) / 4, y: track.clientHeight / 2 },
      });
      await nextTick();

      expect(Math.abs(Number(container.querySelector("input")!.value) - 75)).toBeLessThanOrEqual(1);
      expect(thumb.hasAttribute("data-dragging")).toBe(false);

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderSlider({ defaultValue: 30 });

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations as a range", async () => {
    const { container, unmount } = renderSlider({
      defaultValue: [100, 500],
      maxValue: 1000,
    });

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });
});
