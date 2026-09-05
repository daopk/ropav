import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorSliderVariants = tv({
  slots: {
    base: "rp-color-slider",
    output: "rp-color-slider__output",
    thumb: "rp-color-slider__thumb",
    track: "rp-color-slider__track",
  },
});

export type ColorSliderVariants = VariantProps<typeof colorSliderVariants>;
