import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const sliderVariants = tv({
  slots: {
    base: "rp-slider",
    fill: "rp-slider__fill",
    marks: "rp-slider__marks",
    output: "rp-slider__output",
    thumb: "rp-slider__thumb",
    track: "rp-slider__track",
  },
});

export type SliderVariants = VariantProps<typeof sliderVariants>;
