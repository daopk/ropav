import type {switchVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface SwitchContext {
  slots: ComputedRef<ReturnType<typeof switchVariants>>;
  isSelected: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  /** Value the hidden input goes back to when the surrounding form is reset. */
  defaultSelected: ComputedRef<boolean>;
  /** Ids of the description and error message the field renders, plus the caller's own. */
  describedBy: ComputedRef<string | undefined>;
  id: ComputedRef<string | undefined>;
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledby: ComputedRef<string | undefined>;
  name: ComputedRef<string | undefined>;
  value: ComputedRef<string | undefined>;
  form: ComputedRef<string | undefined>;
  setSelected: (isSelected: boolean) => void;
}

export const [useSwitchContext, provideSwitchContext] = createContext<SwitchContext>({
  name: "SwitchContext",
});
