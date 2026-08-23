import type {UseColorAreaReturn} from "../../composables/use-color-area";
import type {ColorAreaState} from "../../composables/use-color-area-state";
import type {colorAreaVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ColorAreaContext {
  slots: ComputedRef<ReturnType<typeof colorAreaVariants>>;
  state: ColorAreaState;
  area: UseColorAreaReturn;
  setInputXEl: (element: unknown) => void;
  setInputYEl: (element: unknown) => void;
}

export const [useColorAreaContext, provideColorAreaContext] = createContext<ColorAreaContext>({
  name: "ColorAreaContext",
});
