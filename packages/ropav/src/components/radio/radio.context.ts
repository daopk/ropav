import type {radioVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface RadioContext {
  slots: ComputedRef<ReturnType<typeof radioVariants>>;
  isSelected: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  /** Held by the group, not the radio. */
  isReadOnly: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  /** `0` when this radio is the group's tab stop, `-1` otherwise, absent while disabled. */
  tabIndex: ComputedRef<number | undefined>;
  /** Ids of the help text describing this radio and its group's, plus the caller's own. */
  describedBy: ComputedRef<string | undefined>;
  id: ComputedRef<string | undefined>;
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledby: ComputedRef<string | undefined>;
  name: ComputedRef<string>;
  value: ComputedRef<string>;
  form: ComputedRef<string | undefined>;
  select: () => void;
  onFocus: () => void;
}

export const [useRadioContext, provideRadioContext] = createContext<RadioContext>({
  name: "RadioContext",
});
