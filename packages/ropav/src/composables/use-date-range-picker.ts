import type {DayOfWeek} from "../utils/calendar";
import type {FocusManager} from "../utils/focus";
import type {PageBehavior} from "./use-calendar-state";
import type {DateRangePickerState} from "./use-date-range-picker-state";
import type {FieldIdsContext} from "./use-field-ids";
import type {FormValidationState, ValidationResult} from "./use-form-validation-state";
import type {UsePressHandlers} from "./use-press";
import type {DateValue} from "@internationalized/date";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {datepickerStrings} from "../i18n/datepicker";
import {createFocusManager} from "../utils/focus";

import {useDatePickerGroup} from "./use-date-picker-group";
import {useDescription} from "./use-description";
import {useFieldIds} from "./use-field-ids";
import {DEFAULT_VALIDATION_RESULT, mergeValidation} from "./use-form-validation-state";
import {useId} from "./use-id";
import {useLocale} from "./use-locale";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

export interface UseDateRangePickerOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  minValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  maxValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A plain callback rather than a getter: `toValue` cannot tell a predicate from a getter that
   * returns one, so it would invoke the predicate with no date and use whatever came back.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  /** Whether a range may span a date that is unavailable. */
  allowsNonContiguousRanges?: MaybeRefOrGetter<boolean | undefined>;
  /** Which month the calendar opens on while nothing is chosen yet. */
  placeholderValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  firstDayOfWeek?: MaybeRefOrGetter<DayOfWeek | undefined>;
  pageBehavior?: MaybeRefOrGetter<PageBehavior | undefined>;
  /** The group around both rows of segments and the trigger. A getter: it does not exist yet. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

/** What one of the two date fields nested inside the picker needs from it. */
export interface DateRangePickerFieldOptions {
  ariaLabel: ComputedRef<string>;
  ariaDescribedBy: ComputedRef<string | undefined>;
  ariaLabelledBy: ComputedRef<string | undefined>;
  /**
   * `"presentation"`, always.
   *
   * The picker already carries the group role, its name and its description; a second group role on
   * either row of segments would have a screen reader announce the same thing twice.
   */
  role: "presentation";
  /**
   * The picker's own focus manager, shared by both fields.
   *
   * One row of segments spans *two* fields here, so arrow keys have to move across a boundary
   * neither field can see — which is why the manager belongs to the picker.
   */
  focusManager: FocusManager;
  /** The verdict this end reports through, which the picker merges with the other end's. */
  validationState: FormValidationState;
}

/** What the range calendar inside the popover is driven by. */
export interface DateRangePickerCalendarProps {
  ariaLabel: string;
  autoFocus: boolean;
  value: {start: DateValue; end: DateValue} | null;
  onChange: (value: {start: DateValue; end: DateValue} | null) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  allowsNonContiguousRanges?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid: boolean;
  defaultFocusedValue?: DateValue | null;
  firstDayOfWeek?: DayOfWeek;
  pageBehavior?: PageBehavior;
}

export interface UseDateRangePickerReturn {
  /** Spread with `v-bind` onto the group around both rows of segments. No `on*` key. */
  groupAttrs: ComputedRef<Record<string, unknown>>;
  /** Wire with `@event`, never with `v-bind`. */
  groupHandlers: UsePressHandlers & {
    onKeydown: (event: KeyboardEvent) => void;
    onFocusin: (event: FocusEvent) => void;
    onFocusout: (event: FocusEvent) => void;
  };
  /** Spread onto the button that opens the popover. */
  triggerAttrs: ComputedRef<Record<string, unknown>>;
  /** Whether the button is out of action: a read-only picker has nothing to pick. */
  isTriggerDisabled: ComputedRef<boolean>;
  onTriggerPress: () => void;
  /** Spread onto the popover's dialog element. */
  dialogAttrs: ComputedRef<Record<string, unknown>>;
  /** Bind onto the range calendar inside the popover. */
  calendarProps: ComputedRef<DateRangePickerCalendarProps>;
  startField: DateRangePickerFieldOptions;
  endField: DateRangePickerFieldOptions;
  /** Pass to `provideFieldIdsContext` so the label, description and error message get their ids. */
  fieldIds: FieldIdsContext;
}

