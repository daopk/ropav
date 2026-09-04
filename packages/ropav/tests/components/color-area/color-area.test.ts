import type { Color } from "@/utils/color-types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { ColorArea } from "@/components/color-area";
import { parseColor } from "@/utils/color";

import Fixture from "./fixtures.vue";

/**
 * A synthetic press is deliberately absent from this file. jsdom lays nothing out, so the area's
 * rect is all zeroes and `(clientX - 0) / 0` gives `Infinity` or `NaN` — which fails the composable's
 * `0 <= x <= 1` guard, making every press a silent no-op. A test that pressed here and asserted
 * "nothing happened" would be green for the wrong reason. Pointer coverage is in the browser suite.
 */
const renderArea = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>("input"));

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init }),
  );

  return nextTick();
};

describe("ColorArea", () => {
  describe("structure", () => {
    it("renders both parts with their data-slot and BEM class", () => {
      const { container, unmount } = renderArea();

      expect(slot(container, "color-area")).toHaveClass("color-area");
      expect(slot(container, "color-area-thumb")).toHaveClass("color-area__thumb");

      unmount();
    });

    it("adds the dots modifier only when asked", () => {
      const plain = renderArea();

      expect(slot(plain.container, "color-area")).not.toHaveClass("color-area--show-dots");
      plain.unmount();

      const dotted = renderArea({ showDots: true });

      expect(slot(dotted.container, "color-area")).toHaveClass("color-area--show-dots");
      dotted.unmount();
    });

    it("declares showDots as a Boolean prop, so a bare attribute means true", () => {
      // Passing `showDots: true` as a value works whatever the declared type is, so the test above
      // cannot see this. Written `<ColorArea show-dots>` in markup, the attribute arrives as `""`
      // unless the compiler knows the prop is Boolean — and `""` matches no variant, so the dots
      // silently never appear. Found by sweeping the stories, not by either suite.
      const props = (ColorArea as unknown as { props: Record<string, { type: unknown }> }).props;

      expect(props["showDots"]?.type).toBe(Boolean);
    });

    it("lets a caller's class through to tailwind-merge", () => {
      const { container, unmount } = renderArea({ class: "w-72" });

      expect(slot(container, "color-area")).toHaveClass("color-area", "w-72");

      unmount();
    });

    it("names the area a group and keeps the thumb out of the accessibility tree", () => {
      const { container, unmount } = renderArea();

      expect(slot(container, "color-area")).toHaveAttribute("role", "group");
      // The two inputs inside it are the controls; the thumb is only what a pointer grabs.
      expect(slot(container, "color-area-thumb")).toHaveAttribute("role", "presentation");

      unmount();
    });

    it("marks the disabled state on both parts", () => {
      const { container, unmount } = renderArea({ isDisabled: true });

      expect(slot(container, "color-area")).toHaveAttribute("data-disabled", "true");
      expect(slot(container, "color-area-thumb")).toHaveAttribute("data-disabled", "true");
      expect(inputs(container)[0]).toBeDisabled();
      expect(inputs(container)[1]).toBeDisabled();

      unmount();
    });

    it("leaves the disabled attributes off while enabled", () => {
      const { container, unmount } = renderArea();

      expect(slot(container, "color-area")).not.toHaveAttribute("data-disabled");
      expect(slot(container, "color-area-thumb")).not.toHaveAttribute("data-disabled");

      unmount();
    });
  });

  describe("painting", () => {
    it("writes the gradient as a property and as a custom property", () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });
      const area = slot(container, "color-area");

      // Both, and neither is redundant: `.color-area` composes the variable into its own
      // `background`, while the inline property is what actually wins the cascade.
      expect(area.style.background).toContain("linear-gradient(to top,");
      expect(area.style.getPropertyValue("--color-area-background")).toContain(
        "linear-gradient(to top, hsla(0, 0%, 50%, 1), transparent)",
      );

      unmount();
    });

    it("keeps the blend mode the rgb gradient needs", () => {
      const { container, unmount } = renderArea();

      // Writing only the custom property would drop this with it, and the three rgb layers would
      // stop combining — while still looking like a plausible colour square.
      expect(slot(container, "color-area").style.backgroundBlendMode).toBe("screen");

      unmount();
    });

    it("writes the thumb colour as a property and as a custom property", () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });
      const thumb = slot(container, "color-area-thumb");

      // jsdom normalises a colour when reading `backgroundColor` back, so the exact string can
      // only be asserted on the custom property — those are stored verbatim.
      expect(thumb.style.backgroundColor).toBe("rgb(255, 128, 0)");
      expect(thumb.style.getPropertyValue("--color-area-thumb-color")).toBe(
        "hsla(30, 100%, 50%, 1)",
      );

      unmount();
    });

    it("keeps the colour on a disabled thumb, unlike a colour slider's", () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(200, 100%, 50%)",
        isDisabled: true,
      });

      expect(slot(container, "color-area-thumb").style.backgroundColor).toBe("rgb(0, 170, 255)");

      unmount();
    });

    it("positions the thumb on both axes at once", () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });
      const thumb = slot(container, "color-area-thumb");

      expect(thumb.style.left).toBe("8.333333333333332%");
      expect(thumb.style.top).toBe("0%");
      expect(thumb.style.position).toBe("absolute");

      unmount();
    });
  });

  describe("the two hidden inputs", () => {
    it("renders one per axis, each with its own channel range", () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });
      const [x, y] = inputs(container);

      expect(x).toHaveAttribute("aria-orientation", "horizontal");
      expect(x).toHaveAttribute("max", "360");
      expect(x!.value).toBe("30");

      expect(y).toHaveAttribute("aria-orientation", "vertical");
      expect(y).toHaveAttribute("max", "100");
      expect(y!.value).toBe("100");

      unmount();
    });

    it("exposes one two-dimensional control rather than two sliders", () => {
      const { container, unmount } = renderArea();
      const [x, y] = inputs(container);

      expect(x).toHaveAttribute("aria-roledescription", "2D slider");
      expect(x).not.toHaveAttribute("aria-hidden");
      expect(x).not.toHaveAttribute("tabindex");
      // Hidden and out of the tab order, so a screen reader lists one control.
      expect(y).toHaveAttribute("aria-hidden", "true");
      expect(y).toHaveAttribute("tabindex", "-1");

      unmount();
    });

    it("reveals both once the keyboard has moved the value", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });

      await key(slot(container, "color-area-thumb"), "ArrowRight");

      expect(inputs(container)[0]).not.toHaveAttribute("aria-hidden");
      expect(inputs(container)[1]).not.toHaveAttribute("aria-hidden");

      unmount();
    });

    it("submits each channel under its own name", () => {
      const { container, unmount } = renderArea({
        form: "the-form",
        xName: "hue",
        yName: "saturation",
      });
      const [x, y] = inputs(container);

      expect(x).toHaveAttribute("name", "hue");
      expect(x).toHaveAttribute("form", "the-form");
      expect(y).toHaveAttribute("name", "saturation");

      unmount();
    });

    it("stays in the accessibility tree while out of sight", () => {
      const { container, unmount } = renderArea();

      // Filling the area, with the pointer passing through, so a press reaches the area itself.
      expect(inputs(container)[0]!.style.width).toBe("100%");
      expect(inputs(container)[0]!.style.pointerEvents).toBe("none");

      unmount();
    });

    it("names the whole control on both inputs, not each channel", () => {
      const { container, unmount } = renderArea({ ariaLabel: "Pick a colour" });

      expect(slot(container, "color-area")).toHaveAttribute(
        "aria-label",
        "Pick a colour, Color picker",
      );
      for (const input of inputs(container)) {
        expect(input).toHaveAttribute("aria-label", "Pick a colour, Color picker");
      }

      unmount();
    });

    it("reads every channel, then narrows to the one that moved", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 100%, 50%)" });

      expect(inputs(container)[0]).toHaveAttribute(
        "aria-valuetext",
        "Hue: 30°, Saturation: 100%, Lightness: 50%, vibrant orange",
      );

      await key(slot(container, "color-area-thumb"), "ArrowRight");

      expect(inputs(container)[0]).toHaveAttribute("aria-valuetext", "Hue: 31°, vibrant orange");

      unmount();
    });
  });

  describe("keyboard", () => {
    it("steps both axes with the arrows", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = slot(container, "color-area-thumb");

      await key(thumb, "ArrowRight");
      expect(inputs(container)[0]!.value).toBe("31");

      await key(thumb, "ArrowUp");
      expect(inputs(container)[1]!.value).toBe("51");

      unmount();
    });

    it("pages along x with Home and End, not to the ends of the axis", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = slot(container, "color-area-thumb");

      // A slider would jump to 0 and 360 here; a colour area pages by the channel's page size.
      await key(thumb, "End");
      expect(inputs(container)[0]!.value).toBe("45");

      await key(thumb, "Home");
      expect(inputs(container)[0]!.value).toBe("30");

      unmount();
    });

    it("pages along y with PageUp and PageDown", async () => {
      const { container, unmount } = renderArea({ defaultValue: "hsl(30, 50%, 50%)" });
      const thumb = slot(container, "color-area-thumb");

      await key(thumb, "PageUp");
      expect(inputs(container)[1]!.value).toBe("60");

      await key(thumb, "PageDown");
      expect(inputs(container)[1]!.value).toBe("50");

      unmount();
    });

    it("stays put while disabled", async () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 50%, 50%)",
        isDisabled: true,
      });

      await key(slot(container, "color-area-thumb"), "ArrowRight");

      expect(inputs(container)[0]!.value).toBe("30");

      unmount();
    });
  });

  describe("changes", () => {
    it("reports a colour, and closes the interaction once per keystroke", async () => {
      const onChange = vi.fn();
      const onChangeEnd = vi.fn();
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 50%, 50%)",
        onChange,
        onChangeEnd,
      });

      await key(slot(container, "color-area-thumb"), "PageUp");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]?.[0] as Color).toString("hsl")).toBe("hsl(30, 60%, 50%)");
      expect(onChangeEnd).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("follows a controlled value", async () => {
      const props = reactive({ value: parseColor("hsl(30, 100%, 50%)") as Color });
      const { container, unmount } = renderVapor(Fixture, { props });

      expect(inputs(container)[0]!.value).toBe("30");

      props.value = parseColor("hsl(180, 100%, 50%)");
      await nextTick();

      expect(inputs(container)[0]!.value).toBe("180");
      expect(slot(container, "color-area-thumb").style.left).toBe("50%");

      unmount();
    });

    it("repaints the gradient as the held channel moves", async () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 100%, 50%)",
        xChannel: "saturation",
        yChannel: "lightness",
      });

      // The hue is held here, so it is the flat layer pushed beneath both gradients.
      expect(
        slot(container, "color-area").style.getPropertyValue("--color-area-background"),
      ).toContain("hsla(30, 100%, 50%, 1)");

      unmount();
    });

    it("puts the whole colour back when the form is reset", async () => {
      const { container, unmount } = renderArea({
        defaultValue: "hsl(30, 50%, 50%)",
        withForm: true,
      });

      await key(slot(container, "color-area-thumb"), "PageUp");
      expect(inputs(container)[1]!.value).toBe("60");

      container.querySelector<HTMLButtonElement>("[data-testid='reset']")!.click();
      await nextTick();

      // Both channels come back, not just the one the reset input stands for.
      expect(inputs(container)[0]!.value).toBe("30");
      expect(inputs(container)[1]!.value).toBe("50");

      unmount();
    });
  });
});
