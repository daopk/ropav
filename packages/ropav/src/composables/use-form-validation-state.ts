import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, nextTick, shallowRef, toValue, watch} from "vue";

import {createContext} from "../utils/create-context";

/**
 * Snapshot of an element's `ValidityState`.
 *
 * The native object is *live* — every property is a getter reading the element's current
 * state — so it is frozen into a plain object before it reaches reactive state, or a value
 * held from one tick would silently describe a later one. Structurally assignable to
 * `ValidityState`, and named for what it actually is.
 */
export interface ValidationDetails {
  badInput: boolean;
  customError: boolean;
  patternMismatch: boolean;
  rangeOverflow: boolean;
  rangeUnderflow: boolean;
  stepMismatch: boolean;
  tooLong: boolean;
  tooShort: boolean;
  typeMismatch: boolean;
  valid: boolean;
  valueMissing: boolean;
}

export interface ValidationResult {
  /** Whether the field currently fails validation. */
  isInvalid: boolean;
  /** Messages to show the user. Empty when the field is invalid by prop alone. */
  validationErrors: string[];
  /** Which constraint failed, for a caller that wants to branch on the reason. */
  validationDetails: ValidationDetails;
}

/**
 * `"native"` reveals errors only once the field commits (change, or a failed submit) and
 * hands them to the browser so it blocks submission. `"aria"` reveals them as the value
 * changes and leaves submission alone.
 */
export type ValidationBehavior = "aria" | "native";

/** Returns a message, several, or nothing at all when the value is acceptable. */
export type ValidationFunction<T> = (value: T) => string | string[] | true | null | undefined;

export const VALID_VALIDITY_STATE: ValidationDetails = Object.freeze({
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: true,
  valueMissing: false,
});

/** Failure that came from a prop, a `validate` function or the server rather than the browser. */
export const CUSTOM_VALIDITY_STATE: ValidationDetails = Object.freeze({
  ...VALID_VALIDITY_STATE,
  customError: true,
  valid: false,
});

export const DEFAULT_VALIDATION_RESULT: ValidationResult = Object.freeze({
  isInvalid: false,
  validationDetails: VALID_VALIDITY_STATE,
  validationErrors: [],
});

/**
 * One verdict out of several, for a control whose value has more than one part.
 *
 * Invalid if any part is, with the messages collected in order and deduplicated — two ends of a
 * range that are both out of bounds say the same thing, and saying it twice is not more helpful.
 */
export const mergeValidation = (...results: ValidationResult[]): ValidationResult => {
  const errors = new Set<string>();
  const details = {...VALID_VALIDITY_STATE};
  let isInvalid = false;

  for (const result of results) {
    for (const error of result.validationErrors) errors.add(error);

    isInvalid ||= result.isInvalid;

    for (const key of Object.keys(details) as (keyof ValidationDetails)[]) {
      details[key] ||= result.validationDetails[key];
    }
  }

  details.valid = !isInvalid;

  return {isInvalid, validationDetails: details, validationErrors: [...errors]};
};

/** Form controls that take part in constraint validation. */
export type ValidatableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Freeze an element's live validity into a result the state layer can hold. */
export const getNativeValidation = (element: ValidatableElement): ValidationResult => {
  const validity = element.validity;

  return {
    isInvalid: !validity.valid,
    validationDetails: {
      badInput: validity.badInput,
      customError: validity.customError,
      patternMismatch: validity.patternMismatch,
      rangeOverflow: validity.rangeOverflow,
      rangeUnderflow: validity.rangeUnderflow,
      stepMismatch: validity.stepMismatch,
      tooLong: validity.tooLong,
      tooShort: validity.tooShort,
      typeMismatch: validity.typeMismatch,
      valid: validity.valid,
      valueMissing: validity.valueMissing,
    },
    validationErrors: element.validationMessage ? [element.validationMessage] : [],
  };
};

/** Errors a server returned, keyed by the `name` each field submits under. */
export type FormValidationErrors = Record<string, string | string[]>;

export interface FormContext {
  /** Errors keyed by field `name`, shown until the user edits the value. */
  validationErrors: ComputedRef<FormValidationErrors>;
  /** Default for every field inside, unless the field names its own. */
  validationBehavior: ComputedRef<ValidationBehavior>;
}

/**
 * React splits this in two — `FormValidationContext` in react-stately for the errors,
 * `FormContext` in react-aria-components for the behaviour — only because the two live in
 * different packages. Here one provider hands out both, so a field injects once and the two
 * halves cannot drift apart.
 *
 * Loose: a field outside a form is the normal case, not an error.
 */
