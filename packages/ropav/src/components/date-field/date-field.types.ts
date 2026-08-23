import type {ValidationBehavior} from "../../composables/use-form-validation-state";
import type {Granularity, MaxGranularity} from "../../utils/date-format";
import type {Calendar, CalendarIdentifier, DateValue} from "@internationalized/date";

export interface DateFieldRootProps {
  class?: string;
  /** Id for the group around the segments, which is what a label points at. */
  id?: string;
  /** The date the field shows. Set this and the caller owns the value. */
  value?: DateValue | null;
  /** The date the field starts with while it owns its own value. */
  defaultValue?: DateValue | null;
  /**
   * A date whose shape the placeholder follows, which is how a field can ask for a time before
   * anything is typed. Defaults to today.
   */
  placeholderValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A prop rather than an emit: the field calls it while validating, and an emit has no answer to
   * give back.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** The smallest part of a date the field shows. Taken from the value when unset. */
  granularity?: Granularity;
  /** The largest part of a date the field shows. @default "year" */
  maxGranularity?: MaxGranularity;
  /** Whether to show a 12 or 24 hour clock. Taken from the locale when unset. */
  hourCycle?: 12 | 24;
  /** Whether the time zone abbreviation is hidden. */
  hideTimeZone?: boolean;
  /** Whether numbers are always padded to two digits. Taken from the locale when unset. */
  shouldForceLeadingZeros?: boolean;
  /** Whether the field stretches to fill its container. */
  fullWidth?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  /** Whether the field reads as invalid regardless of what it holds. */
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
  /** Whether the first segment takes focus as the field appears. */
  autoFocus?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Overrides the locale in force, for a field that must not follow its surroundings. */
  locale?: string;
  /** Builds the calendar system for an identifier. Injectable so a build can ship fewer of them. */
  createCalendar?: (identifier: CalendarIdentifier) => Calendar;
}

/** State the root hands to its slot, matching React's render props. */
export interface DateFieldRootSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
}
