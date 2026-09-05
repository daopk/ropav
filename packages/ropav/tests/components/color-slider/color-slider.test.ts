import type { Color } from "@/utils/color-types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { parseColor } from "@/utils/color";

import Fixture from "./fixtures.vue";

const CHECKERBOARD =
  "repeating-conic-gradient(rgb(239, 239, 239) 0% 25%, rgb(247, 247, 247) 0% 50%)";

const renderSlider = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {
    props: { channel: "hue", defaultValue: "hsl(0, 100%, 50%)", ...props },
  });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const inputIn = (container: HTMLElement) => container.querySelector("input")!;

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init }),
  );

  return nextTick();
};

describe("ColorSlider", () => {
  describe("structure", () => {
    it("renders every part with its data-slot and BEM class", () => {
      const { container, unmount } = renderSlider();

      expect(slot(container, "color-slider")).toHaveClass("rp-color-slider");
      expect(slot(container, "color-slider-output")).toHaveClass("rp-color-slider__output");
      expect(slot(container, "color-slider-track")).toHaveClass("rp-color-slider__track");
      expect(slot(container, "color-slider-thumb")).toHaveClass("rp-color-slider__thumb");

      unmount();
    });

    it("lets a caller's class through to the element", () => {
      const { container, unmount } = renderSlider({ class: "w-64" });

      expect(slot(container, "color-slider")).toHaveClass("rp-color-slider", "w-64");

      unmount();
    });

    it("marks the orientation and the disabled state on every part the stylesheet reads", () => {
      const { container, unmount } = renderSlider({ isDisabled: true, orientation: "vertical" });

      for (const name of ["color-slider", "color-slider-output", "color-slider-track"]) {
        expect(slot(container, name)).toHaveAttribute("data-orientation", "vertical");
        expect(slot(container, name)).toHaveAttribute("data-disabled", "true");
      }
      expect(slot(container, "color-slider-thumb")).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("leaves the disabled attributes off while enabled", () => {
      const { container, unmount } = renderSlider();

      expect(slot(container, "color-slider")).not.toHaveAttribute("data-disabled");
      expect(slot(container, "color-slider-thumb")).not.toHaveAttribute("data-disabled");

      unmount();
    });
  });

  describe("labelling", () => {
    it("puts the group on the track rather than on the root", () => {
      const { container, unmount } = renderSlider();

      expect(slot(container, "color-slider")).not.toHaveAttribute("role");
      expect(slot(container, "color-slider-track")).toHaveAttribute("role", "group");

      unmount();
    });

    it("points the track and the thumb at a rendered label", () => {
      const { container, unmount } = renderSlider();
      const labelId = slot(container, "label").id;

      expect(labelId).not.toBe("");
      expect(slot(container, "color-slider-track")).toHaveAttribute("aria-labelledby", labelId);
      expect(inputIn(container)).toHaveAttribute("aria-labelledby", labelId);

      unmount();
    });

    it("names an unlabelled slider after its channel, and names the thumb after the group", () => {
      const { container, unmount } = renderSlider({ withoutLabel: true });
      const track = slot(container, "color-slider-track");

      expect(track).toHaveAttribute("aria-label", "Hue");
      expect(track).not.toHaveAttribute("aria-labelledby");
      expect(inputIn(container)).toHaveAttribute("aria-labelledby", track.id);

      unmount();
    });

    it("prefers the caller's own label", () => {
      const { container, unmount } = renderSlider({ ariaLabel: "Pick a hue", withoutLabel: true });

      expect(slot(container, "color-slider-track")).toHaveAttribute("aria-label", "Pick a hue");

      unmount();
    });

    it("exposes the thumb as a slider named by the label", () => {
      const { container, unmount } = renderSlider();

      // The hidden range input is the control, so this is what assistive technology reaches.
      expect(inputIn(container)).toHaveAttribute("aria-orientation", "horizontal");
      expect(inputIn(container)).toHaveAttribute("type", "range");

      unmount();
    });

    it("moves focus into the thumb when the label is clicked", () => {
      const { container, unmount } = renderSlider();

      slot(container, "label").click();

      expect(document.activeElement).toBe(inputIn(container));

      unmount();
    });
  });

  describe("the output", () => {
    it("reads the channel's own formatting and points at the thumb", () => {
      const { container, unmount } = renderSlider({ defaultValue: "hsl(200, 100%, 50%)" });
      const output = slot(container, "color-slider-output");

      expect(output).toHaveTextContent("200°");
      expect(output).toHaveAttribute("for", inputIn(container).id);
      // Left to the thumb's own `aria-valuetext`, which carries the colour name too.
      expect(output).toHaveAttribute("aria-live", "off");

      unmount();
    });

    it("formats a percentage channel as a percentage and an rgb channel as a number", () => {
      const alpha = renderSlider({ channel: "alpha", defaultValue: "hsla(0, 100%, 50%, 0.5)" });

      expect(slot(alpha.container, "color-slider-output")).toHaveTextContent("50%");
      alpha.unmount();

      const red = renderSlider({
        channel: "red",
        colorSpace: "rgb",
        defaultValue: "rgb(255, 0, 0)",
      });

      expect(slot(red.container, "color-slider-output")).toHaveTextContent("255");
      red.unmount();
    });
  });

  describe("the hidden input", () => {
    it("carries the channel's range rather than a generic one", () => {
      const { container, unmount } = renderSlider();
      const input = inputIn(container);

      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "360");
      expect(input).toHaveAttribute("step", "1");
      expect(input).toHaveAttribute("tabindex", "0");
      expect(input.value).toBe("0");

      unmount();
    });

    it("names the colour in its value text", () => {
      const { container, unmount } = renderSlider({ defaultValue: "hsl(200, 100%, 50%)" });

      expect(inputIn(container)).toHaveAttribute("aria-valuetext", "200°, cyan blue");

      unmount();
    });

    it("submits under the name it was given", () => {
      const { container, unmount } = renderSlider({ form: "the-form", name: "hue" });
      const input = inputIn(container);

      expect(input).toHaveAttribute("name", "hue");
      expect(input).toHaveAttribute("form", "the-form");

      unmount();
    });

    it("is disabled and out of the tab order when the slider is", () => {
      const { container, unmount } = renderSlider({ isDisabled: true });
      const input = inputIn(container);

      expect(input).toBeDisabled();
      expect(input).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("stays in the accessibility tree while out of sight", () => {
      const { container, unmount } = renderSlider();

      // Filling the track rather than hiding in a 1px box, with the pointer passing through it.
      expect(inputIn(container).style.width).toBe("100%");
      expect(inputIn(container).style.height).toBe("100%");
      expect(inputIn(container).style.pointerEvents).toBe("none");
      expect(inputIn(container).style.opacity).toBe("0.0001");

      unmount();
    });
  });

  describe("painting", () => {
    it("lays the generated gradient over a transparency checkerboard", () => {
      const { container, unmount } = renderSlider();
      const background = slot(container, "color-slider-track").style.background;

      expect(background).toContain("linear-gradient(to right, rgb(255, 0, 0)");
      expect(background).toContain(CHECKERBOARD);

      unmount();
    });

    it("hands the channel's two ends to the stylesheet for the track's end caps", () => {
      const { container, unmount } = renderSlider();
      const track = slot(container, "color-slider-track");

      // A pseudo-element cannot take an inline style, so the caps read these instead.
      expect(track.style.getPropertyValue("--track-start-color")).toBe("hsla(0, 100%, 50%, 1)");
      expect(track.style.getPropertyValue("--track-end-color")).toBe("hsla(360, 100%, 50%, 1)");

      unmount();
    });

    it("keeps the track's own layout under the gradient", () => {
      const { container, unmount } = renderSlider();
      const track = slot(container, "color-slider-track");

      expect(track.style.position).toBe("relative");
      expect(track.style.touchAction).toBe("none");
      expect(track.style.forcedColorAdjust).toBe("none");

      unmount();
    });

    it("positions the thumb along the track and paints it with the value", () => {
      const { container, unmount } = renderSlider({ defaultValue: "hsl(180, 100%, 50%)" });
      const thumb = slot(container, "color-slider-thumb");

      expect(thumb.style.left).toBe("50%");
      // The stylesheet centres the other axis, so writing it here would fight it.
      expect(thumb.style.top).toBe("");
      expect(thumb.style.backgroundColor).toBe("rgb(0, 255, 255)");

      unmount();
    });

    it("positions a vertical thumb from the top, counting the value from the bottom", () => {
      const { container, unmount } = renderSlider({
        defaultValue: "hsl(90, 100%, 50%)",
        orientation: "vertical",
      });
      const thumb = slot(container, "color-slider-thumb");

      expect(thumb.style.top).toBe("75%");
      expect(thumb.style.left).toBe("");

      unmount();
    });

    it("drops the colour from a disabled thumb", () => {
      const { container, unmount } = renderSlider({ isDisabled: true });

      expect(slot(container, "color-slider-thumb").style.backgroundColor).toBe("");

      unmount();
    });

    it("paints an alpha track from transparent to opaque", () => {
      const { container, unmount } = renderSlider({
        channel: "alpha",
        defaultValue: "hsla(0, 100%, 50%, 0.5)",
      });
      const track = slot(container, "color-slider-track");

      expect(track.style.background).toContain(
        "linear-gradient(to right, rgba(255, 0, 0, 0), rgb(255, 0, 0))",
      );
      expect(track.style.getPropertyValue("--track-start-color")).toBe("hsla(0, 100%, 50%, 0)");

      unmount();
    });
  });

  describe("keyboard", () => {
    it("steps with the arrows", async () => {
      const { container, unmount } = renderSlider();
      const thumb = slot(container, "color-slider-thumb");

      await key(thumb, "ArrowRight");
      expect(inputIn(container).value).toBe("1");

      await key(thumb, "ArrowLeft");
      expect(inputIn(container).value).toBe("0");

      unmount();
    });

    it("pages by the channel's own step, not by a tenth of the range", async () => {
      const { container, unmount } = renderSlider();
      const thumb = slot(container, "color-slider-thumb");

      // 15 for hue; a tenth of 0–360 would be 36.
      await key(thumb, "PageUp");
      expect(inputIn(container).value).toBe("15");

      await key(thumb, "ArrowRight", { shiftKey: true });
      expect(inputIn(container).value).toBe("30");

      await key(thumb, "PageDown");
      expect(inputIn(container).value).toBe("15");

      unmount();
    });

    it("jumps to the ends of the channel", async () => {
      const { container, unmount } = renderSlider({ defaultValue: "hsl(200, 100%, 50%)" });
      const thumb = slot(container, "color-slider-thumb");

      await key(thumb, "End");
      expect(inputIn(container).value).toBe("360");

      await key(thumb, "Home");
      expect(inputIn(container).value).toBe("0");

      unmount();
    });

    it("stays put while disabled", async () => {
      const { container, unmount } = renderSlider({ isDisabled: true });

      await key(slot(container, "color-slider-thumb"), "ArrowRight");

      expect(inputIn(container).value).toBe("0");

      unmount();
    });

    it("marks the thumb focused while the hidden input behind it holds focus", async () => {
      const { container, unmount } = renderSlider();

      inputIn(container).focus();
      await nextTick();

      // Focus lives on the input; the ring is painted on the thumb, so the state has to cross
      // over. Whether the ring appears for a *pointer* focus is a question of interaction
      // modality, which only a real browser answers — see the browser suite.
      expect(slot(container, "color-slider-thumb")).toHaveAttribute("data-focused", "true");
      expect(slot(container, "color-slider-thumb")).toHaveAttribute("data-focus-visible", "true");

      unmount();
    });
  });

  describe("changes", () => {
    it("reports a colour rather than a channel number", async () => {
      const onChange = vi.fn();
      const onChangeEnd = vi.fn();
      const { container, unmount } = renderSlider({ onChange, onChangeEnd });

      await key(slot(container, "color-slider-thumb"), "PageUp");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]?.[0] as Color).toString("hsl")).toBe("hsl(15, 100%, 50%)");
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect((onChangeEnd.mock.calls[0]?.[0] as Color).toString("hsl")).toBe("hsl(15, 100%, 50%)");

      unmount();
    });

    it("follows a controlled value", async () => {
      const props = reactive({
        channel: "hue",
        defaultValue: undefined,
        value: parseColor("hsl(0, 100%, 50%)") as Color,
      });
      const { container, unmount } = renderVapor(Fixture, { props });

      expect(inputIn(container).value).toBe("0");

      props.value = parseColor("hsl(90, 100%, 50%)");
      await nextTick();

      expect(inputIn(container).value).toBe("90");
      expect(slot(container, "color-slider-thumb").style.left).toBe("25%");

      unmount();
    });

    it("repaints the track as the colour moves", async () => {
      const { container, unmount } = renderSlider({ channel: "saturation" });

      await key(slot(container, "color-slider-thumb"), "Home");

      expect(slot(container, "color-slider-track").style.background).toContain(
        "linear-gradient(to right, rgb(128, 128, 128), rgb(255, 0, 0))",
      );

      unmount();
    });
  });

  describe("channel and colour space", () => {
    it("corrects a channel that only exists in another space, and says so", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container, unmount } = renderSlider({
        channel: "red",
        colorSpace: "hsl",
        defaultValue: "rgb(255, 0, 0)",
      });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('channel="red" requires colorSpace="rgb"');
      // Corrected rather than left to throw out of the colour model.
      expect(inputIn(container)).toHaveAttribute("max", "255");

      warn.mockRestore();
      unmount();
    });

    it("corrects a channel that rgb does not have, and says so", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container, unmount } = renderSlider({
        channel: "saturation",
        colorSpace: "rgb",
        defaultValue: "hsl(0, 100%, 50%)",
      });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain("not available in RGB color space");
      expect(inputIn(container)).toHaveAttribute("max", "100");

      warn.mockRestore();
      unmount();
    });

    it("says nothing about a combination that works", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = renderSlider({ channel: "hue", colorSpace: "hsb" });

      expect(warn).not.toHaveBeenCalled();

      warn.mockRestore();
      unmount();
    });

    it("works the value in the space it was told to", () => {
      const { container, unmount } = renderSlider({
        channel: "brightness",
        colorSpace: "hsb",
        defaultValue: "hsl(0, 100%, 50%)",
      });

      expect(slot(container, "color-slider-output")).toHaveTextContent("100%");

      unmount();
    });
  });
});
