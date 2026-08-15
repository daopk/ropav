import type {FieldIdsContext} from "./use-field-ids";
import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

import {createContext} from "../utils/create-context";
import {setFormValue} from "../utils/form-value";

import {useControllableState} from "./use-controllable-state";
import {useFieldIds} from "./use-field-ids";
import {useFormReset} from "./use-form-reset";
import {useFormValidation} from "./use-form-validation";
import {useFormValidationState} from "./use-form-validation-state";
import {useId} from "./use-id";

/** The two elements a text field can render its control as. */
export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Listeners the control wires one by one with `@event`.
 *
 * Kept apart from the attributes on purpose. Vapor re-applies every `on*` key arriving
 * through `v-bind` on each render and drops the previous listener as the render effect
 * cleans up — which loses a handler mid-dispatch on exactly the element that re-renders in
 * response to the events it is listening for.
 */
export interface TextFieldHandlers {
  onInput: (event: Event) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onKeyup: (event: KeyboardEvent) => void;
}

/**
 * What a field root hands down to whichever control renders inside it.
 *
 * Lives with the composable rather than with a component, because both `TextField` and
 * `SearchField` provide it and `Input`, `TextArea` and `InputGroup` all consume it — routing
 * that through a component directory would make those depend on each other.
 *
 * Loose: a bare `<Input>` outside any field is legal, exactly as it is in React.
 */
export interface TextFieldControlContext {
  /** Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Wire with `@event`, never with `v-bind`. */
  handlers: TextFieldHandlers;
  /** The control reports its element, which the browser wiring hangs off. */
  registerElement: (element: TextFieldElement | null) => void;
  /**
   * Declared by a control that supplies its own `value`, which makes the caller the owner of it.
   * The field then stops writing the element at all — the live text *and* the reset source — because
   * two owners of one value fight over it, and the control's prop is the one that wins by design.
   */
  setValueOwned: (owned: boolean) => void;
  isDisabled: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
}

export const [useTextFieldControlContext, provideTextFieldControlContext] =
  createContext<TextFieldControlContext | null>({
    defaultValue: null,
    name: "TextFieldControlContext",
    strict: false,
  });

export interface UseTextFieldOptions {
  /** Controlled value. Present at all puts the caller in charge of it. */
  value?: MaybeRefOrGetter<string | undefined>;
  /** Value the field starts with, and goes back to when the form is reset. */
  defaultValue?: MaybeRefOrGetter<string | undefined>;
  onChange?: (value: string) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Controlled validity. Present at all — `true` *or* `false` — pins the field and shadows
   * `validate`, server errors and the browser alike.
   */
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<string> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /**
   * Validation built elsewhere, for a field whose value is not really a string. A number
   * field validates the number it parsed, so letting this composable start a second state
   * over the text would give the same field two verdicts that disagree.
   */
  validationState?: FormValidationState;
  /**
   * Whether leaving the field reveals its errors. Off for a text field, matching react-aria:
   * `useFormValidation` there commits on `invalid` and `change` only.
   * @default false
   */
  commitOnBlur?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Skip restoring the value on a form reset, for a field that runs its own restore over a
   * value this composable cannot represent.
   */
  skipFormReset?: boolean;
  /** Lands on the control, which is the text field as far as assistive technology is concerned. */
  id?: MaybeRefOrGetter<string | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  /** Ignored once a `<textarea>` registers, which has no `type`. @default "text" */
  type?: MaybeRefOrGetter<string | undefined>;
  /** Ignored once a `<textarea>` registers. */
  pattern?: MaybeRefOrGetter<string | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  autoComplete?: MaybeRefOrGetter<string | undefined>;
  autoCapitalize?: MaybeRefOrGetter<string | undefined>;
  autoCorrect?: MaybeRefOrGetter<string | undefined>;
  spellCheck?: MaybeRefOrGetter<string | boolean | undefined>;
  inputMode?: MaybeRefOrGetter<string | undefined>;
  enterKeyHint?: MaybeRefOrGetter<string | undefined>;
  maxLength?: MaybeRefOrGetter<number | undefined>;
  minLength?: MaybeRefOrGetter<number | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  /** Overrides the `role` the control would otherwise carry. `null` removes it. */
  role?: MaybeRefOrGetter<string | null | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  ariaErrormessage?: MaybeRefOrGetter<string | undefined>;
  ariaActivedescendant?: MaybeRefOrGetter<string | undefined>;
  ariaAutocomplete?: MaybeRefOrGetter<string | undefined>;
  ariaHaspopup?: MaybeRefOrGetter<string | boolean | undefined>;
  ariaControls?: MaybeRefOrGetter<string | undefined>;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onKeyup?: (event: KeyboardEvent) => void;
}

