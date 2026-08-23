import type {PageBehavior} from "../../composables/use-calendar-state";
import type {ValidationBehavior} from "../../composables/use-form-validation-state";
import type {DayOfWeek} from "../../utils/calendar";
import type {Granularity} from "../../utils/date-format";
import type {Placement} from "../../utils/position";
import type {Calendar, CalendarIdentifier, DateValue} from "@internationalized/date";

/*
 * Boolean props are declared as plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<DatePicker is-required>` would arrive
 * as `""` and read as falsy, so the state silently never applies.
 */
export interface DatePickerRootProps {
  class?: string;
  /** Id for the group around the segments and the trigger, which is what a label points at. */
  id?: string;
  /** The date the picker shows. Set this and the caller owns the value. */
  value?: DateValue | null;
  /** The date the picker starts with while it owns its own value. */
  defaultValue?: DateValue | null;
  /**
   * A date whose shape the empty segments follow, which is also where the calendar opens.
   * Defaults to today.
   */
  placeholderValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A prop rather than an emit: the picker calls it while validating and while drawing the
   * calendar, and an emit has no answer to give back.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** The smallest part of a date the picker shows. Taken from the value when unset. */
  granularity?: Granularity;
  /** Whether to show a 12 or 24 hour clock. Taken from the locale when unset. */
  hourCycle?: 12 | 24;
  /** Whether the time zone abbreviation is hidden. */
  hideTimeZone?: boolean;
  /** Whether numbers are always padded to two digits. Taken from the locale when unset. */
  shouldForceLeadingZeros?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  /** Whether the picker reads as invalid regardless of what it holds. */
  isInvalid?: boolean;
  /** Extra rule the value has to satisfy, beyond the range. */
  validate?: (value: DateValue | null) => string | string[] | true | null | undefined;
  /** Whether errors go through the browser or through ARIA alone. @default "native" */
  validationBehavior?: ValidationBehavior;
  /** Name the value is submitted under. */
  name?: string;
  /** Id of the form the value belongs to, when it is not an ancestor. */
  form?: string;
  /** What the browser may offer to autofill. */
  autoComplete?: string;
  /** Whether the first segment takes focus as the picker appears. */
  autoFocus?: boolean;
  /** Whether picking a date closes the popover. @default true */
  shouldCloseOnSelect?: boolean | (() => boolean);
  /** The day a week starts on in the calendar, when it should not follow the locale. */
  firstDayOfWeek?: DayOfWeek;
  /** How much the calendar moves by when it pages. @default "visible" */
  pageBehavior?: PageBehavior;
  /** Whether the popover is open. Set this and the caller owns it. */
  isOpen?: boolean;
  defaultOpen?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Overrides the locale in force, for a picker that must not follow its surroundings. */
  locale?: string;
  /** Builds the calendar system for an identifier. Injectable so a build can ship fewer of them. */
  createCalendar?: (identifier: CalendarIdentifier) => Calendar;
}

/** State the root hands to its slot, matching React's render props. */
export interface DatePickerRootSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isOpen: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
}

export interface DatePickerTriggerProps {
  class?: string;
}

export interface DatePickerTriggerIndicatorProps {
  class?: string;
}

export interface DatePickerPopoverProps {
  class?: string;
  /** Where the popover sits relative to the group. @default "bottom" */
  placement?: Placement;
  /** Distance along the main axis, between the popover and the group. */
  offset?: number;
  /** Distance along the cross axis. */
  crossOffset?: number;
  /** Whether the popover may flip to the other side when it does not fit. */
  shouldFlip?: boolean;
  /** Distance kept between the popover and the edge of the viewport. */
  containerPadding?: number;
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
}
