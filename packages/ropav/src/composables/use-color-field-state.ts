import type {Color} from "../utils/color-types";
import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

import {parseColor} from "../utils/color";

import {useControllableState} from "./use-controllable-state";
import {useFormValidationState} from "./use-form-validation-state";

export interface UseColorFieldStateOptions {
  /** Controlled colour. A string is parsed; one that will not parse is treated as absent. */
  value?: MaybeRefOrGetter<Color | string | null | undefined>;
  /** Colour the field starts with, and goes back to when the form is reset. */
  defaultValue?: MaybeRefOrGetter<Color | string | null | undefined>;
  onChange?: (value: Color | null) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<Color | null> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
}

export interface ColorFieldState extends FormValidationState {
  /** Text in the input. Follows the typing, and is rewritten in full on commit. */
  inputValue: ComputedRef<string>;
  /** The colour the text currently parses to, or `null` when the field is empty. */
  colorValue: ComputedRef<Color | null>;
  /** What a form reset goes back to. */
  defaultColorValue: ComputedRef<Color | null>;
  setColorValue: (value: Color | null) => void;
  setInputValue: (value: string) => void;
  /** Parse the text, write it back out in full, and reveal validation. What blurring does. */
  commit: () => void;
  increment: () => void;
  decrement: () => void;
  incrementToMax: () => void;
  decrementToMin: () => void;
  /** Whether a half-typed string could still become a hex colour. */
  validate: (value: string) => boolean;
}

const MIN_COLOR = parseColor("#000000");
const MAX_COLOR = parseColor("#FFFFFF");
const MIN_COLOR_INT = MIN_COLOR.toHexInt();
const MAX_COLOR_INT = MAX_COLOR.toHexInt();

/**
 * A colour that may arrive as a string, forgiving one that will not parse.
 *
 * The Vue counterpart of react-stately's `useColor`: swallowing the error is what lets a caller
 * hand over half-written text without the field throwing at them. Exported for the channel
 * branch, which needs the same leniency.
 */
export const parseColorValue = (
  value: Color | string | null | undefined,
): Color | null | undefined => {
  if (typeof value !== "string") return value;

  try {
    return parseColor(value);
  } catch {
    return undefined;
  }
};

/**
 * Step a colour by treating its hex as one integer.
 *
 * A hex field steps as a whole number rather than per channel, so `#0000FF` incremented once is
 * `#000100` — deliberate, and the reason the value is clamped as an int rather than per channel.
 * Ported from react-stately's `addColorValue`.
 */
const addColorValue = (color: Color | null, step: number): Color => {
  const from = color ?? MIN_COLOR;
  const colorInt = from.toHexInt();
  const clamped = Math.min(Math.max(colorInt + step, MIN_COLOR_INT), MAX_COLOR_INT);

  if (clamped === colorInt) return from;

  return parseColor(`#${clamped.toString(16).padStart(6, "0").toUpperCase()}`);
};

/**
 * State for a hex colour field, ported from React Stately's
 * `packages/react-stately/src/color/useColorFieldState.ts` (react-stately 3.49.0).
 *
 * Like a number field it holds two values at once — the text being typed, which may not be a
 * colour yet, and the colour it parses to — and only brings them back together on commit. That
 * is what lets someone type `#ff` on the way to `#ffcc00` without the field fighting them.
 *
 * The upstream original synchronises the text from inside the render body, which Vue has no
 * counterpart for; here it is a synchronous watcher, and it has to stay synchronous — stepping
 * the value and then reading the input back has to see the new text.
 *
 * @example
 * ```ts
 * const state = useColorFieldState({value: () => props.value, onChange: (c) => emit("change", c)});
 * ```
 */
