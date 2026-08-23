import type { FocusManager } from "../utils/focus";
import type { DateFieldState } from "./use-date-field-state";
import type { FieldIdsContext } from "./use-field-ids";
import type { UsePressHandlers } from "./use-press";
import type { TimeFieldState } from "./use-time-field-state";
import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";

import { computed, toValue, watch, watchEffect } from "vue";

import { datepickerStrings } from "../i18n/datepicker";
import { createFocusManager } from "../utils/focus";
import { setFormValue } from "../utils/form-value";

import { useDatePickerGroup } from "./use-date-picker-group";
import { useDescription } from "./use-description";
import { useFieldIds } from "./use-field-ids";
import { useFormReset } from "./use-form-reset";
import { useFormValidation } from "./use-form-validation";
import { useId } from "./use-id";
import { useFocusWithin } from "./use-interaction-states";
import { useLocalizedStringFormatter } from "./use-localized-string-formatter";

/** What a segment needs from the field it belongs to. */
export interface DateFieldSegmentInfo {
  /** Moves focus along the row of segments. Shared with the picker above, when there is one. */
  focusManager: FocusManager;
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledBy: ComputedRef<string | undefined>;
  ariaDescribedBy: ComputedRef<string | undefined>;
}

export interface UseDateFieldOptions {
  state: DateFieldState;
  /** The group element around the segments. A getter, because it does not exist yet at setup. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** The hidden input a form submits and the browser validates against. */
  inputElement: Ref<HTMLInputElement | null | undefined>;
  /**
   * What that input carries, when it is not the field's own value. A time field holds a whole date
   * internally so the segment machinery has something to work with; a form gets the time alone.
   */
  inputValue?: MaybeRefOrGetter<string | undefined>;
  /** Id for the group around the segments, which is where React puts a field's own id too. */
  id?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledBy?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedBy?: MaybeRefOrGetter<string | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * `"presentation"` for a field nested in a picker.
   *
   * The picker already carries the group role, its label and its description, and the segments are
   * already labelled by all of it, so a second group there would be announced twice over.
   */
  role?: MaybeRefOrGetter<"group" | "presentation" | undefined>;
  /** A focus manager belonging to a picker whose row of segments spans two fields. */
  focusManager?: FocusManager;
  /** Opens the overlay a picker owns, so Alt with an arrow reaches it from the field. */
  setOpen?: (open: boolean) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

export interface UseDateFieldReturn {
  /** Pass to `provideFieldIdsContext`. */
  fieldIds: FieldIdsContext;
  /** Attributes for the group around the segments. Spread with `v-bind`. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Inline styles for the group, which keep the segments in their own bidi run. */
  style: ComputedRef<Record<string, string>>;
  /** Attributes for the hidden input a form reads. */
  inputAttrs: ComputedRef<Record<string, unknown>>;
  segment: DateFieldSegmentInfo;
  onKeydown: (event: KeyboardEvent) => void;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  /** Press listeners for the group. Attach each one statically, never through `v-bind`. */
  handlers: UsePressHandlers;
  /** Clicking a label that names a group has to put focus somewhere itself. */
  onLabelClick: () => void;
  isFocusWithin: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  validationErrors: ComputedRef<string[]>;
  validationDetails: ComputedRef<ValidityState>;
}

/**
 * Behaviour and accessibility for a date field: the group around the segments, the hidden input a
 * form reads, and the labelling every segment repeats.
 *
 * Ported from React Aria's `packages/react-aria/src/datepicker/useDateField.ts`
 * (react-aria 3.51.0).
 *
 * React passes the labelling and the focus manager down to the segments through a module-level
 * `WeakMap` keyed by the state, plus two string keys standing in for symbols. Here they are
 * returned as `segment` instead, for the field to publish however it likes — which is what lets a
 * picker's segments work with no field root of their own above them.
 */
export const useDateField = (options: UseDateFieldOptions): UseDateFieldReturn => {
  const { state } = options;
  const isPresentation = computed(() => toValue(options.role) === "presentation");

  const {
    context: fieldIds,
    describedBy: fieldDescribedBy,
    labelId,
  } = useFieldIds({
    // A group is not a labelable control, so its label cannot be a `label` element.
    labelElementType: "span",
    // And with nothing to point `for` at, clicking it has to be answered by hand.
    onLabelClick: () => focusManager.focusFirst(),
    slots: ["label", "description", "errorMessage"],
  });

  const focusManager = options.focusManager ?? createFocusManager(() => toValue(options.element));
  const group = useDatePickerGroup({
    disableArrowNavigation: isPresentation,
    element: options.element,
    setOpen: options.setOpen,
  });

  const groupId = useId(() => toValue(options.id));
  const strings = useLocalizedStringFormatter(datepickerStrings);

  /**
   * The value in words, for a screen reader to read after the field's own name.
   *
   * Written out in full rather than left to the segments: "6/5/2026" read segment by segment is
   * three numbers, and the month spelled out is what makes it a date.
   */
  const valueDescription = computed(() => {
    if (!state.value.value) return "";

    const isTime = state.maxGranularity.value === "hour";

    return strings.value.format(isTime ? "selectedTimeDescription" : "selectedDateDescription", {
      [isTime ? "time" : "date"]: state.formatValue({ month: "long" }),
    });
  });

  const { describedBy: valueDescribedBy } = useDescription(valueDescription);

  const ownDescribedBy = computed(() => {
    const ids = [fieldDescribedBy.value, toValue(options.ariaDescribedBy)].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  /*
   * Inside a picker the description is the picker's, and it already names the whole value — so the
   * field's own value description is left out rather than said twice.
   */
  const describedBy = computed(() => {
    if (isPresentation.value) return ownDescribedBy.value;

    const ids = [valueDescribedBy.value, ownDescribedBy.value].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  const labelledBy = computed(() => {
    const ids = [labelId.value, toValue(options.ariaLabelledBy)].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  /*
   * No `isDisabled` here on purpose: this flag is only ever read to decide whether focus entered or
   * left, and a disabled field cannot be focused at all.
   */
  const focusWithin = useFocusWithin();

  /** What the field held when focus arrived, so leaving it can tell whether anything changed. */
  let valueOnFocus = state.value.value;

  const onFocusin = (event: FocusEvent) => {
    const wasWithin = focusWithin.isFocusWithin.value;

    focusWithin.onFocusin();

    // Focus moving from one segment to the next never left the field.
    if (wasWithin) return;

    valueOnFocus = state.value.value;
    options.onFocus?.(event);
    options.onFocusChange?.(true);
  };

  const onFocusout = (event: FocusEvent) => {
    const wasWithin = focusWithin.isFocusWithin.value;

    focusWithin.onFocusout(event);

    if (!wasWithin || focusWithin.isFocusWithin.value) return;

    // Leaving the field is what settles a complete-but-impossible date, and only a value that
    // actually moved is worth revealing an error about.
    state.confirmPlaceholder();
    if (state.value.value !== valueOnFocus) state.commitValidation();

    options.onBlur?.(event);
    options.onFocusChange?.(false);
  };

  /*
   * One source for the string the hidden input carries, because two would drift: a time field
   * overrides it, and a watcher reading `state.value` directly would then re-assert a whole date
   * over the time a form is supposed to receive.
   */
  const inputValue = computed(
    () => toValue(options.inputValue) ?? state.value.value?.toString() ?? "",
  );

  useFormReset(options.inputElement, state.defaultValue, state.setValue);

  /*
   * Keep the input's reset source in step. Under native behaviour this is a real control —
   * `type="text"` plus the `hidden` attribute, so that an empty required field can stop a submit —
   * and a real control is restored from its default, which a binding never writes. Under `"aria"`
   * it is `type="hidden"`, which has no reset algorithm at all, so the write is merely harmless.
   *
   * Not in the `reset` listener above: the browser drains microtasks between dispatching `reset`
   * and restoring the controls, so a write made from there lands too early. See {@link setFormValue}.
   */
  watch([options.inputElement, inputValue], ([input, text]) => setFormValue(input, text), {
    flush: "post",
    immediate: true,
  });
  useFormValidation(options.inputElement, state, { focus: () => focusManager.focusFirst() });

  /*
   * Once, on the way in. React keeps the flag in a ref and clears it after the first effect; a
   * post-flush effect that disarms itself is the same thing, and the element exists by then.
   */
  let pendingAutoFocus = true;

  watchEffect(
    () => {
      if (!pendingAutoFocus) return;

      pendingAutoFocus = false;
      if (toValue(options.autoFocus)) focusManager.focusFirst();
    },
    { flush: "post" },
  );

  const attrs = computed<Record<string, unknown>>(() => {
    /*
     * A presentational field carries its id and nothing else. Upstream filters the field's props
     * down to the DOM ones before merging them in, and `id` is the only one that survives: a
     * picker hands its field an id, a range picker's two fields are given none, and then there is
     * none to render.
     */
    if (isPresentation.value) {
      const ownId = toValue(options.id);

      return ownId ? { id: ownId, role: "presentation" } : { role: "presentation" };
    }

    const all: Record<string, unknown> = {
      "aria-describedby": describedBy.value,
      "aria-disabled": toValue(options.isDisabled) || undefined,
      "aria-label": toValue(options.ariaLabel),
      "aria-labelledby": labelledBy.value,
      id: groupId.value,
      role: "group",
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  const inputAttrs = computed<Record<string, unknown>>(() => {
    const isNative = state.validationBehavior.value === "native";
    const all: Record<string, unknown> = {
      disabled: toValue(options.isDisabled) || undefined,
      form: toValue(options.form),
      /*
       * A text input kept hidden rather than `type="hidden"`, under native behaviour: only a real
       * control takes part in constraint validation, so only this way does an empty required field
       * stop the form from submitting.
       */
      hidden: isNative || undefined,

      name: toValue(options.name),
      required: (isNative && toValue(options.isRequired)) || undefined,
      type: isNative ? "text" : "hidden",
      value: inputValue.value,
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  return {
    attrs,
    fieldIds,
    handlers: group.handlers,
    inputAttrs,
    isFocusWithin: focusWithin.isFocusWithin,
    isInvalid: computed(() => state.displayValidation.value.isInvalid),
    onFocusin,
    onFocusout,
    onKeydown: group.onKeydown,
    onLabelClick: () => focusManager.focusFirst(),
    segment: {
      ariaDescribedBy: describedBy,
      ariaLabel: computed(() => toValue(options.ariaLabel)),
      ariaLabelledBy: labelledBy,
      focusManager,
    },
    // A field of segments reads left to right even inside right-to-left text, so it is isolated
    // from whatever surrounds it.
    style: computed(() => ({ unicodeBidi: "isolate" })),
    validationDetails: computed(() => state.displayValidation.value.validationDetails),
    validationErrors: computed(() => state.displayValidation.value.validationErrors),
  };
};

export interface UseTimeFieldOptions extends Omit<UseDateFieldOptions, "state"> {
  state: TimeFieldState;
}

/**
 * The same field, submitting a time rather than a date.
 *
 * Ported from React Aria's `useTimeField`. A time field carries a date internally so the segment
 * machinery has something whole to work with; what a form receives has to be the time alone.
 */
export const useTimeField = (options: UseTimeFieldOptions): UseDateFieldReturn =>
  useDateField({
    ...options,
    inputValue: () => options.state.timeValue.value?.toString() ?? "",
  });
