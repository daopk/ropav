import type {TooltipTriggerState} from "../../composables/use-tooltip-trigger-state";
import type {tooltipVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface TooltipContext {
  slots: ComputedRef<ReturnType<typeof tooltipVariants>>;
  state: TooltipTriggerState;
  /** The id the tooltip carries, which the trigger's `aria-describedby` points at. */
  tooltipId: ComputedRef<string>;
  /** The element the tooltip is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
  /**
   * Whether this open or close happens without an animation.
   *
   * Always `false` unless the caller asked otherwise, which is where HeroUI parts company with
   * React Aria's warmup skip.
   */
  shouldSkipAnimation: ComputedRef<boolean>;
}

/** Strict: a tooltip's content is meaningless without the trigger that decides when it shows. */
export const [useTooltipContext, provideTooltipContext] = createContext<TooltipContext>({
  name: "TooltipContext",
});
