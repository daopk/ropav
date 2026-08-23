import type {
  ColorChannelFieldState,
  UseColorChannelFieldStateOptions,
} from "./use-color-channel-field-state";
import type { FieldIdsContext } from "./use-field-ids";
import type { ValidationBehavior } from "./use-form-validation-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { useColorChannelFieldState } from "./use-color-channel-field-state";
import { useFormValidation } from "./use-form-validation";
import { useLocale } from "./use-locale";
import { useNumberField } from "./use-number-field";

export interface UseColorChannelFieldOptions extends UseColorChannelFieldStateOptions {
  id?: MaybeRefOrGetter<string | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  /** Whether the wheel over a focused field is ignored. */
  isWheelDisabled?: MaybeRefOrGetter<boolean | undefined>;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onKeyup?: (event: KeyboardEvent) => void;
}

export interface UseColorChannelFieldReturn {
  state: ColorChannelFieldState;
  /** Pass to `provideFieldIdsContext`. */
  fieldIds: FieldIdsContext;
  /** Attributes for the input. Spread with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** The input reports its element, which the wheel, reset and validation wiring hang off. */
  registerElement: (element: HTMLInputElement | null) => void;
  element: ComputedRef<HTMLInputElement | null>;
  isDisabled: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  onInput: (event: Event) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onKeyup: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
  /** Put the input's text back to what the state holds. */
  reassert: () => void;
}

/**
 * Behaviour and accessibility for a colour channel field, ported from React Aria's
 * `packages/react-aria/src/color/useColorChannelField.ts` (react-aria 3.51.0).
 *
 * Almost entirely {@link useNumberField}, which is the point: a channel field *is* a number
 * field, over a number that happens to live inside a colour. Only two things are added — the
 * channel's own name as a fallback label, and the format options, which upstream forgets to hand
 * over (see the deviation note below).
 *
 * @example
 * ```ts
 * const field = useColorChannelField({channel: () => props.channel, value: () => props.value});
 * ```
 */
export const useColorChannelField = (
  options: UseColorChannelFieldOptions,
): UseColorChannelFieldReturn => {
  const state = useColorChannelFieldState(options);
  const locale = useLocale();

  const field = useNumberField({
    ariaDescribedby: () => toValue(options.ariaDescribedby),
    ariaLabel: () => toValue(options.ariaLabel),
    ariaLabelledby: () => toValue(options.ariaLabelledby),
    autoFocus: () => toValue(options.autoFocus),
    /**
     * Handed over even though upstream does not.
     *
     * React's `useColorChannelField` spreads its props into `useNumberField`, and those props
     * carry no `formatOptions` — so the value a screen reader hears is formatted with none, and
     * a hue is announced as `300` rather than `300°`. The state already holds the channel's own
     * options, so withholding them here would be a bug to explain rather than a port to defend.
     * Invisible in the DOM: the announcement is the only thing that reads them.
     */
    formatOptions: state.formatOptions,
    id: () => toValue(options.id),
    isDisabled: () => toValue(options.isDisabled),
    isReadOnly: () => toValue(options.isReadOnly),
    isRequired: () => toValue(options.isRequired),
    isWheelDisabled: () => toValue(options.isWheelDisabled),
    locale: () => toValue(options.locale),
    onFocusChange: options.onFocusChange,
    onKeydown: options.onKeydown,
    onKeyup: options.onKeyup,
    state,
    validationBehavior: () => toValue(options.validationBehavior),
  });

  // Wired here rather than inside `useNumberField`, which does not do it: React's channel field
  // reaches this through `useTextField`, and it is what mirrors the field's verdict onto the
  // input with `setCustomValidity` — and, as a side effect, writes the empty `title` that keeps
  // Firefox from showing its own validation tooltip.
  useFormValidation(field.element, state);

  /**
   * The channel's own name, when nothing else names the field.
   *
   * Layered on the finished bag rather than passed in as an option, because the question is
   * whether the field ended up with *any* name — and `aria-labelledby` is only there once a
   * `Label` has actually claimed its id, which is not known until the bag is built.
   */
  const attrs = computed<Record<string, unknown>>(() => {
    const all = { ...field.attrs.value };

    if (!all["aria-label"] && !all["aria-labelledby"]) {
      all["aria-label"] = state.colorValue.value.getChannelName(
        toValue(options.channel),
        locale.value.locale,
      );
    }

    return all;
  });

  return {
    attrs,
    element: field.element,
    fieldIds: field.fieldIds,
    isDisabled: field.isDisabled,
    isInvalid: field.isInvalid,
    isReadOnly: field.isReadOnly,
    isRequired: field.isRequired,
    onBlur: field.onBlur,
    onFocus: field.onFocus,
    onInput: field.onInput,
    onKeydown: field.onKeydown,
    onKeyup: field.onKeyup,
    onPaste: field.onPaste,
    reassert: field.reassert,
    registerElement: field.registerElement,
    state,
  };
};
