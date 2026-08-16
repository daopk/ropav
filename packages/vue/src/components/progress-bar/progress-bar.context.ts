import type {ProgressValueState} from "../../composables/use-progress-value";
import type {progressBarVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ProgressBarContext {
  slots: ComputedRef<ReturnType<typeof progressBarVariants>>;
  state: ProgressValueState;
}

export const [useProgressBarContext, provideProgressBarContext] = createContext<ProgressBarContext>(
  {name: "ProgressBarContext"},
);
