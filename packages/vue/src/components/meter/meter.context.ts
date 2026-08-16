import type {ProgressValueState} from "../../composables/use-progress-value";
import type {meterVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface MeterContext {
  slots: ComputedRef<ReturnType<typeof meterVariants>>;
  state: ProgressValueState;
}

export const [useMeterContext, provideMeterContext] = createContext<MeterContext>({
  name: "MeterContext",
});