export const useColorFieldState = (options: UseColorFieldStateOptions = {}): ColorFieldState => {
  const {step} = MIN_COLOR.getChannelRange("red");

  const controlledValue = computed(() => parseColorValue(toValue(options.value)));
  const defaultValue = computed(() => parseColorValue(toValue(options.defaultValue)));

  const {setState: setColorValue, state: colorValue} = useControllableState<Color | null>({
    defaultValue: defaultValue.value ?? null,
    onValueChange: (value) => options.onChange?.(value),
    value: () => controlledValue.value,
  });

  /** Captured once: a form reset goes back to where the field started, not to where it is now. */
  const initialValue = colorValue.value;

  // Empty unless the caller actually supplied a colour. A field that starts empty must show an
  // empty input rather than the black that `null` would otherwise be written as.
  const hasInitialValue = toValue(options.value) != null || toValue(options.defaultValue) != null;
  const inputValue = shallowRef(
    hasInitialValue && colorValue.value ? colorValue.value.toString("hex") : "",
  );

  const validation = useFormValidationState<Color | null>({
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    validate: () => toValue(options.validate),
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => colorValue.value,
  });

  /**
   * Rewrite the text whenever the colour changes underneath it.
   *
   * Synchronous on purpose, matching the number field: stepping the value and then reading the
   * input back has to see the new text, and a post-flush watcher would leave the old text there
   * for a tick.
   */
  watch(
    colorValue,
    (next) => {
      inputValue.value = next ? next.toString("hex") : "";
    },
    {flush: "sync"},
  );

  /**
   * Set the colour, but only when it really is a different colour.
   *
   * The comparison is on the hex integer rather than the object: every `Color` method returns a
   * new instance, so identity would report a change on every keystroke that reparsed the same
   * text and fire `onChange` for nothing.
   */
  const safelySetColorValue = (next: Color | null) => {
    if (!colorValue.value || !next) {
      setColorValue(next);

      return;
    }

    if (next.toHexInt() !== colorValue.value.toHexInt()) setColorValue(next);
  };

  const parsedValue = computed(() => {
    const text = inputValue.value;

    try {
      return parseColor(text.startsWith("#") ? text : `#${text}`);
    } catch {
      return null;
    }
  });

  const setInputValue = (next: string) => {
    inputValue.value = next;
  };

  /**
   * Write the colour the field holds back out as text, in full.
   *
   * Read *after* whatever set the colour, on purpose. Upstream reads a render-scoped value that
   * is still the old one, writes that, and lets the next render's sync correct it — so the end
   * state is "whatever the field ended up holding" either way: the new colour when the change
   * was accepted, the old one when a controlled owner declined it. This is that end state,
   * without the intermediate write.
   */
  const rewrite = () => {
    inputValue.value = colorValue.value ? colorValue.value.toString("hex") : "";
  };

  const commit = () => {
    if (!inputValue.value.length) {
      safelySetColorValue(null);
      rewrite();

      return;
    }

    // Unparseable: throw the text away and write the current colour back out. This is what makes
    // a half-typed entry recoverable rather than destructive.
    if (parsedValue.value === null) {
      rewrite();

      return;
    }

    safelySetColorValue(parsedValue.value);
    rewrite();
    validation.commitValidation();
  };

  const step1 = (by: number) => {
    const next = addColorValue(parsedValue.value, by);

    // Landing on the colour already held changes nothing, so the watcher would not fire — and the
    // text may well be a half-typed version of that same colour. Rewrite it here.
    if (next === colorValue.value) inputValue.value = next.toString("hex");

    safelySetColorValue(next);
    validation.commitValidation();
  };

  return {
    ...validation,
    colorValue: computed(() => colorValue.value),
    commit,
    decrement: () => step1(-step),
    decrementToMin: () => safelySetColorValue(MIN_COLOR),
    defaultColorValue: computed(() => defaultValue.value ?? initialValue),
    increment: () => step1(step),
    incrementToMax: () => safelySetColorValue(MAX_COLOR),
    inputValue: computed(() => inputValue.value),
    setColorValue,
    setInputValue,
    // The empty string is spelled out because the pattern matches it and then reads falsy: the
    // match is `[""]`, whose first element is the empty string. Ported verbatim.
    validate: (value: string) => value === "" || Boolean(/^#?[0-9a-f]{0,6}$/i.exec(value)?.[0]),
  };
};
