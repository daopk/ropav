import type {UseDateFieldReturn} from "../../composables/use-date-field";
import type {DateFieldState} from "../../composables/use-date-field-state";
import type {dateInputGroupVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface DateInputGroupContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof dateInputGroupVariants>>;
}

/**
 * Carries the group's styling down to its parts.
 *
 * Loose: `Prefix`, `Suffix` and `InputContainer` all render perfectly well on their own, and
 * standing outside a group is not an error — they just get no slot class, exactly as in React.
 */
export const [useDateInputGroupContext, provideDateInputGroupContext] =
  createContext<DateInputGroupContext | null>({
    defaultValue: null,
    name: "DateInputGroupContext",
    strict: false,
  });

export interface DateFieldControlContext {
  state: DateFieldState;
  field: UseDateFieldReturn;
  /**
   * The input part reports the two elements the field needs but does not render.
   *
   * The field's wiring is built by the root, which cannot reach either: focus moves around inside
   * the group of segments, and the value is mirrored onto a hidden input beside it, and both of
   * those belong to the input part.
   */
  setElement: (element: HTMLElement | null) => void;
  setInputElement: (element: HTMLInputElement | null) => void;
}

/**
 * Carries the field down to the parts that edit it.
 *
 * Published by whichever root is above — `DateField`, `TimeField`, `DatePicker` or
 * `DateRangePicker`. The parts never own the state themselves, which is what lets a picker's
 * segments work with no field root of their own: the story composition puts `Input` and `Segment`
 * straight inside a `DatePicker`.
 *
 * Strict: an input with no value to edit is not a degraded input, it is a bug.
 */
export const [useDateFieldControlContext, provideDateFieldControlContext] =
  createContext<DateFieldControlContext>({name: "DateFieldControlContext"});
