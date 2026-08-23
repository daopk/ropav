import type { UseSliderReturn } from "../../composables/use-slider";
import type { SliderState } from "../../composables/use-slider-state";
import type { sliderVariants } from "@ropav/styles";
import type { ComputedRef, Ref } from "vue";

import { createContext } from "../../utils/create-context";

export interface SliderContext {
  slots: ComputedRef<ReturnType<typeof sliderVariants>>;
  state: SliderState;
  slider: UseSliderReturn;
  /** The track element, which every drag is measured against. */
  trackEl: Ref<HTMLElement | null>;
  setTrackEl: (element: unknown) => void;
}

export const [useSliderContext, provideSliderContext] = createContext<SliderContext>({
  name: "SliderContext",
});
