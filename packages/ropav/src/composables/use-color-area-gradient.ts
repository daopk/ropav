import type { Color, ColorChannel } from "../utils/color-types";
import type { Direction } from "../utils/locale";
import type { ColorAreaState } from "./use-color-area-state";
import type { CSSProperties, ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { parseColor } from "../utils/color";

/** Stops of the hue wheel a gradient is drawn through, in degrees. */
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360];

const hue = (color: Color) =>
  HUE_STOPS.map((stop) => color.withChannelValue("hue", stop).toString("css")).join(", ");

/** Grey to see-through, so whatever is painted underneath shows at full saturation. */
const saturation = (color: Color) =>
  `${color.withChannelValue("saturation", 0).toString("css")}, transparent`;

const HSL_CHANNELS: Partial<Record<ColorChannel, (color: Color) => string>> = {
  hue,
  lightness: () => "black, transparent, white",
  saturation,
};

const HSB_CHANNELS: Partial<Record<ColorChannel, (color: Color) => string>> = {
  brightness: () => "black, transparent",
  hue,
  saturation,
};

export interface UseColorAreaGradientOptions {
  state: ColorAreaState;
  /** Reading direction: the x axis of a colour area runs with the text. */
  direction: MaybeRefOrGetter<Direction>;
}

export interface UseColorAreaGradientReturn {
  /** Inline style for the area, gradient included. */
  areaStyle: ComputedRef<CSSProperties>;
  /** Inline style for the thumb: where it sits, and the colour it stands for. */
  thumbStyle: ComputedRef<CSSProperties>;
}

/**
 * The two-dimensional gradient behind a colour area, and where its thumb sits on it.
 *
 * Ported from React Aria's `packages/react-aria/src/color/useColorAreaGradient.ts`
 * (react-aria 3.51.0). Three shapes, one per colour space, and they are not variations of each
 * other:
 *
 * - **`rgb`** stacks three layers and blends them with `screen`, which multiplies the inverse of
 *   each channel — so a red ramp over a green ramp over a flat blue combines channel by channel
 *   into the square a viewer expects. `background-blend-mode` is load-bearing: without it the top
 *   layer simply covers the others, and the result still *looks* like a plausible colour square.
 * - **`hsl`** and **`hsb`** paint one gradient per non-held channel, **reversed** so the x axis
 *   ends up underneath, and push a flat colour beneath both when the held channel is the hue.
 *
 * The joining is not cosmetic either: `rgb` joins its layers with a bare comma and the other two
 * with comma-space, which is why the two are written out separately here rather than shared.
 */
export const useColorAreaGradient = (
  options: UseColorAreaGradientOptions,
): UseColorAreaGradientReturn => {
  const { state } = options;

  /** Where the far end of the x axis is, which is where the text ends. */
  const end = computed(() => (toValue(options.direction) === "rtl" ? "left" : "right"));

  const background = computed<CSSProperties>(() => {
    const { xChannel, yChannel, zChannel } = state.channels.value;
    const value = state.value.value;
    const zValue = value.getChannelValue(zChannel);
    const to = end.value;

    if (value.getColorSpace() === "rgb") {
      const rgb = parseColor("rgb(0, 0, 0)");

      return {
        background: [
          `linear-gradient(to ${to}, ${rgb.withChannelValue(xChannel, 0).toString("css")}, ${rgb.withChannelValue(xChannel, 255).toString("css")})`,
          `linear-gradient(to top, ${rgb.withChannelValue(yChannel, 0).toString("css")}, ${rgb.withChannelValue(yChannel, 255).toString("css")})`,
          rgb.withChannelValue(zChannel, zValue).toString("css"),
        ].join(","),
        backgroundBlendMode: "screen",
      };
    }

    const isHsl = value.getColorSpace() === "hsl";
    const table = isHsl ? HSL_CHANNELS : HSB_CHANNELS;
    // A fully saturated starting point, so each gradient shows its own channel at full strength.
    const base = parseColor(isHsl ? "hsl(0, 100%, 50%)" : "hsb(0, 100%, 100%)").withChannelValue(
      zChannel,
      zValue,
    );

    const layers = value
      .getColorChannels()
      .filter((channel) => channel !== zChannel)
      .map(
        (channel) =>
          `linear-gradient(to ${channel === xChannel ? to : "top"}, ${table[channel]!(base)})`,
      )
      .reverse();

    // Both remaining gradients fade to transparent, so with the hue held there would be nothing
    // behind them to show through.
    if (zChannel === "hue") layers.push(base.toString("css"));

    return { background: layers.join(", ") };
  });

  return {
    areaStyle: computed(() => ({
      // `forcedColorAdjust`: Windows high contrast would otherwise repaint the one thing the area
      // exists to show. Keys are alphabetical because the lint rule says so, not because CSS cares.
      forcedColorAdjust: "none",
      position: "relative",
      touchAction: "none",
      ...background.value,
    })),
    thumbStyle: computed(() => {
      // `y` already counts downwards from the top, which is what `top` wants.
      const { x, y } = state.getThumbPosition();

      return {
        forcedColorAdjust: "none",
        left: `${(toValue(options.direction) === "rtl" ? 1 - x : x) * 100}%`,
        position: "absolute",
        top: `${y * 100}%`,
        touchAction: "none",
        transform: "translate(-50%, -50%)",
      };
    }),
  };
};
