import type { Color } from "@/utils/color-types";

import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";

import { ColorArea, ColorAreaThumb } from "@/components/color-area";
import { ColorPickerPopover, ColorPicker, ColorPickerTrigger } from "@/components/color-picker";
import { ColorSlider, ColorSliderThumb, ColorSliderTrack } from "@/components/color-slider";
import { ColorSwatch } from "@/components/color-swatch";
import {
  ColorSwatchPickerItem,
  ColorSwatchPicker,
  ColorSwatchPickerSwatch,
} from "@/components/color-swatch-picker";
import { Label } from "@/components/label";

/**
 * The picker mounted the way a consumer mounts it: from a VDOM host, with every colour component
 * written in the host and forwarded through the picker's and the popover's slots.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the *host*. The shared colour is the whole point of this component
 * and it travels only through `provide`, so the path every real application uses has to be checked
 * on its own — and it crosses two boundaries here, the picker's slot and the popover's teleport.
 */
const render = (props: Record<string, unknown> = {}) =>
  renderInterop(ColorPicker, {
    props,
    slots: {
      default: () => [
        h(ColorPickerTrigger, null, {
          default: () => [
            h(ColorSwatch, { size: "lg" }),
            h(Label, null, { default: () => "Pick a color" }),
          ],
        }),
        h(ColorPickerPopover, null, {
          default: () => [
            h(
              ColorArea,
              {
                ariaLabel: "Color area",
                colorSpace: "hsb",
                xChannel: "saturation",
                yChannel: "brightness",
              },
              { default: () => h(ColorAreaThumb) },
            ),
            h(
              ColorSlider,
              { channel: "hue", colorSpace: "hsb" },
              { default: () => h(ColorSliderTrack, null, { default: () => h(ColorSliderThumb) }) },
            ),
            h(
              ColorSwatchPicker,
              { size: "xs" },
              {
                default: () =>
                  ["#EF4444", "#22C55E"].map((color) =>
                    h(
                      ColorSwatchPickerItem,
                      { color, key: color },
                      {
                        default: () => h(ColorSwatchPickerSwatch),
                      },
                    ),
                  ),
              },
            ),
          ],
        }),
      ],
    },
  });

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const open = async () => {
  press(slot("color-picker-trigger"));
  await nextTick();
  await nextTick();
  await nextTick();
};

// The popover is teleported, so every lookup goes through the document — and a test that throws
// before its `unmount` would otherwise leak into the next one.
afterEach(() => {
  document.body.replaceChildren();
});

describe("ColorPicker under a vdom host", () => {
  it("renders the trigger and opens the popover", async () => {
    const { unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();

    expect(slot("color-picker-trigger")).toHaveClass("rp-color-picker__trigger");

    await open();

    expect(slot("color-picker-popover")).toHaveAttribute("role", "dialog");

    unmount();
  });

  it("reaches a swatch written in the host", async () => {
    const { unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();

    expect(slot("color-swatch").style.backgroundColor).toBe("rgb(4, 133, 247)");

    unmount();
  });

  it("reaches a slider written in the host and forwarded through the teleport", async () => {
    // Two boundaries at once: the picker's slot, then the popover's.
    const { unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();
    await open();

    expect(slot("color-slider-thumb").style.left).toBe("57.77777777777777%");

    unmount();
  });

  it("reaches a colour area written in the host", async () => {
    const { unmount } = render({ defaultValue: "#0485F7" });

    await nextTick();
    await open();

    expect(slot("color-area-thumb").style.left).toBe("98.38%");

    unmount();
  });

  it("reaches a swatch picker written in the host", async () => {
    const { unmount } = render({ defaultValue: "#EF4444" });

    await nextTick();
    await open();

    expect(document.querySelector("[role='option']")).toHaveAttribute("data-selected", "true");

    unmount();
  });

  it("carries a change back out of the teleport", async () => {
    const onChange = vi.fn();
    const { unmount } = render({ defaultValue: "#EF4444", onChange });

    await nextTick();
    await open();

    document.querySelectorAll<HTMLElement>("[role='option']")[1]!.click();
    await nextTick();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as Color).toString("hex")).toBe("#22C55E");

    unmount();
  });

  it("shows the new colour on the trigger written in the host", async () => {
    // The full round trip: a press inside the teleport updates a swatch outside it.
    const { unmount } = render({ defaultValue: "#EF4444" });

    await nextTick();
    await open();

    document.querySelectorAll<HTMLElement>("[role='option']")[1]!.click();
    await nextTick();

    expect(slot("color-swatch").style.backgroundColor).toBe("rgb(34, 197, 94)");

    unmount();
  });
});