export const [useFormContext, provideFormContext] = createContext<FormContext | null>({
  defaultValue: null,
  name: "FormContext",
  strict: false,
});

export interface UseFormValidationStateOptions<T> {
  /** Value handed to `validate`. `null` or `undefined` skips custom validation entirely. */
  value: MaybeRefOrGetter<T | null | undefined>;
  /**
   * Controlled validity. Present at all — `true` *or* `false` — pins the field and shadows
   * `validate`, server errors and the browser alike.
   */
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<T> | undefined>;
  /** Falls back to the surrounding form's, then `"native"`. */
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /** Key(s) the surrounding form's server errors are looked up under. */
  name?: MaybeRefOrGetter<string | string[] | undefined>;
  /** Validity a composite field worked out from its own parts. */
  builtinValidation?: MaybeRefOrGetter<ValidationResult | undefined>;
  /**
   * A validation state owned by something above, which this field reports through instead of
   * keeping one of its own.
   *
   * A date picker holds the value, the bounds and the availability rule, so its own state is the
   * only one that can judge them; the date field inside it must not reach a second, disagreeing
   * verdict about the same value. Every other option is ignored when this is present.
   */
  validationState?: FormValidationState;
}

export interface FormValidationState {
  /** Updated as the value changes. What drives `setCustomValidity`. */
  realtimeValidation: ComputedRef<ValidationResult>;
  /** What the user sees. Under `"native"`, only what a commit has revealed. */
  displayValidation: ComputedRef<ValidationResult>;
  /** Resolved here so the DOM layer and the state layer cannot disagree about it. */
  validationBehavior: ComputedRef<ValidationBehavior>;
  /** Feed the browser's verdict in. Held back until commit under `"native"`. */
  updateValidation: (result: ValidationResult) => void;
  /** Put the displayed state back to valid, as a form reset does. */
  resetValidation: () => void;
  /** Reveal what validation currently says — on change, or on a failed submit. */
  commitValidation: () => void;
}

const asArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];

  return Array.isArray(value) ? value : [value];
};

const runValidate = <T>(validate: ValidationFunction<T>, value: T): string[] => {
  const result = validate(value);

  // `true` means "acceptable", so only a non-boolean result carries messages.
  return result && typeof result !== "boolean" ? asArray(result) : [];
};

const toValidationResult = (errors: string[]): ValidationResult | null =>
  errors.length > 0
    ? {isInvalid: true, validationDetails: CUSTOM_VALIDITY_STATE, validationErrors: errors}
    : null;

/**
 * Whether two results say the same thing.
 *
 * Not an optimisation: the results live in `shallowRef`s, and assigning an equal-but-new
 * object still retriggers every computed reading them.
 */
export const isEqualValidation = (
  a: ValidationResult | null,
  b: ValidationResult | null,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.isInvalid === b.isInvalid &&
    a.validationErrors.length === b.validationErrors.length &&
    a.validationErrors.every((error, index) => error === b.validationErrors[index]) &&
    (Object.keys(a.validationDetails) as (keyof ValidationDetails)[]).every(
      (key) => a.validationDetails[key] === b.validationDetails[key],
    )
  );
};

/**
 * Decide what a field's validation currently says, ported from React Aria's
 * `packages/react-stately/src/form/useFormValidationState.ts` (react-stately 3.49.0).
 *
 * Knows nothing about the DOM — `useFormValidation` is what connects this to a real input.
 * Four sources feed it, in a fixed order of precedence:
 *
 * ```
 * realtime        = controlled ?? server ?? client ?? builtin ?? valid
 * display(native) = controlled ?? server ?? committed
 * display(aria)   = controlled ?? server ?? client ?? builtin ?? committed
 * ```
 *
 * `realtimeValidation` is what the field pushes onto the input through `setCustomValidity`,
 * so the browser blocks submission the moment the value stops being acceptable.
 * `displayValidation` is what the user reads, and under `"native"` it moves only on commit —
 * which is what keeps an untouched field from turning red before it has been used.
 *
 * @example
 * ```ts
 * const validation = useFormValidationState<boolean>({
 *   isInvalid: () => props.isInvalid,
 *   name: () => props.name,
 *   validate: () => props.validate,
 *   validationBehavior: () => props.validationBehavior,
 *   value: () => state.value,
 * });
 * ```
 */
