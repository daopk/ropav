import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const renderArea = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>("input"));

/** Press at a point given as fractions of an element, then move by pixels, then release. */
const drag = async (
  element: HTMLElement,
  from: { x: number; y: number },
  deltaX = 0,
  deltaY = 0,
) => {
  const box = element.getBoundingClientRect();
  const startX = box.left + box.width * from.x;
  const startY = box.top + box.height * from.y;
  const options = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" };

  element.dispatchEvent(
    new PointerEvent("pointerdown", { ...options, clientX: startX, clientY: startY }),
  );
  await nextTick();

  if (deltaX !== 0 || deltaY !== 0) {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        ...options,
        clientX: startX + deltaX,
        clientY: startY + deltaY,
      }),
    );
    await nextTick();
  }

  window.dispatchEvent(new PointerEvent("pointerup", options));
  await nextTick();
};

/**
 * The parts of ColorArea only a real browser can show. jsdom lays nothing out, so the area's rect
 * is all zeroes and every press fails the composable's `0 <= x <= 1` guard — a silent no-op. Every
 * pointer path, the resolved gradient, and the square aspect ratio therefore live here.
 */
describe("ColorArea (browser)", () => {
  describe("the gradient", () => {
    it("resolves three blended layers in rgb", async () => {
      const { container, unmount } = renderArea();

      await nextTick();

      const area = slot(container, "color-area");
      const style = getComputedStyle(area);

      expect(style.backgroundImage).toContain("linear-gradient(to right, rgb(0, 0, 0)");
      expect(style.backgroundImage).toContain("linear-gradient(to top, rgb(0, 0, 0)");
      // Without this the top layer covers the others and the square still looks plausible.
      // Chromium reports one blend mode per background layer, so three layers give three copies.
      expect(style.backgroundBlendMode.split(", ")).toEqual(["screen", "screen", "screen"]);

      unmount();
    });

    it("resolves the hue wheel across an hsl area", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });

      await nextTick();

      const style = getComputedStyle(slot(container, "color-area"));

      expect(style.backgroundImage).toContain("rgb(0, 255, 255)");
      // Two layers here, and neither is blended — only the rgb branch needs `screen`.
      expect(style.backgroundBlendMode.split(", ")).toEqual(["normal", "normal"]);

      unmount();
    });

    it("keeps the square the stylesheet asks for", async () => {
      const { container, unmount } = renderArea();

      await nextTick();

      const box = slot(container, "color-area").getBoundingClientRect();

      expect(box.width).toBeGreaterThan(0);
      expect(Math.round(box.height)).toBe(Math.round(box.width));

      unmount();
    });

    it("overlays the dot pattern only when asked", async () => {
      const plain = renderArea();

      await nextTick();
      expect(getComputedStyle(slot(plain.container, "color-area"), "::after").backgroundImage).toBe(
        "none",
      );
      plain.unmount();

      const dotted = renderArea({ showDots: true });

      await nextTick();
      expect(
        getComputedStyle(slot(dotted.container, "color-area"), "::after").backgroundImage,
      ).toContain("radial-gradient");
      dotted.unmount();
    });
  });

  describe("pointer", () => {
    it("jumps the colour to a press on the area itself", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(0, 0%, 50%)" });

      await nextTick();

      // A press halfway across and a quarter down: hue 180 of 360, saturation 75 of 100 — y is
      // measured from the bottom.
      await drag(slot(container, "color-area"), { x: 0.5, y: 0.25 });

      expect(Number(inputs(container)[0]!.value)).toBeGreaterThan(170);
      expect(Number(inputs(container)[0]!.value)).toBeLessThan(190);
      expect(Number(inputs(container)[1]!.value)).toBeGreaterThan(70);
      expect(Number(inputs(container)[1]!.value)).toBeLessThan(80);

      unmount();
    });

    it("keeps dragging after a press that landed on the area, not on the thumb", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(0, 0%, 50%)" });

      await nextTick();

      const area = slot(container, "color-area");
      const box = area.getBoundingClientRect();

      // This is what the second, gated move handler exists for: the press lands a quarter along
      // and the drag carries the colour another quarter without ever touching the thumb.
      await drag(area, { x: 0.25, y: 0.5 }, box.width / 4, 0);

      expect(Number(inputs(container)[0]!.value)).toBeGreaterThan(170);
      expect(Number(inputs(container)[0]!.value)).toBeLessThan(190);
      expect(slot(container, "color-area-thumb").hasAttribute("data-dragging")).toBe(false);

      unmount();
    });

    it("drags the thumb on both axes at once", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(180, 50%, 50%)" });

      await nextTick();

      const box = slot(container, "color-area").getBoundingClientRect();

      await drag(
        slot(container, "color-area-thumb"),
        { x: 0.5, y: 0.5 },
        box.width / 4,
        -box.height / 4,
      );

      // Right raises the hue; up raises the saturation, because the y axis runs upwards.
      expect(Number(inputs(container)[0]!.value)).toBeGreaterThan(180);
      expect(Number(inputs(container)[1]!.value)).toBeGreaterThan(50);

      unmount();
    });

    it("grows the thumb while it is being dragged", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(180, 50%, 50%)" });

      await nextTick();

      const thumb = slot(container, "color-area-thumb");
      const idle = thumb.getBoundingClientRect().width;
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
      // The size is transitioned over 150ms, so the measurement lands at the start of it unless
      // the transition is settled first — and waiting on a clock is unreliable when the browser
      // pane is hidden, because the document timeline stalls.
      for (const animation of thumb.getAnimations()) animation.finish();
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(idle);

      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
      await nextTick();

      expect(thumb.hasAttribute("data-dragging")).toBe(false);

      unmount();
    });

    it("does nothing at all while disabled", async () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(0, 0%, 50%)",
        isDisabled: true,
      });

      await nextTick();
      await drag(slot(container, "color-area"), { x: 0.5, y: 0.5 });

      expect(inputs(container)[0]!.value).toBe("0");
      expect(inputs(container)[1]!.value).toBe("0");

      unmount();
    });

    /**
     * Every other pointer test here synthesises its own events, which cannot see how a listener is
     * attached: a real press has to move the pointer onto the element first, and that hover
     * re-renders it before the press even lands. A handler spread onto a vapor element is
     * re-attached by each of those renders, so only a real pointer exercises the path a user takes.
     */
    it("follows a real pointer across the area", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(0, 0%, 50%)" });

      await nextTick();

      const area = slot(container, "color-area");
      const box = area.getBoundingClientRect();

      await userEvent.dragAndDrop(area, area, {
        sourcePosition: { x: box.width / 4, y: box.height / 2 },
        targetPosition: { x: (box.width * 3) / 4, y: box.height / 2 },
      });
      await nextTick();

      expect(Number(inputs(container)[0]!.value)).toBeGreaterThan(240);
      expect(slot(container, "color-area-thumb").hasAttribute("data-dragging")).toBe(false);

      unmount();
    });
  });

  describe("keyboard", () => {
    it("paints a focus ring on the thumb when it is reached by keyboard", async () => {
      const { container, unmount } = renderArea();

      await nextTick();

      const thumb = slot(container, "color-area-thumb");
      const shadowWhenIdle = getComputedStyle(thumb).boxShadow;

      await userEvent.keyboard("{Tab}");
      await nextTick();

      expect(thumb.getAttribute("data-focus-visible")).toBe("true");

      await settled(thumb);

      // `status-focused` draws the ring with a box shadow, not with an outline.
      expect(getComputedStyle(thumb).boxShadow).not.toBe(shadowWhenIdle);

      unmount();
    });

    it("reaches exactly one of the two inputs", async () => {
      const { container, unmount } = renderArea();

      await nextTick();
      await userEvent.keyboard("{Tab}");

      // Two range inputs, one tab stop: the y input carries `tabindex="-1"` until it has focus.
      expect(document.activeElement).toBe(inputs(container)[0]);

      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).not.toBe(inputs(container)[1]);

      unmount();
    });

    it("moves the colour on both axes once the thumb holds focus", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 50%, 50%)" });

      await nextTick();
      await userEvent.keyboard("{Tab}");

      // The keydown lands on the x input and bubbles up to the thumb, which is where the handler
      // lives — the input's own `pointer-events: none` only stops the pointer, not the keyboard.
      expect(document.activeElement).toBe(inputs(container)[0]);

      await userEvent.keyboard("{PageUp}");
      await nextTick();

      expect(inputs(container)[1]!.value).toBe("60");

      await userEvent.keyboard("{End}");
      await nextTick();

      expect(inputs(container)[0]!.value).toBe("45");

      unmount();
    });
  });

  describe("reach", () => {
    it("gets the thumb into all four corners from the keyboard", async () => {
      // Saturation × lightness, so both axes run 0–100 and page by 10 — ten presses cover an axis.
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 50%, 50%)",
        xChannel: "saturation",
        yChannel: "lightness",
      });

      await nextTick();
      await userEvent.keyboard("{Tab}");

      const press = async (keyName: string, times: number) => {
        for (let i = 0; i < times; i++) await userEvent.keyboard(`{${keyName}}`);
        await nextTick();
      };
      const at = () => [inputs(container)[0]!.value, inputs(container)[1]!.value];

      await press("End", 10);
      await press("PageUp", 10);
      expect(at()).toEqual(["100", "100"]);

      await press("Home", 10);
      expect(at()).toEqual(["0", "100"]);

      await press("PageDown", 10);
      expect(at()).toEqual(["0", "0"]);

      await press("End", 10);
      expect(at()).toEqual(["100", "0"]);

      unmount();
    });

    it("gets the thumb into all four corners under a real pointer", async () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 50%, 50%)",
        xChannel: "saturation",
        yChannel: "lightness",
      });

      await nextTick();

      const area = slot(container, "color-area");
      const box = area.getBoundingClientRect();
      const corners = [
        { expected: ["0", "100"], x: 1, y: 1 },
        { expected: ["100", "100"], x: box.width - 1, y: 1 },
        { expected: ["100", "0"], x: box.width - 1, y: box.height - 1 },
        { expected: ["0", "0"], x: 1, y: box.height - 1 },
      ];

      for (const corner of corners) {
        // Each drop lands a pixel into a rounded corner, which a hit test resolves to the ancestor
        // rather than the area, so the drag never releases unless the check is skipped.
        await userEvent.dragAndDrop(area, area, {
          force: true,
          sourcePosition: { x: box.width / 2, y: box.height / 2 },
          targetPosition: { x: corner.x, y: corner.y },
        });
        await nextTick();

        expect([inputs(container)[0]!.value, inputs(container)[1]!.value]).toEqual(corner.expected);
      }

      unmount();
    });
  });

  describe("a form reset", () => {
    it("puts both channels back when the reset comes from a real click", async () => {
      /*
       * The reset a script performs and the reset a user performs are not the same event, and only
       * this one catches the difference: when the browser starts the reset it drains microtasks
       * *between* dispatching `reset` and restoring the controls, so a `nextTick` re-assert lands
       * too early and is overwritten. What holds is the `value` attribute the area keeps in step —
       * without it the browser puts a range input back to the midpoint of its range, which for a
       * hue is 180°.
       */
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 100%, 50%)",
        withForm: true,
      });

      await nextTick();

      const [x, y] = inputs(container) as [HTMLInputElement, HTMLInputElement];

      expect([x.value, y.value]).toEqual(["30", "100"]);

      // Focused rather than clicked: the input is visually hidden with `pointer-events: none`, so
      // the thumb over it takes every click.
      x.focus();
      await userEvent.keyboard("{ArrowRight}{ArrowDown}");
      await nextTick();

      expect([x.value, y.value]).toEqual(["31", "99"]);

      await userEvent.click(container.querySelector<HTMLElement>("[data-testid='reset']")!);
      await nextTick();
      await nextTick();

      expect([x.value, y.value]).toEqual(["30", "100"]);

      unmount();
    });
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderArea({ ariaLabel: "Pick a colour" });

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations with the dots overlay", async () => {
    const { container, unmount } = renderArea({ ariaLabel: "Pick a colour", showDots: true });

    await nextTick();
    await expectNoA11yViolations(container);

    unmount();
  });
});
