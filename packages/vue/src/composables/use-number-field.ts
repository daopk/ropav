import type {FieldIdsContext} from "./use-field-ids";
import type {
  NumberFieldCommitBehavior,
  NumberFieldState,
  UseNumberFieldStateOptions,
} from "./use-number-field-state";
import type {SpinStepperHandlers} from "./use-spin-button";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {NumberFormatter} from "@internationalized/number";
import {computed, nextTick, shallowRef, toValue, watch} from "vue";

import {announce} from "../utils/live-announcer";
import {isAndroid, isIOS, isIPhone} from "../utils/platform";

import {useFieldIds} from "./use-field-ids";
import {useFormReset} from "./use-form-reset";
import {useFormattedTextField} from "./use-formatted-text-field";
import {useId} from "./use-id";
import {useLocale} from "./use-locale";
import {useNumberFieldState} from "./use-number-field-state";
import {useScrollWheel} from "./use-scroll-wheel";
import {useSpinButton} from "./use-spin-button";

/** What a stepper button gets from the field, kept apart from its listeners. */
export interface NumberFieldStepper {
  /** Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Wire with `@event`, never with `v-bind`. */
  handlers: SpinStepperHandlers;
  /** Whether the value can move any further in this direction. */
  isDisabled: ComputedRef<boolean>;
}

export interface UseNumberFieldOptions extends UseNumberFieldStateOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  /** Lands on a hidden input rather than the visible one, which carries formatted text. */
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  /** Overrides the name the increment button announces. */
  incrementAriaLabel?: MaybeRefOrGetter<string | undefined>;
  /** Overrides the name the decrement button announces. */
  decrementAriaLabel?: MaybeRefOrGetter<string | undefined>;
  /** Whether the wheel over a focused field is ignored. */
  isWheelDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * State built elsewhere, for a field whose number is a view of something else.
   *
   * A colour channel field is the case this exists for: the number it edits is one channel of a
   * colour, so the state has to be built on top of the colour and then handed down — letting
   * this composable start a second state over the same number would give the field two values
   * that disagree. Same escape hatch as `validationState` on {@link useTextField}.
   */
  state?: NumberFieldState;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onKeyup?: (event: KeyboardEvent) => void;
}

export interface UseNumberFieldReturn {
  state: NumberFieldState;
  /** Pass to `provideFieldIdsContext`. */
  fieldIds: FieldIdsContext;
  /** Attributes for the input. Spread with `v-bind`. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Attributes for the group around the input and the buttons. */
  groupAttrs: ComputedRef<Record<string, unknown>>;
  /** The input reports its element, which the wheel, reset and validation wiring hang off. */
  registerElement: (element: HTMLInputElement | null) => void;
  element: ComputedRef<HTMLInputElement | null>;
  increment: NumberFieldStepper;
  decrement: NumberFieldStepper;
  onInput: (event: Event) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onKeyup: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
  onFocusin: () => void;
  onFocusout: (event: FocusEvent) => void;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  /** Whether focus is anywhere inside the group. Gates the wheel, and the hover fill. */
  isFocusWithin: ComputedRef<boolean>;
  /** Put the input's text back to what the state holds. */
  reassert: () => void;
}

/** A number input kept off-document, used only to borrow the browser's range validation. */
let rangeProbe: HTMLInputElement | null = null;

/**
 * Behaviour and accessibility for a number field, ported from React Aria's
 * `packages/react-aria/src/numberfield/useNumberField.ts` (react-aria 3.51.0).
 *
 * The visible control is a plain text input, not `type="number"`: a number input cannot hold a
 * currency symbol, a percent sign or grouping separators, and the field's whole point is that it
 * can. Everything a number input would have given for free is put back by hand — the spin button
 * semantics, the software keyboard choice, and range validation, which is borrowed from a real
 * number input kept off-document so the browser's own message is what the user reads.
 *
 * @example
 * ```ts
 * const field = useNumberField({value: () => props.value, step: () => props.step});
 * ```
 */
