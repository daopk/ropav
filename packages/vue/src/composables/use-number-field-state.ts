import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {NumberFormatter, NumberParser} from "@internationalized/number";
import {computed, shallowRef, toValue, watch} from "vue";

import {clamp, snapValueToStep} from "../utils/number";

import {useControllableState} from "./use-controllable-state";
import {useFormValidationState} from "./use-form-validation-state";

/**
 * What happens to the value once the user is done editing.
 *
 * `"snap"` pulls it inside the range and onto the nearest step. `"validate"` leaves it where the
 * user put it and lets validation object.
 */
export type NumberFieldCommitBehavior = "snap" | "validate";

export interface UseNumberFieldStateOptions {
  value?: MaybeRefOrGetter<number | null | undefined>;
  defaultValue?: MaybeRefOrGetter<number | undefined>;
  onChange?: (value: number) => void;
  minValue?: MaybeRefOrGetter<number | undefined>;
  maxValue?: MaybeRefOrGetter<number | undefined>;
  step?: MaybeRefOrGetter<number | undefined>;
  /** How the value is written, and by extension which characters may be typed. */
  formatOptions?: MaybeRefOrGetter<Intl.NumberFormatOptions | undefined>;
  /** @default "snap" */
  commitBehavior?: MaybeRefOrGetter<NumberFieldCommitBehavior | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<number> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  /** Locale used for both writing and reading the number. @default the runtime's own */
  locale?: MaybeRefOrGetter<string | undefined>;
}

export interface NumberFieldState extends FormValidationState {
  /** Text in the input. Follows the typing, and is rewritten in full on commit. */
  inputValue: ComputedRef<string>;
  /** The number the text currently parses to, or `NaN` when it does not parse. */
  numberValue: ComputedRef<number>;
  /** What a form reset goes back to. */
  defaultNumberValue: ComputedRef<number>;
  minValue: ComputedRef<number | undefined>;
  maxValue: ComputedRef<number | undefined>;
  canIncrement: ComputedRef<boolean>;
  canDecrement: ComputedRef<boolean>;
  /** Whether a half-typed string could still become a number in this locale and format. */
  validate: (value: string) => boolean;
  setInputValue: (value: string) => void;
  setNumberValue: (value: number) => void;
  /** Parse, pull into range, snap to a step and rewrite the text. What blurring does. */
  commit: (value?: string) => void;
  increment: () => void;
  decrement: () => void;
  incrementToMax: () => void;
  decrementToMin: () => void;
  /** The parser the input needs to tell an acceptable keystroke from an unacceptable one. */
  parser: ComputedRef<NumberParser>;
  /** How the number is written, with the numbering system the user is actually typing in. */
  format: (value: number) => string;
}

/**
 * Addition and subtraction that do not leak binary floating point.
 *
 * `0.1 + 0.2` is the famous one, but the case that matters here is stepping a decimal field:
 * without this, incrementing `1.1` by `0.1` puts `1.2000000000000002` in the input. Both
 * operands are scaled to integers by the larger of their decimal lengths, and the result scaled
 * back. Ported from react-stately's `handleDecimalOperation`.
 */
const decimalOperation = (operator: "+" | "-", a: number, b: number): number => {
  let result = operator === "+" ? a + b : a - b;

  if (a % 1 === 0 && b % 1 === 0) return result;

  const aDecimals = a.toString().split(".")[1]?.length ?? 0;
  const bDecimals = b.toString().split(".")[1]?.length ?? 0;
  const multiplier = 10 ** Math.max(aDecimals, bDecimals);

  const scaledA = Math.round(a * multiplier);
  const scaledB = Math.round(b * multiplier);

  result = operator === "+" ? scaledA + scaledB : scaledA - scaledB;

  return result / multiplier;
};

/**
 * A key that changes only when the format options really differ.
 *
 * Every value in `Intl.NumberFormatOptions` is a primitive, so a shallow comparison is enough —
 * and it has to be shallow rather than by reference, because a caller writing the options inline
 * hands over a fresh object every render and would otherwise rewrite the input on each one.
 */
const formatOptionsKey = (options: Intl.NumberFormatOptions | undefined): string => {
  if (!options) return "";

  return Object.keys(options)
    .sort()
    .map((key) => key + ":" + String((options as Record<string, unknown>)[key]))
    .join("|");
};