export interface UseTextFieldReturn extends TextFieldControlContext {
  /** Pass to `provideFieldIdsContext`. */
  fieldIds: FieldIdsContext;
  labelId: ComputedRef<string | undefined>;
  describedBy: ComputedRef<string | undefined>;
  /** Id the control renders, which the label points `for` at. */
  inputId: ComputedRef<string>;
  value: ComputedRef<string>;
  setValue: (value: string) => void;
  /** Pass to `provideFieldErrorContext`. */
  validation: FormValidationState;
  /** The control, once it has registered. */
  element: ComputedRef<TextFieldElement | null>;
  /**
   * Put the control's text back to what the field holds. Public because a field that layers
   * its own input handling on top has to re-assert after it commits.
   */
  reassert: () => void;
}

/**
 * Behaviour and accessibility for a text field, ported from React Aria's
 * `packages/react-aria/src/textfield/useTextField.ts` (react-aria 3.51.0), which composes
 * `useField` → `useLabel` on top of `useFormValidationState` and `useFormValidation`.
 *
 * The label wiring goes both ways, as it does there: the control points `aria-labelledby`
 * back at the label so assistive technology reads a name, and the label points `for` at the
 * control so a pointer click moves focus into it.
 *
 * @example
 * ```ts
 * const field = useTextField({value: () => props.value, onChange: (v) => emit("change", v)});
 *
 * provideFieldIdsContext(field.fieldIds);
 * provideTextFieldControlContext(field);
 * ```
 */
