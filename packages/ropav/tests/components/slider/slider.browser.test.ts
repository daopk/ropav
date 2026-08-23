import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

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

    // A drag is measured against the track's full width, borders included.
    await drag(thumb, track.getBoundingClientRect().width / 2);

    // Half the track from a thumb that started at the minimum is half the range.
    expect(Number(input.value)).toBeGreaterThan(48);
    expect(Number(input.value)).toBeLessThan(52);
    expect(thumb.style.left).not.toBe("0%");

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
      const box = track.getBoundingClientRect();
      const middle = box.height / 2;

      await userEvent.dragAndDrop(track, track, {
        sourcePosition: { x: box.width / 4, y: middle },
        targetPosition: { x: (box.width * 3) / 4, y: middle },
      });
      await nextTick();

      // The press lands a quarter along and the drag carries the thumb another half.
      expect(Number(container.querySelector("input")!.value)).toBeGreaterThan(70);
      expect(Number(container.querySelector("input")!.value)).toBeLessThan(80);
      // The release closed the drag rather than leaving the thumb stuck to the pointer.
      expect(slot(container, "slider-thumb").hasAttribute("data-dragging")).toBe(false);

      unmount();
    });

    it("drags the thumb itself under a real pointer", async () => {
      const { container, unmount } = renderSlider({ defaultValue: 50, step: 1 });

      await nextTick();

      const track = slot(container, "slider-track");
      const thumb = slot(container, "slider-thumb");
      const box = track.getBoundingClientRect();

      await userEvent.dragAndDrop(thumb, track, {
        targetPosition: { x: (box.width * 3) / 4, y: box.height / 2 },
      });
      await nextTick();

      expect(Number(container.querySelector("input")!.value)).toBeGreaterThan(70);
      expect(Number(container.querySelector("input")!.value)).toBeLessThan(80);
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
