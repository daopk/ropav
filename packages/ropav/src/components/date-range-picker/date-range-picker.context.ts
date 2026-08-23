import type {dateRangePickerVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface DateRangePickerContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof dateRangePickerVariants>>;
  /** Attributes for the button that opens the popover. Spread with `v-bind`. */
  triggerAttrs: ComputedRef<Record<string, unknown>>;
  /** Whether the button is out of action: a read-only picker has nothing to pick. */
  isTriggerDisabled: ComputedRef<boolean>;
  /**
   * Whether the popover is open.
   *
   * The button reads as pressed for as long as it is, so it looks like the thing the popover
   * belongs to rather than flicking back the moment the pointer lifts.
   */
  isOpen: ComputedRef<boolean>;
  onTriggerPress: () => void;
  /**
   * The button reports itself, so focus can be put back on it once the popover closes.
   *
   * Only after a key was pressed while it was open: a pointer user has already moved on, and
   * yanking focus back would be a surprise.
   */
  setTriggerElement: (element: HTMLElement | null) => void;
}

/** Strict: every part of a range picker needs the wiring the root holds. */
export const [useDateRangePickerContext, provideDateRangePickerContext] =
  createContext<DateRangePickerContext>({name: "DateRangePickerContext"});
