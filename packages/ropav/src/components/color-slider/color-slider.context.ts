import type { UseColorSliderReturn } from "../../composables/use-color-slider";
import type { ColorSliderState } from "../../composables/use-color-slider-state";
import type { ColorChannel } from "../../utils/color-types";
import type { colorSliderVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface ColorSliderContext {
  slots: ComputedRef<ReturnType<typeof colorSliderVariants>>;
  state: ColorSliderState;
  slider: UseColorSliderReturn;
  /** The channel the slider drives, after the colour space has been reconciled with it. */
  channel: ComputedRef<ColorChannel>;
  setTrackEl: (element: unknown) => void;
  setInputEl: (element: unknown) => void;
}

export const [useColorSliderContext, provideColorSliderContext] = createContext<ColorSliderContext>(
  { name: "ColorSliderContext" },
);