/**
 * State for a number field, ported from React Stately's
 * `packages/react-stately/src/numberfield/useNumberFieldState.ts` (react-stately 3.49.0).
 *
 * The field keeps two values at once and that is the whole design: the text the user is typing,
 * which may not be a number yet, and the number it parses to. They only come back together on
 * commit, which is what lets someone type `-`, or `1.`, or a half-finished currency amount
 * without the field fighting them.
 *
 * @example
 * ```ts
 * const state = useNumberFieldState({value: () => props.value, step: () => props.step});
 * ```
 */
export const useNumberFieldState = (options: UseNumberFieldStateOptions = {}): NumberFieldState => {
  // `@internationalized/number` needs a real locale tag, where `Intl` accepts `undefined` and
  // works it out itself. There is no locale layer here yet, so the runtime's own choice is asked
  // for by name — the same locale `new Intl.NumberFormat(undefined)` would have resolved to.
  const locale = computed(
    () => toValue(options.locale) ?? new Intl.NumberFormat().resolvedOptions().locale,
  );
  const minValue = computed(() => toValue(options.minValue));
  const maxValue = computed(() => toValue(options.maxValue));
  const step = computed(() => toValue(options.step));
  const formatOptions = computed(() => toValue(options.formatOptions));
  const commitBehavior = computed(() => toValue(options.commitBehavior) ?? "snap");

  const snap = (candidate: number): number =>
    step.value === undefined || Number.isNaN(step.value)
      ? clamp(candidate, minValue.value, maxValue.value)
      : snapValueToStep(candidate, minValue.value, maxValue.value, step.value);

  // `null` is spelled `NaN` inside: the field has one way of saying "no number", and every
  // comparison below is written against it.
  const controlledValue = computed(() => {
    const raw = toValue(options.value);

    if (raw === undefined) return undefined;
    if (raw === null || Number.isNaN(raw)) return Number.NaN;

    return commitBehavior.value === "snap" ? snap(raw) : raw;
  });

  const defaultValue = computed(() => {
    const raw = toValue(options.defaultValue);

    if (raw === undefined || Number.isNaN(raw)) return Number.NaN;

    return commitBehavior.value === "snap" ? snap(raw) : raw;
  });

  const {setState: setNumberValue, state: numberValueState} = useControllableState<number>({
    defaultValue: defaultValue.value,
    onValueChange: options.onChange,
    value: () => controlledValue.value,
  });

  const isControlled = computed(() => controlledValue.value !== undefined);

  // Captured once. React keeps this in a `useState` initialiser for the same reason: a form reset
  // has to go back to where the field started, not to wherever it happens to be now.
  const initialValue = numberValueState.value;

  const parser = computed(() => new NumberParser(locale.value, formatOptions.value));

  const inputValue = shallowRef("");

  // The numbering system is taken from what the user is typing, not from the locale, so someone
  // entering Arabic-Indic digits gets them back rather than having them rewritten as Latin.
  const numberingSystem = computed(() => parser.value.getNumberingSystem(inputValue.value));

  const formatter = computed(
    () =>
      new NumberFormatter(locale.value, {
        ...formatOptions.value,
        numberingSystem: numberingSystem.value,
      }),
  );

  const format = (candidate: number): string =>
    Number.isNaN(candidate) ? "" : formatter.value.format(candidate);

  inputValue.value = format(numberValueState.value);

  const validation = useFormValidationState<number>({
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    validate: () => toValue(options.validate),
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => numberValueState.value,
  });

  // The step used for clamping, which is not always the step the caller gave. A percent field
  // with no step of its own moves by a hundredth, because that is one percentage point.
  const clampStep = computed(() => {
    if (step.value !== undefined && !Number.isNaN(step.value)) return step.value;
    if (formatter.value.resolvedOptions().style === "percent") return 0.01;

    return 1;
  });

  const setInputValue = (next: string) => {
    inputValue.value = next;
  };

  /**
   * Rewrite the text whenever the number, the locale or the format changes underneath it.
   *
   * Synchronous on purpose. Stepping the value and then reading the input back has to see the
   * new text — a post-flush watcher would leave the old text there for a tick, which the caret
   * handling downstream reads and would then restore to the wrong place.
   */
  watch(
    [numberValueState, locale, () => formatOptionsKey(formatOptions.value)],
    () => {
      inputValue.value = format(numberValueState.value);
    },
    {flush: "sync"},
  );

  const parsedValue = computed(() => parser.value.parse(inputValue.value));

  const commit = (override?: string) => {
    const nextInput = override ?? inputValue.value;
    const nextParsed = override === undefined ? parsedValue.value : parser.value.parse(override);

    // Cleared field: the number goes away with the text. A controlled field is put back to
    // whatever its owner still holds, since only the owner can agree to the value being gone.
    if (!nextInput.length) {
      setNumberValue(Number.NaN);
      inputValue.value = isControlled.value ? format(numberValueState.value) : "";

      return;
    }

    // Unparseable: throw the text away and write the current number back out. This is what
    // makes a half-typed entry recoverable rather than destructive.
    if (Number.isNaN(nextParsed)) {
      inputValue.value = format(numberValueState.value);

      return;
    }

    let committed = commitBehavior.value === "snap" ? snap(nextParsed) : nextParsed;

    // Round-tripped through the formatter so the number matches the digits on screen — a field
    // showing two decimals must not keep a third one nobody can see.
    committed = parser.value.parse(format(committed));

    const changed = committed !== numberValueState.value;

    setNumberValue(committed);
    inputValue.value = format(isControlled.value ? numberValueState.value : committed);

    if (changed) validation.commitValidation();
  };

  /**
   * The next value one step along, without ever landing off a step boundary.
   *
   * Snapping first is what handles a value that is already between steps: if the snap alone
   * moves in the direction being asked for, that is the answer, and only otherwise does a whole
   * step get added.
   */
  const nextStep = (operation: "+" | "-", fromEmpty: number | undefined): number => {
    const previous = parsedValue.value;

    if (Number.isNaN(previous)) {
      // An empty field starts from the end of the range it is heading away from, or from zero.
      const start = fromEmpty === undefined || Number.isNaN(fromEmpty) ? 0 : fromEmpty;

      return snapValueToStep(start, minValue.value, maxValue.value, clampStep.value);
    }

    const snapped = snapValueToStep(previous, minValue.value, maxValue.value, clampStep.value);

    if (operation === "+" && snapped > previous) return snapped;
    if (operation === "-" && snapped < previous) return snapped;

    return snapValueToStep(
      decimalOperation(operation, previous, clampStep.value),
      minValue.value,
      maxValue.value,
      clampStep.value,
    );
  };

  const step1 = (operation: "+" | "-", fromEmpty: number | undefined) => {
    const next = nextStep(operation, fromEmpty);

    // Landing on the value already held changes nothing, so nothing would rewrite the text —
    // and the text may well be a half-typed version of that same number. Rewrite it here.
    if (next === numberValueState.value) inputValue.value = format(next);

    setNumberValue(next);
    validation.commitValidation();
  };

  const increment = () => step1("+", minValue.value);
  const decrement = () => step1("-", maxValue.value);

  const incrementToMax = () => {
    if (maxValue.value === undefined || maxValue.value === null) return;

    setNumberValue(
      snapValueToStep(maxValue.value, minValue.value, maxValue.value, clampStep.value),
    );
    validation.commitValidation();
  };

  const decrementToMin = () => {
    if (minValue.value === undefined || minValue.value === null) return;

    setNumberValue(minValue.value);
    validation.commitValidation();
  };

  const isSteppable = computed(() => !toValue(options.isDisabled) && !toValue(options.isReadOnly));

  const canIncrement = computed(() => {
    if (!isSteppable.value) return false;

    const current = parsedValue.value;
    const max = maxValue.value;

    if (Number.isNaN(current) || max === undefined || Number.isNaN(max)) return true;

    return (
      snapValueToStep(current, minValue.value, max, clampStep.value) > current ||
      decimalOperation("+", current, clampStep.value) <= max
    );
  });

  const canDecrement = computed(() => {
    if (!isSteppable.value) return false;

    const current = parsedValue.value;
    const min = minValue.value;

    if (Number.isNaN(current) || min === undefined || Number.isNaN(min)) return true;

    return (
      snapValueToStep(current, min, maxValue.value, clampStep.value) < current ||
      decimalOperation("-", current, clampStep.value) >= min
    );
  });

  return {
    ...validation,
    canDecrement,
    canIncrement,
    commit,
    decrement,
    decrementToMin,
    defaultNumberValue: computed(() =>
      Number.isNaN(defaultValue.value) ? initialValue : defaultValue.value,
    ),
    format,
    increment,
    incrementToMax,
    inputValue: computed(() => inputValue.value),
    maxValue,
    minValue,
    numberValue: parsedValue,
    parser,
    setInputValue,
    setNumberValue,
    validate: (candidate: string) =>
      parser.value.isValidPartialNumber(candidate, minValue.value, maxValue.value),
  };
};
