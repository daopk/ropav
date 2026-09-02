import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { UseSingleSelectListStateReturn } from "../../composables/use-single-select-list-state";
import type { segmentedControlVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SegmentedControlContext {
  slots: ComputedRef<ReturnType<typeof segmentedControlVariants>>;
  isDisabled: ComputedRef<boolean>;
  /** Which segment is selected, and the collection it is selected from. */
  state: UseSingleSelectListStateReturn;
  keyboard: UseListKeyboardReturn;
}

export const [useSegmentedControlContext, provideSegmentedControlContext] =
  createContext<SegmentedControlContext>({
    errorMessage:
      "A segment has to be rendered inside a SegmentedControl: it takes its selection and its place in the keyboard order from the control.",
    name: "SegmentedControlContext",
  });

export interface SegmentedControlItemContext {
  /** Read by the indicator, which is rendered inside the segment it belongs to. */
  isSelected: ComputedRef<boolean>;
}

export const [useSegmentedControlItemContext, provideSegmentedControlItemContext] =
  createContext<SegmentedControlItemContext>({
    errorMessage: "A segmented control's indicator has to be rendered inside a segment.",
    name: "SegmentedControlItemContext",
  });
