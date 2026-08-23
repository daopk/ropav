import type {AlertVariants, alertVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface AlertContext {
  slots: ComputedRef<ReturnType<typeof alertVariants>>;
  status: ComputedRef<AlertVariants["status"]>;
}

export const [useAlertContext, provideAlertContext] = createContext<AlertContext>({
  name: "AlertContext",
});
