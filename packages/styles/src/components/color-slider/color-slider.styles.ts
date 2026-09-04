import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorSliderVariants = tv({
  slots: {
    base: "color-slider",
    output: "color-slider__output",
    thumb: "color-slider__thumb",
    track: "color-slider__track",
  },
});

export type ColorSliderVariants = VariantProps<typeof colorSliderVariants>;