export const useNumberField = (options: UseNumberFieldOptions = {}): UseNumberFieldReturn => {
  const element = shallowRef<HTMLInputElement | null>(null);

  const registerElement = (next: HTMLInputElement | null) => {
    element.value = next;
  };

  const state = options.state ?? useNumberFieldState(options);

  const inputId = useId(() => toValue(options.id));
  const incrementId = useId();
  const decrementId = useId();

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const isRequired = computed(() => Boolean(toValue(options.isRequired)));

  const isInvalid = computed(() => state.displayValidation.value.isInvalid);

  const {
    context: fieldIds,
    describedBy,
    labelId,
  } = useFieldIds({
    labelFor: inputId,
    slots: ["label", "description", "errorMessage"],
  });

  const formatOptions = computed(() => toValue(options.formatOptions));
  const resolvedLocale = useLocale();
  const locale = computed(() => toValue(options.locale) ?? resolvedLocale.value.locale);

  /**
   * How the value is read out, which is not always how it is written.
   *
   * Accounting notation writes a negative amount in brackets, and a screen reader has no way to
   * say that. The announced text drops the notation so the minus sign is there to be read.
   */
  const textValue = computed(() => {
    if (Number.isNaN(state.numberValue.value)) return "";

    return new NumberFormatter(locale.value, {
      ...formatOptions.value,
      currencySign: undefined,
    }).format(state.numberValue.value);
  });

  const spin = useSpinButton({
    isDisabled,
    isReadOnly,
    isRequired,
    maxValue: state.maxValue,
    minValue: state.minValue,
    onDecrement: state.decrement,
    onDecrementToMin: state.decrementToMin,
    onIncrement: state.increment,
    onIncrementToMax: state.incrementToMax,
    textValue,
    value: state.numberValue,
  });

  const reassert = () => {
    const input = element.value;

    if (input && input.value !== state.inputValue.value) input.value = state.inputValue.value;
  };

  // Vapor skips writing `value` when the bound value has not changed, and by then the browser has
  // already moved the text. Committing normalises the text without necessarily changing the
  // number, so the write has to be made outright.
  watch(state.inputValue, reassert, {flush: "post"});

  /**
   * Normalise the text and say what it became.
   *
   * The announcement is conditional on the text actually changing, which is what keeps a screen
   * reader from repeating the same amount every time focus leaves the field.
   */
  const commitAndAnnounce = () => {
    const before = element.value?.value ?? "";

    state.commit();
    reassert();

    const after = element.value?.value ?? "";

    if (after !== before) announce(after);
  };

  const isFocusWithinState = shallowRef(false);
  const isFocusWithin = computed(() => isFocusWithinState.value);

  const onFocusin = () => {
    if (isDisabled.value) return;
    isFocusWithinState.value = true;
  };

  const onFocusout = (event: FocusEvent) => {
    const currentTarget = event.currentTarget as Node | null;
    const next = event.relatedTarget as Node | null;

    // Focus moving between the input and a stepper button never leaves the group.
    if (currentTarget && next && currentTarget.contains(next)) return;

    isFocusWithinState.value = false;
  };

  /**
   * The wheel steps the value, but only while focus is inside and only for a mostly-vertical
   * gesture: a trackpad reports both axes at once, and a sideways scroll past the field is not
   * someone asking to change the number.
   */
  useScrollWheel(element, {
    isDisabled: () =>
      Boolean(toValue(options.isWheelDisabled)) ||
      isDisabled.value ||
      isReadOnly.value ||
      !isFocusWithin.value,
    onScroll: ({deltaX, deltaY}) => {
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      if (deltaY > 0) state.increment();
      else if (deltaY < 0) state.decrement();
    },
  });

  useFormattedTextField(element, {
    setInputValue: state.setInputValue,
    validate: state.validate,
  });

  useFormReset(
    element,
    () => state.defaultNumberValue.value,
    (value) => {
      state.setNumberValue(value);
      // A tick later, on purpose. The `reset` event is dispatched *before* the browser puts the
      // controls back, so a write from inside the listener is thrown away — and the browser has
      // nothing to put back, because a Vapor binding writes `value` as a property and never as
      // an attribute. With the state already holding the default nothing changes either, so no
      // binding write follows and the field would be left empty. Measured, not assumed.
      void nextTick(reassert);
    },
  );

  /**
   * Range validation borrowed from a real number input.
   *
   * The point is the message: a browser writes "Value must be less than or equal to 10" in the
   * user's own language, and reimplementing that would mean shipping translations for something
   * the platform already has. A detached `type="number"` input is given the same min, max, step
   * and value, and its verdict is merged with the visible input's own.
   *
   * Only under `"validate"` commit behaviour — under `"snap"` the value is pulled into range on
   * commit, so there is nothing out of range left to complain about.
   */
  watch(
    [
      element,
      () => toValue(options.commitBehavior),
      state.minValue,
      state.maxValue,
      () => toValue(options.step),
      state.numberValue,
      state.inputValue,
    ],
    () => {
      const input = element.value;

      if (toValue(options.commitBehavior) !== "validate") return;
      // Read rather than watched: feeding the verdict back in changes this, and tracking it
      // would make the watcher retrigger itself. React runs the same guard every render.
      if (state.realtimeValidation.value.isInvalid) return;
      if (!input || input.disabled) return;

      if (!rangeProbe && typeof document !== "undefined") {
        rangeProbe = document.createElement("input");
        rangeProbe.type = "number";
      }

      if (!rangeProbe) return;

      const min = state.minValue.value;
      const max = state.maxValue.value;
      const step = toValue(options.step);
      const value = state.numberValue.value;

      rangeProbe.min = min != null && !Number.isNaN(min) ? String(min) : "";
      rangeProbe.max = max != null && !Number.isNaN(max) ? String(max) : "";
      rangeProbe.step = step != null && !Number.isNaN(step) ? String(step) : "";
      rangeProbe.value = value != null && !Number.isNaN(value) ? String(value) : "";

      const valid = input.validity.valid && rangeProbe.validity.valid;
      const message = input.validationMessage || rangeProbe.validationMessage;

      state.updateValidation({
        isInvalid: !valid,
        validationDetails: {
          badInput: input.validity.badInput,
          customError: input.validity.customError,
          patternMismatch: input.validity.patternMismatch,
          rangeOverflow: rangeProbe.validity.rangeOverflow,
          rangeUnderflow: rangeProbe.validity.rangeUnderflow,
          stepMismatch: rangeProbe.validity.stepMismatch,
          tooLong: input.validity.tooLong,
          tooShort: input.validity.tooShort,
          typeMismatch: input.validity.typeMismatch,
          valid,
          valueMissing: input.validity.valueMissing,
        },
        validationErrors: message ? [message] : [],
      });

      if (state.validationBehavior.value === "native" && !rangeProbe.validity.valid) {
        input.setCustomValidity(rangeProbe.validationMessage);
      }
    },
    {flush: "post", immediate: true},
  );

  /**
   * Which software keyboard a touch device offers.
   *
   * There is no way to ask for "a number pad with both a minus and a decimal point"; each
   * platform leaves out something different, so the mode is chosen by what the field actually
   * needs. An iPhone has no minus in either numeric or decimal, so a field that accepts negative
   * numbers has to fall back to the full keyboard.
   */
  const inputMode = computed(() => {
    const resolved = new NumberFormatter(locale.value, formatOptions.value).resolvedOptions();
    const hasDecimals = (resolved.maximumFractionDigits ?? 0) > 0;
    const min = state.minValue.value;
    const hasNegative = min === undefined || Number.isNaN(min) || min < 0;

    if (isIPhone()) {
      if (hasNegative) return "text";
      if (hasDecimals) return "decimal";

      return "numeric";
    }

    if (isAndroid()) {
      // Android's numeric pad has both a decimal point and a minus; its decimal pad has no minus.
      if (hasNegative) return "numeric";
      if (hasDecimals) return "decimal";
    }

    return "numeric";
  });

  const onInput = (event: Event) => {
    const input = event.target as HTMLInputElement | null;

    if (!input) return;

    // Refused rather than corrected: the text is left as it was, which `beforeinput` has already
    // prevented in every browser that supports it. This is the last line of defence.
    if (state.validate(input.value)) {
      state.setInputValue(input.value);

      return;
    }

    reassert();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!isDisabled.value && !isReadOnly.value && event.key === "Enter") {
      // Not prevented: Enter in a single-line field is also how the surrounding form is
      // submitted, and the commit has to happen before that rather than instead of it.
      state.commit();
      reassert();
      state.commitValidation();
    }

    spin.onKeydown(event);
    options.onKeydown?.(event);
  };

  const onKeyup = (event: KeyboardEvent) => {
    options.onKeyup?.(event);
  };

  const onFocus = (event: FocusEvent) => {
    spin.onFocus();
    onFocusin();
    options.onFocusChange?.(true);
    void event;
  };

  const onBlur = (event: FocusEvent) => {
    spin.onBlur();
    commitAndAnnounce();
    options.onFocusChange?.(false);
    void event;
  };

  /**
   * Paste is handled only when it replaces the whole field.
   *
   * Anything else would mean working out what the pasted text does to the string around it, and
   * where the caret ends up in the result — which is where this kind of code goes wrong. A
   * partial paste is left to `beforeinput`, which already refuses what cannot be a number.
   */
  const onPaste = (event: ClipboardEvent) => {
    const input = event.target as HTMLInputElement | null;

    if (!input) return;

    const selected = (input.selectionEnd ?? -1) - (input.selectionStart ?? 0);

    if (selected !== input.value.length) return;

    event.preventDefault();
    state.commit(event.clipboardData?.getData("text/plain")?.trim() ?? "");
    reassert();
  };

  const fieldLabel = computed(() => toValue(options.ariaLabel) ?? "");

  /**
   * What the stepper buttons point at for their name.
   *
   * With a name of its own the field puts it straight into the button's label, which leaves a
   * translator free to word "Increase X" however the language wants. Only when the name lives in
   * another element does the button fall back to a chain of ids.
   */
  const stepperLabelledby = computed(() => {
    if (fieldLabel.value) return undefined;

    return labelId.value ?? toValue(options.ariaLabelledby);
  });

  const stepperAttrs = (
    kind: "decrement" | "increment",
    ownId: ComputedRef<string>,
    override: () => string | undefined,
  ) =>
    computed<Record<string, unknown>>(() => {
      const verb = kind === "increment" ? "Increase" : "Decrease";
      const custom = override();
      const chain = stepperLabelledby.value;

      const all: Record<string, unknown> = {
        "aria-controls": inputId.value,
        "aria-label": custom ?? (fieldLabel.value ? verb + " " + fieldLabel.value : verb),
        "aria-labelledby": chain && !custom ? ownId.value + " " + chain : undefined,
        id: chain && !custom ? ownId.value : undefined,
        // Out of the tab order on purpose: the field itself takes the arrow keys, so a tab stop
        // on each button would put two extra stops in front of every number on a form.
        tabindex: -1,
      };

      for (const key of Object.keys(all)) {
        if (all[key] === undefined) delete all[key];
      }

      return all;
    });

  const increment: NumberFieldStepper = {
    attrs: stepperAttrs("increment", incrementId, () => toValue(options.incrementAriaLabel)),
    handlers: spin.increment,
    isDisabled: computed(() => !state.canIncrement.value),
  };

  const decrement: NumberFieldStepper = {
    attrs: stepperAttrs("decrement", decrementId, () => toValue(options.decrementAriaLabel)),
    handlers: spin.decrement,
    isDisabled: computed(() => !state.canDecrement.value),
  };

  const isNativeBehavior = computed(() => state.validationBehavior.value === "native");

  const resolvedLabelledby = computed(() => {
    const own = [labelId.value, toValue(options.ariaLabelledby)].filter(Boolean).join(" ");

    if (!own) return undefined;

    return toValue(options.ariaLabel) ? [inputId.value, own].join(" ") : own;
  });

  const resolvedDescribedby = computed(() => {
    const ids = [describedBy.value, toValue(options.ariaDescribedby)].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const all: Record<string, unknown> = {
      "aria-describedby": resolvedDescribedby.value,
      "aria-disabled": isDisabled.value || undefined,
      "aria-invalid": isInvalid.value || undefined,
      "aria-label": toValue(options.ariaLabel),
      "aria-labelledby": resolvedLabelledby.value,
      "aria-readonly": isReadOnly.value || undefined,
      // Under native behaviour the browser refuses the submit, so saying it twice would have a
      // screen reader announce a requirement the attribute already carries.
      "aria-required": (isRequired.value && !isNativeBehavior.value) || undefined,
      // Skipped on iOS: VoiceOver reads the role description instead of the required state, so
      // the more useful of the two wins.
      "aria-roledescription": isIOS() ? undefined : "Number field",
      autocomplete: "off",
      autocorrect: "off",
      disabled: isDisabled.value || undefined,
      id: inputId.value,
      inputmode: inputMode.value,
      readonly: isReadOnly.value || undefined,
      required: (isRequired.value && isNativeBehavior.value) || undefined,
      spellcheck: "false",
      // Written even though a native input is already tabbable: Safari does not focus one unless
      // an explicit tab index says so, which is the reason react-aria always sets it — the chain
      // here is `useNumberField` → `useFormattedTextField` → `useTextField` → `useFocusable`. A
      // disabled field should not be reachable at all, so it gets none and the sweep below drops
      // the key. The steppers stay at -1, set on their own attrs.
      tabindex: isDisabled.value ? undefined : 0,
      // Text, not number: a number input cannot hold a currency symbol or a grouping separator,
      // and rejects the very strings this field exists to accept.
      type: "text",
      value: state.inputValue.value,
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  const groupAttrs = computed<Record<string, unknown>>(() => {
    const all: Record<string, unknown> = {
      "aria-disabled": isDisabled.value || undefined,
      "aria-invalid": isInvalid.value || undefined,
      role: "group",
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  return {
    attrs,
    decrement,
    element: computed(() => element.value),
    fieldIds,
    groupAttrs,
    increment,
    isDisabled,
    isFocusWithin,
    isInvalid,
    isReadOnly,
    isRequired,
    onBlur,
    onFocus,
    onFocusin,
    onFocusout,
    onInput,
    onKeydown,
    onKeyup,
    onPaste,
    reassert,
    registerElement,
    state,
  };
};

export type {NumberFieldCommitBehavior, NumberFieldState};