export const useFormValidationState = <T>(
  options: UseFormValidationStateOptions<T>,
): FormValidationState => {
  /*
   * Handed straight back, exactly as upstream does: whoever passed it in is the one that owns the
   * verdict, and building a second state here would mean two answers about one value.
   */
  if (options.validationState) return options.validationState;

  const form = useFormContext();

  // React Aria's raw hooks default to `"aria"`, but React Aria Components — which is what
  // HeroUI React actually composes — defaults to `"native"`. Taking the hook's default here
  // would quietly switch native constraint validation off for every field in the library.
  const validationBehavior = computed<ValidationBehavior>(
    () => toValue(options.validationBehavior) ?? form?.validationBehavior.value ?? "native",
  );

  const controlledError = computed<ValidationResult | null>(() => {
    const isInvalid = toValue(options.isInvalid);

    if (isInvalid === undefined) return null;

    // React reports `customError` either way, so a field claiming to be *valid* still reads
    // as `validationDetails.valid === false`. `validationDetails` is a slot prop here, so
    // that inconsistency would be visible to callers.
    return {
      isInvalid,
      validationDetails: isInvalid ? CUSTOM_VALIDITY_STATE : VALID_VALIDITY_STATE,
      validationErrors: [],
    };
  });

  const clientError = computed<ValidationResult | null>(() => {
    const validate = toValue(options.validate);
    const value = toValue(options.value);

    if (!validate || value == null) return null;

    return toValidationResult(runValidate(validate, value as T));
  });

  const builtinValidation = computed<ValidationResult | null>(() => {
    const result = toValue(options.builtinValidation);

    // A builtin result that passes says nothing the default does not already say.
    return result && !result.validationDetails.valid ? result : null;
  });

  const serverErrors = computed<FormValidationErrors>(() => form?.validationErrors.value ?? {});

  const serverErrorMessages = computed<string[]>(() => {
    const name = toValue(options.name);

    if (!name) return [];

    return Array.isArray(name)
      ? name.flatMap((key) => asArray(serverErrors.value[key]))
      : asArray(serverErrors.value[name]);
  });

  // Server errors are shown until the user acts on the field, then hidden — but they come
  // back when the server answers again. Watching the errors *object identity* is what tells
  // the two apart: a new object means a new response, the same object means the user is
  // still working through the last one.
  const isServerErrorCleared = shallowRef(false);

  watch(serverErrors, () => {
    isServerErrorCleared.value = false;
  });

  const serverError = computed<ValidationResult | null>(() =>
    isServerErrorCleared.value ? null : toValidationResult(serverErrorMessages.value),
  );

  /** What a commit will reveal. Written by `updateValidation` under `"native"`. */
  const nextNative = shallowRef<ValidationResult>(DEFAULT_VALIDATION_RESULT);
  /** What a commit has already revealed. */
  const committed = shallowRef<ValidationResult>(DEFAULT_VALIDATION_RESULT);

  // A plain `let`, not a ref: nothing renders from it, and making it reactive would only
  // add a render pass between queueing a commit and performing it.
  let isCommitQueued = false;

  const realtimeValidation = computed<ValidationResult>(
    () =>
      controlledError.value ??
      serverError.value ??
      clientError.value ??
      builtinValidation.value ??
      DEFAULT_VALIDATION_RESULT,
  );

  const displayValidation = computed<ValidationResult>(() => {
    if (validationBehavior.value === "native") {
      return controlledError.value ?? serverError.value ?? committed.value;
    }

    return (
      controlledError.value ??
      serverError.value ??
      clientError.value ??
      builtinValidation.value ??
      committed.value
    );
  });

  const setCommitted = (result: ValidationResult) => {
    if (!isEqualValidation(result, committed.value)) committed.value = result;
  };

  return {
    commitValidation: () => {
      isServerErrorCleared.value = true;

      if (validationBehavior.value !== "native" || isCommitQueued) return;

      isCommitQueued = true;

      // A tick later, so the input has taken its current bindings and the browser has
      // recomputed its validity — the verdict read here is the one the user just produced.
      // Queueing also collapses the burst of `invalid` events a multi-field submit fires
      // into a single commit.
      void nextTick(() => {
        if (!isCommitQueued) return;

        isCommitQueued = false;
        setCommitted(clientError.value ?? builtinValidation.value ?? nextNative.value);
      });
    },
    displayValidation,
    realtimeValidation,
    resetValidation: () => {
      setCommitted(DEFAULT_VALIDATION_RESULT);
      // Drop any queued commit, or a reset triggered from inside a change handler would be
      // undone a tick later by the commit that change had already scheduled.
      isCommitQueued = false;
      isServerErrorCleared.value = true;
    },
    updateValidation: (result) => {
      if (validationBehavior.value === "aria") {
        setCommitted(result);

        return;
      }

      nextNative.value = result;
    },
    validationBehavior,
  };
};