/**
 * The behaviour and accessibility wiring for a date range picker.
 *
 * Ported from react-aria's `packages/react-aria/src/datepicker/useDateRangePicker.ts`
 * (react-aria 3.51.0).
 *
 * Where a single picker hands one field its wiring, this hands two — and that is the whole reason
 * the wiring travels at all. One row of segments spans both fields, so the focus manager has to be
 * the picker's; and one value spans both ends, so neither field may reach a verdict of its own.
 * Each reports its browser-level verdict here, and the picker merges the two before either is
 * shown. react-aria smuggles the same things through a module-level `WeakMap` keyed by the state
 * object plus two symbol props; here they are returned for the root to publish through `provide`.
 */
export const useDateRangePicker = (
  options: UseDateRangePickerOptions,
  state: DateRangePickerState,
): UseDateRangePickerReturn => {
  const strings = useLocalizedStringFormatter(datepickerStrings);
  const locale = useLocale();

  const groupId = useId(() => toValue(options.id));
  const triggerId = useId();
  const dialogId = useId();

  /*
   * The trigger is deliberately excluded. It sits inside the group, so a manager that accepted
   * everything focusable would step onto the button on the way from the last segment of one field to
   * the first of the next.
   */
  const focusManager = createFocusManager(() => toValue(options.element), {
    accept: (element) => element.id !== triggerId.value,
  });

  const {
    context: fieldIds,
    describedBy: fieldDescribedBy,
    labelId,
  } = useFieldIds({
    // A group is not a labelable control, so its label cannot be a `label` element — and with
    // nothing to point `for` at, a click on it has to be answered by hand.
    labelElementType: "span",
    onLabelClick: () => focusManager.focusFirst(),
    slots: ["label", "description", "errorMessage"],
  });

  /**
   * The range in words, for a screen reader to read after the picker's own name.
   *
   * The segments read as bare numbers, so the months spelled out are what make them dates.
   */
  const valueDescription = computed(() => {
    const range = state.formatValue(locale.value.locale, {month: "long"});

    return range
      ? strings.value.format("selectedRangeDescription", {
          endDate: range.end,
          startDate: range.start,
        })
      : "";
  });

  const {describedBy: valueDescribedBy} = useDescription(valueDescription);

  const describedBy = computed(
    () =>
      [valueDescribedBy.value, fieldDescribedBy.value, toValue(options.ariaDescribedby)]
        .filter(Boolean)
        .join(" ") || undefined,
  );

  /** The label this picker actually has, which is nothing at all when none was rendered. */
  const ownLabelledBy = computed(
    () => [labelId.value, toValue(options.ariaLabelledby)].filter(Boolean).join(" ") || undefined,
  );

  /**
   * What names the picker: an explicit reference, else its own label, else the group itself.
   *
   * The last fallback looks circular and is upstream's: with no label rendered, the group is named
   * by its own contents, and pointing at itself is what keeps the trigger's name — which is built
   * from this — from being left dangling.
   */
  const labelledBy = computed(() => ownLabelledBy.value || groupId.value);

  const group = useDatePickerGroup({
    element: options.element,
    setOpen: (open) => state.setOpen(open),
  });

  /**
   * Whether focus is somewhere inside the picker, tracked by hand rather than through
   * `useFocusWithin`.
   *
   * Moving between the two fields never left the picker, and neither does opening the popover —
   * focus lands in the calendar, which is not in this subtree at all but is still part of the same
   * picker as far as the caller is concerned.
   */
  let isFocused = false;

  const onFocusin = (event: FocusEvent) => {
    if (isFocused) return;

    isFocused = true;
    options.onFocus?.(event);
    options.onFocusChange?.(true);
  };

  const onFocusout = (event: FocusEvent) => {
    if (!isFocused) return;

    const next = event.relatedTarget;

    if (next instanceof Node) {
      const element = toValue(options.element);

      if (element?.contains(next)) return;
      if (document.getElementById(dialogId.value)?.contains(next)) return;
    }

    isFocused = false;
    options.onBlur?.(event);
    options.onFocusChange?.(false);
  };

  /*
   * The last verdict each end reported. Held rather than derived because a field only ever reports
   * its own half, and the picker has to remember the other one to merge with.
   */
  let startValidation: ValidationResult = DEFAULT_VALIDATION_RESULT;
  let endValidation: ValidationResult = DEFAULT_VALIDATION_RESULT;

  /**
   * A validation state for one end, reporting through the picker's.
   *
   * Only `updateValidation` differs from the picker's own: what a field hands in describes half the
   * value, so it is merged with whatever the other half last said before the picker takes it.
   */
  const fieldValidation = (part: "start" | "end"): FormValidationState => ({
    commitValidation: state.commitValidation,
    displayValidation: state.displayValidation,
    realtimeValidation: state.realtimeValidation,
    resetValidation: state.resetValidation,
    updateValidation: (result) => {
      if (part === "start") startValidation = result;
      else endValidation = result;

      state.updateValidation(mergeValidation(startValidation, endValidation));
    },
    validationBehavior: state.validationBehavior,
  });

  const field = (part: "start" | "end"): DateRangePickerFieldOptions => ({
    ariaDescribedBy: describedBy,
    ariaLabel: computed(() => strings.value.format(part === "start" ? "startDate" : "endDate")),
    ariaLabelledBy: ownLabelledBy,
    focusManager,
    role: "presentation",
    validationState: fieldValidation(part),
  });

  return {
    calendarProps: computed(() => {
      const range = state.dateRange.value;

      return {
        allowsNonContiguousRanges: toValue(options.allowsNonContiguousRanges),
        ariaLabel: strings.value.format("calendar"),
        // The calendar takes focus as it appears: the popover exists to be navigated.
        autoFocus: true,
        // Where to open when nothing is chosen yet. Left alone once something is, so reopening the
        // popover lands on the month the range is in rather than on the placeholder's.
        defaultFocusedValue: range ? undefined : toValue(options.placeholderValue),
        firstDayOfWeek: toValue(options.firstDayOfWeek),
        isDateUnavailable: options.isDateUnavailable,
        isDisabled: toValue(options.isDisabled),
        isInvalid: state.isInvalid.value,
        isReadOnly: toValue(options.isReadOnly),
        maxValue: toValue(options.maxValue),
        minValue: toValue(options.minValue),
        onChange: (value) => state.setDateRange(value ?? {end: null, start: null}),
        pageBehavior: toValue(options.pageBehavior),
        // Only a complete range is worth drawing; a half-typed one is still being typed.
        value: range?.start && range.end ? {end: range.end, start: range.start} : null,
      };
    }),
    dialogAttrs: computed(() => ({
      "aria-labelledby": [triggerId.value, labelledBy.value].filter(Boolean).join(" ") || undefined,
      id: dialogId.value,
    })),
    endField: field("end"),
    fieldIds,
    groupAttrs: computed(() => ({
      "aria-describedby": describedBy.value,
      // Absent rather than `false` while enabled. Upstream writes `null` here, which Vue and React
      // both render as no attribute at all.
      "aria-disabled": toValue(options.isDisabled) || undefined,
      "aria-label": toValue(options.ariaLabel) || undefined,
      "aria-labelledby": labelledBy.value,
      id: groupId.value,
      role: "group",
    })),
    groupHandlers: {...group.handlers, onFocusin, onFocusout, onKeydown: group.onKeydown},
    isTriggerDisabled: computed(
      () => Boolean(toValue(options.isDisabled)) || Boolean(toValue(options.isReadOnly)),
    ),
    onTriggerPress: () => state.setOpen(true),
    startField: field("start"),
    triggerAttrs: computed(() => ({
      "aria-describedby": describedBy.value,
      "aria-expanded": state.isOpen.value,
      "aria-haspopup": "dialog",
      "aria-label": strings.value.format("calendar"),
      "aria-labelledby": [triggerId.value, labelledBy.value].filter(Boolean).join(" ") || undefined,
      id: triggerId.value,
    })),
  };
};