export const useTextField = (options: UseTextFieldOptions = {}): UseTextFieldReturn => {
  const element = shallowRef<TextFieldElement | null>(null);

  const registerElement = (next: TextFieldElement | null) => {
    element.value = next;
  };

  // React reads the element type from a prop; here the element itself answers the question,
  // which means `type` and `pattern` only settle once the control has registered.
  const isTextArea = computed(() => element.value instanceof HTMLTextAreaElement);

  const {setState, state: value} = useControllableState<string>({
    defaultValue: toValue(options.defaultValue) ?? "",
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  const inputId = useId(() => toValue(options.id));

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const isRequired = computed(() => Boolean(toValue(options.isRequired)));

  const validation =
    options.validationState ??
    useFormValidationState<string>({
      isInvalid: () => toValue(options.isInvalid),
      name: () => toValue(options.name),
      validate: () => toValue(options.validate),
      validationBehavior: () => toValue(options.validationBehavior),
      value: () => value.value,
    });

  const isInvalid = computed(() => validation.displayValidation.value.isInvalid);

  const {
    context: fieldIds,
    describedBy,
    labelId,
  } = useFieldIds({
    labelFor: inputId,
    slots: ["label", "description", "errorMessage"],
  });

  /** Whether a control has taken the value over, in which case the field writes nothing. */
  const isValueOwned = shallowRef(false);

  const setValueOwned = (owned: boolean) => {
    isValueOwned.value = owned;
  };

  /**
   * Vapor skips writing `value` when the bound value has not changed, and the browser has
   * already moved the text by then. So a controlled field whose owner declines the change
   * would keep the rejected text on screen, with nothing left to re-render and put it back.
   *
   * This also keeps the control's *reset source* in step — the half a binding never writes, and
   * the half a form reset restores from. See {@link setFormValue}.
   */
  const reassert = () => {
    if (isValueOwned.value) return;

    setFormValue(element.value, value.value);
  };

  /*
   * The reset source has to be in step *before* a reset happens, which is what this watcher is
   * for and what the `reset` listener below cannot do: the browser drains microtasks between
   * dispatching `reset` and restoring the controls, so a write made from the listener lands too
   * early and is overwritten. `immediate`, and with the element in the dependencies, because a
   * field nobody has typed into yet is exactly the one a reset is most likely to find.
   */
  watch([element, value, isValueOwned], reassert, {flush: "post", immediate: true});

  const setValue = (next: string) => {
    setState(next);
    reassert();
  };

  const initialValue = value.value;

  if (!options.skipFormReset) {
    // State only: moving it is what makes the watcher above write both halves, and that write is
    // the one that survives whichever order the browser chooses. Writing the element from in here
    // is the thing that looked right and did not work.
    useFormReset(element, () => toValue(options.defaultValue) ?? initialValue, setState);
  }

  useFormValidation(element, validation, {commitOnBlur: () => toValue(options.commitOnBlur)});

  // Setting `autofocus` after the element is in the document does nothing, so the focus is
  // taken once, when the control first reports itself.
  watch(
    element,
    (control, previous) => {
      if (control && !previous && toValue(options.autoFocus)) control.focus();
    },
    {flush: "post"},
  );

  const isNativeBehavior = computed(() => validation.validationBehavior.value === "native");

  const resolvedLabelledby = computed(() => {
    const ariaLabel = toValue(options.ariaLabel);
    const own = [labelId.value, toValue(options.ariaLabelledby)].filter(Boolean).join(" ");

    if (!own) return undefined;

    // With a name of its own *and* a chain to follow, the control joins its own id to the
    // front so assistive technology reads that name as part of the chain rather than
    // instead of it. Ported from react-aria's `useLabels`.
    return ariaLabel ? [inputId.value, own].join(" ") : own;
  });

  const resolvedDescribedby = computed(() => {
    const ids = [describedBy.value, toValue(options.ariaDescribedby)].filter(Boolean);

    return ids.length > 0 ? ids.join(" ") : undefined;
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const role = toValue(options.role);

    const all: Record<string, unknown> = {
      "aria-activedescendant": toValue(options.ariaActivedescendant),
      "aria-autocomplete": toValue(options.ariaAutocomplete),
      "aria-controls": toValue(options.ariaControls),
      "aria-describedby": resolvedDescribedby.value,
      "aria-errormessage": toValue(options.ariaErrormessage),
      "aria-haspopup": toValue(options.ariaHaspopup),
      "aria-invalid": isInvalid.value || undefined,
      "aria-label": toValue(options.ariaLabel),
      "aria-labelledby": resolvedLabelledby.value,
      // Only one of the two says "required": the attribute is what makes the browser refuse
      // the submit, so under `"aria"` the same fact is announced instead.
      "aria-required": (isRequired.value && !isNativeBehavior.value) || undefined,
      autocapitalize: toValue(options.autoCapitalize),
      autocomplete: toValue(options.autoComplete),
      autocorrect: toValue(options.autoCorrect),
      disabled: isDisabled.value || undefined,
      enterkeyhint: toValue(options.enterKeyHint),
      form: toValue(options.form),
      id: inputId.value,
      inputmode: toValue(options.inputMode),
      maxlength: toValue(options.maxLength),
      minlength: toValue(options.minLength),
      name: toValue(options.name),
      // A textarea has neither, and rendering them would be invalid markup.
      pattern: isTextArea.value ? undefined : toValue(options.pattern),
      placeholder: toValue(options.placeholder),
      readonly: isReadOnly.value || undefined,
      required: (isRequired.value && isNativeBehavior.value) || undefined,
      role: role === null ? undefined : role,
      spellcheck: toValue(options.spellCheck),
      // Written even though an input and a textarea are already tabbable: Safari does not focus
      // a native one unless an explicit tab index says so, which is the reason react-aria always
      // sets it — `useTextField` picks it up from `useFocusable`. A disabled control should not
      // be reachable at all, so it gets none, and the sweep below drops the key.
      tabindex: isDisabled.value ? undefined : 0,
      type: isTextArea.value ? undefined : (toValue(options.type) ?? "text"),
      value: value.value,
    };

    // An absent value is dropped rather than handed over as `undefined`. Two reasons, both
    // load-bearing: some of these are reflected DOM properties, so writing `undefined` sets
    // the property to its coerced default and renders an attribute that was never asked for
    // (`spellcheck="false"` is the one that showed up); and a control merging this bag on top
    // of its own props would otherwise have them wiped by keys the field never set.
    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  const handlers: TextFieldHandlers = {
    onBlur: () => {
      options.onFocusChange?.(false);
    },
    onFocus: () => {
      options.onFocusChange?.(true);
    },
    onInput: (event) => {
      const target = event.target as TextFieldElement | null;

      if (target) setValue(target.value);
    },
    onKeydown: (event) => {
      options.onKeydown?.(event);
    },
    onKeyup: (event) => {
      options.onKeyup?.(event);
    },
  };

  return {
    attrs,
    describedBy,
    element: computed(() => element.value),
    fieldIds,
    handlers,
    inputId,
    isDisabled,
    isInvalid,
    isReadOnly,
    isRequired,
    labelId,
    reassert,
    registerElement,
    setValue,
    setValueOwned,
    validation,
    value: computed(() => value.value),
  };
};
