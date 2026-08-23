import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const renderSlider = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {
    props: { channel: "hue", defaultValue: "hsl(0, 100%, 50%)", ...props },
  });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

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
 * The parts of ColorSlider only a real browser can show: the track has to be laid out before a
 * position on it means anything, the gradient is only resolved by an engine, and the two end caps
 * are pseudo-elements that read their colour from a custom property — none of which exists in
 * jsdom.
 */
describe("ColorSlider (browser)", () => {
  describe("the gradient", () => {
    it("resolves the generated gradient and the checkerboard under it", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();

      const { backgroundImage } = getComputedStyle(slot(container, "color-slider-track"));

      // Seven stops around the wheel, generated rather than styled.
      expect(backgroundImage).toContain("linear-gradient(to right, rgb(255, 0, 0)");
      expect(backgroundImage).toContain("rgb(0, 255, 255)");
      // The checkerboard the gradient is laid over, so alpha reads as translucent.
      expect(backgroundImage).toContain("repeating-conic-gradient");

      unmount();
    });

    it("paints the end caps from the custom properties the track hands them", async () => {
      const { container, unmount } = renderSlider({ channel: "saturation" });

      await nextTick();

      const track = slot(container, "color-slider-track");

      // The caps fill the half-thumb inset at each end of the track. They are pseudo-elements, so
      // the only way to colour them is the custom property — this is that contract, resolved.
      expect(getComputedStyle(track, "::before").backgroundImage).toContain(
        "linear-gradient(rgb(128, 128, 128))",
      );
      expect(getComputedStyle(track, "::after").backgroundColor).toBe("rgb(255, 0, 0)");

      unmount();
    });

    it("turns the gradient upright on a vertical slider", async () => {
      const { container, unmount } = renderSlider({ orientation: "vertical" });

      container.style.height = "300px";
      await nextTick();

      expect(getComputedStyle(slot(container, "color-slider-track")).backgroundImage).toContain(
        "linear-gradient(to top, rgb(255, 0, 0)",
      );

      unmount();
    });
  });

  describe("the layout the stylesheet infers from the parts", () => {
    it("collapses to the track alone when neither label nor output is rendered", async () => {
      const withBoth = renderSlider();

      await nextTick();
      expect(
        getComputedStyle(slot(withBoth.container, "color-slider")).gridTemplateAreas,
      ).toContain("label output");
      withBoth.unmount();

      const bare = renderSlider({ withoutLabel: true, withoutOutput: true });

      await nextTick();
      // `:has()` on the parts' own `data-slot`, which is why those attributes are a contract.
      expect(getComputedStyle(slot(bare.container, "color-slider")).gridTemplateAreas).toBe(
        '"track"',
      );
      bare.unmount();
    });
  });

  describe("pointer", () => {
    it("moves the thumb along the track under the pointer", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();

      const track = slot(container, "color-slider-track");
      const thumb = slot(container, "color-slider-thumb");

      await drag(thumb, track.getBoundingClientRect().width / 2);

      // Half the track from a thumb parked at 0° is halfway round the wheel.
      expect(Number(inputIn(container).value)).toBeGreaterThan(170);
      expect(Number(inputIn(container).value)).toBeLessThan(190);
      expect(thumb.style.left).not.toBe("0%");

      unmount();
    });

    it("repaints the thumb with the colour it lands on", async () => {
      const { container, unmount } = renderSlider({ channel: "saturation" });

      await nextTick();

      const track = slot(container, "color-slider-track");
      const thumb = slot(container, "color-slider-thumb");

      expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(255, 0, 0)");

      await drag(thumb, -track.getBoundingClientRect().width);

      expect(inputIn(container).value).toBe("0");
      expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(128, 128, 128)");

      unmount();
    });

    it("shows the drag on the cursor", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();

      const thumb = slot(container, "color-slider-thumb");
      const box = thumb.getBoundingClientRect();

      expect(getComputedStyle(thumb).cursor).toBe("grab");

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
      expect(getComputedStyle(thumb).cursor).toBe("grabbing");

      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
      await nextTick();

      expect(thumb.hasAttribute("data-dragging")).toBe(false);

      unmount();
    });

    it("drags upwards on a vertical slider", async () => {
      const { container, unmount } = renderSlider({
        defaultValue: "hsl(180, 100%, 50%)",
        orientation: "vertical",
      });

      container.style.height = "300px";
      await nextTick();

      await drag(slot(container, "color-slider-thumb"), 0, -40);

      // Upwards on the screen is a higher value.
      expect(Number(inputIn(container).value)).toBeGreaterThan(180);

      unmount();
    });

    /**
     * Every other pointer test here synthesises its own events, which cannot see how a listener is
     * attached: a real press has to move the pointer onto the element first, and that hover
     * re-renders it before the press even lands. A handler spread onto a vapor element is
     * re-attached by each of those renders, so only a real pointer exercises the path a user takes.
     */
    it("jumps the thumb to a real press on the track and keeps dragging it", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();

      const track = slot(container, "color-slider-track");
      const box = track.getBoundingClientRect();
      const middle = box.height / 2;

      await userEvent.dragAndDrop(track, track, {
        sourcePosition: { x: box.width / 4, y: middle },
        targetPosition: { x: (box.width * 3) / 4, y: middle },
      });
      await nextTick();

      // The press lands a quarter round the wheel and the drag carries the thumb another half.
      expect(Number(inputIn(container).value)).toBeGreaterThan(250);
      expect(Number(inputIn(container).value)).toBeLessThan(290);
      expect(slot(container, "color-slider-thumb").hasAttribute("data-dragging")).toBe(false);

      unmount();
    });
  });

  describe("keyboard", () => {
    it("paints a focus ring on the thumb when it is reached by keyboard", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();

      const thumb = slot(container, "color-slider-thumb");
      const shadowWhenIdle = getComputedStyle(thumb).boxShadow;

      await userEvent.keyboard("{Tab}");
      await nextTick();

      expect(thumb.getAttribute("data-focus-visible")).toBe("true");

      await settled(thumb);

      // `status-focused` draws the ring with a box shadow, not with an outline.
      expect(getComputedStyle(thumb).boxShadow).not.toBe(shadowWhenIdle);

      unmount();
    });

    it("reaches exactly one focusable control", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();
      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(inputIn(container));

      await userEvent.keyboard("{Tab}");

      // Nothing else in the slider takes the caret: the thumb is a div and the track is a group.
      expect(document.activeElement).not.toBe(inputIn(container));

      unmount();
    });

    it("pages by the channel's own step once the thumb holds focus", async () => {
      const { container, unmount } = renderSlider();

      await nextTick();
      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{PageUp}");
      await nextTick();

      expect(inputIn(container).value).toBe("15");
      expect(slot(container, "color-slider-output").textContent).toContain("15°");

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderSlider();

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations without a visible label", async () => {
    const { container, unmount } = renderSlider({ withoutLabel: true, withoutOutput: true });

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });
});
