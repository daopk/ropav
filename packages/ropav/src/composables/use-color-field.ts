import type { ColorFieldState, UseColorFieldStateOptions } from "./use-color-field-state";
import type { FieldIdsContext } from "./use-field-ids";
import type { TextFieldHandlers } from "./use-text-field";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue, watch } from "vue";

import { setFormValue } from "../utils/form-value";

import { useColorFieldState } from "./use-color-field-state";
import { useFormReset } from "./use-form-reset";
import { useFormattedTextField } from "./use-formatted-text-field";
import { useScrollWheel } from "./use-scroll-wheel";
import { useSpinButton } from "./use-spin-button";
import { useTextField } from "./use-text-field";

export interface UseColorFieldOptions extends UseColorFieldStateOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  /** Whether the wheel over a focused field is ignored. */
  isWheelDisabled?: MaybeRefOrGetter<boolean | undefined>;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onKeyup?: (event: KeyboardEvent) => void;
}

export interface UseColorFieldReturn {
  state: ColorFieldState;
  /** Pass to `provideFieldIdsContext`. */
  fieldIds: FieldIdsContext;
  /** Attributes for the input. Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  handlers: TextFieldHandlers;
  /** The input reports its element, which the wheel, reset and validation wiring hang off. */
  registerElement: (element: HTMLInputElement | null) => void;
  element: ComputedRef<HTMLInputElement | null>;
  isDisabled: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  /** Put the input's text back to what the state holds. */
  reassert: () => void;
}

/**
 * Behaviour and accessibility for a hex colour field, ported from React Aria's
 * `packages/react-aria/src/color/useColorField.ts` (react-aria 3.51.0).
 *
 * Built on {@link useTextField} — the control is a plain text input holding `#RRGGBB` — with the
 * spin button layered on for its *keyboard* only. Upstream merges the whole spin button bag in
 * and then nulls out `role` and every `aria-value*` key; the same thing is done here by taking
 * the keyboard and the two state attributes and leaving the rest, because a hex field that
 * announced itself as a spin button would have a screen reader read out the integer `4753399`
 * instead of the colour.
 *
 * @example
 * ```ts
 * const field = useColorField({value: () => props.value, onChange: (c) => emit("change", c)});
 * ```
 */
export const useColorField = (options: UseColorFieldOptions = {}): UseColorFieldReturn => {
  const state = useColorFieldState(options);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));

  const field = useTextField({
    ariaDescribedby: () => toValue(options.ariaDescribedby),
    ariaLabel: () => toValue(options.ariaLabel),
    ariaLabelledby: () => toValue(options.ariaLabelledby),
    autoComplete: "off",
    autoCorrect: "off",
    autoFocus: () => toValue(options.autoFocus),
    form: () => toValue(options.form),
    id: () => toValue(options.id),
    isDisabled,
    isReadOnly,
    isRequired: () => toValue(options.isRequired),
    name: () => toValue(options.name),
    onChange: (value) => {
      // Refused rather than corrected: the text is left as it was, which `beforeinput` has
      // already prevented in every browser that supports it. This is the last line of defence,
      // and `useTextField` puts the rejected text back for us.
      if (state.validate(value)) state.setInputValue(value);
    },
    onFocusChange: options.onFocusChange,
    onKeydown: options.onKeydown,
    onKeyup: options.onKeyup,
    placeholder: () => toValue(options.placeholder),
    // A hex value is not a word, and neither is a half-typed one.
    role: "textbox",
    // Restored by hand below, from the colour rather than from the text.
    skipFormReset: true,
    spellCheck: "false",
    // The state already validates the colour; letting the text field start a second validation
    // over the string would give the same field two verdicts that disagree.
    validationState: state,
    value: () => state.inputValue.value,
  });

  // Narrowed once: `useTextField` allows a textarea, but a colour field only ever renders an
  // input, and everything below wants that type.
  const element = computed(() =>
    field.element.value instanceof HTMLInputElement ? field.element.value : null,
  );

  const spin = useSpinButton({
    isDisabled,
    isReadOnly,
    isRequired: () => toValue(options.isRequired),
    // The whole 24-bit range, because a hex field steps as one integer.
    maxValue: 0xffffff,
    minValue: 0,
    onDecrement: state.decrement,
    onDecrementToMin: state.decrementToMin,
    onIncrement: state.increment,
    onIncrementToMax: state.incrementToMax,
    textValue: () => (state.colorValue.value ? state.colorValue.value.toString("hex") : undefined),
    value: () => (state.colorValue.value ? state.colorValue.value.toHexInt() : undefined),
  });

  /**
   * Put the control's text back to what the state holds, attribute included.
   *
   * Vapor skips writing `value` when the bound value has not changed, and by then the browser has
   * already moved the text — committing normalises the text without necessarily changing the
   * colour, so the write has to be made outright. The attribute goes with it, which is what makes
   * a form reset put the field back rather than blank it. See {@link setFormValue}.
   */
  const reassert = () => {
    setFormValue(element.value, state.inputValue.value);
  };

  watch([element, state.inputValue], reassert, { flush: "post", immediate: true });

  useFormattedTextField(() => element.value, {
    setInputValue: state.setInputValue,
    validate: state.validate,
  });

  useFormReset(field.element, () => state.defaultColorValue.value, state.setColorValue);

  /**
   * Whether the input has focus, which gates the wheel.
   *
   * Upstream reaches for `useFocusWithin` here, but the input is the only focusable thing a
   * colour field has — there is nothing for focus to be *within* — so its own focus and blur
   * answer the question.
   */
  const isFocused = shallowRef(false);

  /**
   * The wheel steps the value, but only while focus is inside and only for a mostly-vertical
   * gesture: a trackpad reports both axes at once, and a sideways scroll past the field is not
   * someone asking to change the colour.
   */
  useScrollWheel(() => element.value, {
    isDisabled: () =>
      Boolean(toValue(options.isWheelDisabled)) ||
      isDisabled.value ||
      isReadOnly.value ||
      !isFocused.value,
    onScroll: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      if (deltaY > 0) state.increment();
      else if (deltaY < 0) state.decrement();
    },
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const all: Record<string, unknown> = {
      ...field.attrs.value,
      // The two keys of the spin button bag that survive upstream's nulling out. They are not on
      // the text field's own bag, so they are added here rather than merged over.
      "aria-disabled": isDisabled.value || undefined,
      "aria-readonly": isReadOnly.value || undefined,
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  const handlers: TextFieldHandlers = {
    onBlur: (event) => {
      isFocused.value = false;
      spin.onBlur();
      state.commit();
      reassert();
      field.handlers.onBlur(event);
    },
    onFocus: (event) => {
      isFocused.value = true;
      spin.onFocus();
      field.handlers.onFocus(event);
    },
    onInput: field.handlers.onInput,
    onKeydown: (event) => {
      spin.onKeydown(event);
      field.handlers.onKeydown(event);
    },
    onKeyup: field.handlers.onKeyup,
  };

  return {
    attrs,
    element,
    fieldIds: field.fieldIds,
    handlers,
    isDisabled,
    isInvalid: field.isInvalid,
    isReadOnly,
    isRequired: field.isRequired,
    reassert,
    registerElement: field.registerElement,
    state,
  };
};
