import type { ProgressValueState } from "../../composables/use-progress-value";
import type { progressCircleVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface ProgressCircleContext {
  slots: ComputedRef<ReturnType<typeof progressCircleVariants>>;
  state: ProgressValueState;
}

export const [useProgressCircleContext, provideProgressCircleContext] =
  createContext<ProgressCircleContext>({ name: "ProgressCircleContext" });
