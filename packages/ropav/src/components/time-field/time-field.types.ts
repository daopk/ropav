import type {ValidationBehavior} from "../../composables/use-form-validation-state";
import type {TimeGranularity} from "../../composables/use-time-field-state";
import type {TimeValue} from "../../utils/date-format";

export interface TimeFieldRootProps {
  class?: string;
  /** Id for the group around the segments, which is what a label points at. */
  id?: string;
  /** The time the field shows. Set this and the caller owns the value. */
  value?: TimeValue | null;
  /** The time the field starts with while it owns its own value. */
  defaultValue?: TimeValue | null;
  /** A time whose shape the placeholder follows. Defaults to midnight. */
  placeholderValue?: TimeValue | null;
  minValue?: TimeValue | null;
  maxValue?: TimeValue | null;
  /** The smallest part of a time the field shows. @default "minute" */
  granularity?: TimeGranularity;
  /** Whether to show a 12 or 24 hour clock. Taken from the locale when unset. */
  hourCycle?: 12 | 24;
  /** Whether the time zone abbreviation is hidden. */
  hideTimeZone?: boolean;
  /** Whether the hour is always padded to two digits. Taken from the locale when unset. */
  shouldForceLeadingZeros?: boolean;
  /** Whether the field stretches to fill its container. */
  fullWidth?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  /** Whether the field reads as invalid regardless of what it holds. */
  isInvalid?: boolean;
  /** Extra rule the value has to satisfy, beyond the range. */
  validate?: (value: TimeValue | null) => string | string[] | true | null | undefined;
  /** Whether errors go through the browser or through ARIA alone. @default "native" */
  validationBehavior?: ValidationBehavior;
  /** Name the value is submitted under. */
  name?: string;
  /** Id of the form the value belongs to, when it is not an ancestor. */
  form?: string;
  /** Whether the first segment takes focus as the field appears. */
  autoFocus?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Overrides the locale in force, for a field that must not follow its surroundings. */
  locale?: string;
}

/** State the root hands to its slot, matching React's render props. */
export interface TimeFieldRootSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
}
