import type {DatePickerState} from "./use-date-picker-state";
import type {FieldIdsContext} from "./use-field-ids";
import type {FormValidationState} from "./use-form-validation-state";
import type {UsePressHandlers} from "./use-press";
import type {FocusManager} from "../utils/focus";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {datepickerStrings} from "../i18n/datepicker";
import {createFocusManager} from "../utils/focus";

import {useDatePickerGroup} from "./use-date-picker-group";
import {useDescription} from "./use-description";
import {useFieldIds} from "./use-field-ids";
import {useId} from "./use-id";
import {useLocale} from "./use-locale";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

export interface UseDatePickerOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  /** The group around the segments and the trigger. A getter: it does not exist yet at setup. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

/** What the date field nested inside the picker needs from it. */
export interface DatePickerFieldOptions {
  /** The field's own id, which is not the group's. */
  id: ComputedRef<string>;
  ariaDescribedBy: ComputedRef<string | undefined>;
  /**
   * `"presentation"`, always.
   *
   * The picker already carries the group role, its name and its description; a second group role
   * on the segments inside would have a screen reader announce the same thing twice.
   */
  role: "presentation";
  /**
   * The picker's own focus manager, shared with the field.
   *
   * A range picker's row of segments spans *two* fields, so arrow keys have to move across a
   * boundary neither field can see — which is why the manager belongs to the picker.
   */
  focusManager: FocusManager;
  /** The picker's validation state, which the field reports through instead of judging itself. */
  validationState: FormValidationState;
}

export interface UseDatePickerReturn {
  /** Spread with `v-bind` onto the group around the segments. Never carries an `on*` key. */
  groupAttrs: ComputedRef<Record<string, unknown>>;
  /** Wire with `@event`, never with `v-bind`. */
  groupHandlers: UsePressHandlers & {onKeydown: (event: KeyboardEvent) => void};
  /** Spread onto the button that opens the popover. */
  triggerAttrs: ComputedRef<Record<string, unknown>>;
  /** Opens the popover. Not disabled here — the button reports that itself. */
  onTriggerPress: () => void;
  /** Spread onto the popover's dialog element. */
  dialogAttrs: ComputedRef<Record<string, unknown>>;
  /** Bind onto the calendar inside the popover. */
  calendarProps: ComputedRef<Record<string, unknown>>;
  field: DatePickerFieldOptions;
  /** Pass to `provideFieldIdsContext` so the label, description and error message get their ids. */
  fieldIds: FieldIdsContext;
}

/**
 * The behaviour and accessibility wiring for a date picker.
 *
 * Ported from react-aria's `packages/react-aria/src/datepicker/useDatePicker.ts`
 * (react-aria 3.51.0).
 *
 * Two things travel *down* into the field rather than being rebuilt there, and both are the reason
 * a picker's segments work with no field root of their own: the focus manager, so arrow keys can
 * cross from one field to the next, and the validation state, so the field's verdict about a date
 * is the picker's. react-aria smuggles both through a module-level `WeakMap` keyed by the state
 * object plus two symbol props; here they are returned for the root to publish through `provide`.
 */
export const useDatePicker = (
  options: UseDatePickerOptions,
  state: DatePickerState,
): UseDatePickerReturn => {
  const strings = useLocalizedStringFormatter(datepickerStrings);
  const locale = useLocale();

  const groupId = useId(() => toValue(options.id));
  const fieldId = useId();
  const triggerId = useId();
  const dialogId = useId();

  const focusManager = createFocusManager(() => toValue(options.element));

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
   * The value in words, for a screen reader to read after the picker's own name.
   *
   * The segments read as bare numbers, so the month spelled out is what makes them a date.
   */
  const valueDescription = computed(() => {
    const date = state.formatValue(locale.value.locale, {month: "long"});

    return date ? strings.value.format("selectedDateDescription", {date}) : "";
  });

  const {describedBy: valueDescribedBy} = useDescription(valueDescription);

  const describedBy = computed(
    () =>
      [valueDescribedBy.value, fieldDescribedBy.value, toValue(options.ariaDescribedby)]
        .filter(Boolean)
        .join(" ") || undefined,
  );

  /**
   * What names the picker: an explicit reference, else its own label, else the group itself.
   *
   * The last fallback looks circular and is upstream's: with no label rendered, the group is named
   * by its own contents, and pointing at itself is what keeps the trigger's name — which is built
   * from this — from being left dangling.
   */
  const labelledBy = computed(
    () => toValue(options.ariaLabelledby) || labelId.value || groupId.value,
  );

  const group = useDatePickerGroup({
    element: options.element,
    setOpen: (open) => state.setOpen(open),
  });

  return {
    calendarProps: computed(() => ({
      "aria-label": strings.value.format("calendar"),
      // The calendar takes focus as it appears: the popover exists to be navigated.
      autoFocus: true,
      isDisabled: toValue(options.isDisabled),
      isInvalid: state.isInvalid.value,
      isReadOnly: toValue(options.isReadOnly),
      value: state.dateValue.value,
    })),
    dialogAttrs: computed(() => ({
      "aria-labelledby": [triggerId.value, labelledBy.value].filter(Boolean).join(" ") || undefined,
      id: dialogId.value,
    })),
    field: {
      ariaDescribedBy: describedBy,
      focusManager,
      id: fieldId,
      role: "presentation",
      validationState: state,
    },
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
    groupHandlers: {...group.handlers, onKeydown: group.onKeydown},
    onTriggerPress: () => state.setOpen(true),
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
