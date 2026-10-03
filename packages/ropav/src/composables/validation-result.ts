import type {
  ValidationDetails,
  ValidationResult,
  RequiredControl,
} from "./use-form-validation-state";

/*
 * The validity constants and result helpers behind `useFormValidationState`, kept out of its public
 * module: a field built on that state reads its verdicts, it never needs to assemble one.
 */

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

/** A required field with nothing in it. What the browser reports under `"native"`. */
export const MISSING_VALIDITY_STATE: ValidationDetails = Object.freeze({
  ...VALID_VALIDITY_STATE,
  valid: false,
  valueMissing: true,
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
  const details = { ...VALID_VALIDITY_STATE };
  let isInvalid = false;

  for (const result of results) {
    for (const error of result.validationErrors) errors.add(error);

    isInvalid ||= result.isInvalid;

    for (const key of Object.keys(details) as (keyof ValidationDetails)[]) {
      details[key] ||= result.validationDetails[key];
    }
  }

  details.valid = !isInvalid;

  return { isInvalid, validationDetails: details, validationErrors: [...errors] };
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

const missingValueMessages = new Map<RequiredControl, string>();

/**
 * What the browser would say about an empty control of this kind.
 *
 * Read off a detached probe rather than translated here. The platform already holds the sentence,
 * in the *browser's* locale — which is the locale a validation message belongs in, since it sits
 * beside the browser's own — and it is the one the same field would report under `"native"`.
 *
 * Empty on a server, where the field cannot have been revealed yet and so has nothing to say.
 */
export const missingValueMessage = (kind: RequiredControl): string => {
  const cached = missingValueMessages.get(kind);

  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return "";

  let probe: ValidatableElement;

  if (kind === "select") {
    probe = document.createElement("select");
  } else {
    const input = document.createElement("input");

    if (kind !== "text") {
      input.type = kind;
      // A radio reports on its group rather than on itself, and an unnamed radio has none.
      input.name = "probe";
    }

    probe = input;
  }

  probe.required = true;

  const message = probe.validationMessage;

  missingValueMessages.set(kind, message);

  return message;
};

/** Whether a value counts as nothing. Covers every shape a field holds when it is empty. */
export const isValueMissing = (value: unknown): boolean => {
  if (value == null || value === "" || value === false) return true;
  if (Array.isArray(value)) return value.length === 0;

  return typeof value === "number" && Number.isNaN(value);
};

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
