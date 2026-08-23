import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, toValue, watch} from "vue";

import {spinbuttonStrings} from "../i18n/spinbutton";
import {announce} from "../utils/live-announcer";

import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

/**
 * How long a held button waits before it starts repeating, and how fast it repeats after that.
 *
 * A finger gets longer than a cursor: a touch that turns into a scroll would otherwise fire a
 * step before the gesture is recognised.
 */
const INITIAL_DELAY_MOUSE = 400;
const INITIAL_DELAY_TOUCH = 600;
const REPEAT_DELAY = 60;

/** Keys a spin button acts on, each mapped to the step it takes. */
type SpinKey = "ArrowDown" | "ArrowUp" | "End" | "Home" | "PageDown" | "PageUp";

export interface UseSpinButtonOptions {
  value?: MaybeRefOrGetter<number | undefined>;
  /** How the value should be read out, when the number alone would not do. */
  textValue?: MaybeRefOrGetter<string | undefined>;
  minValue?: MaybeRefOrGetter<number | undefined>;
  maxValue?: MaybeRefOrGetter<number | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  onIncrement?: () => void;
  onIncrementPage?: () => void;
  onDecrement?: () => void;
  onDecrementPage?: () => void;
  onDecrementToMin?: () => void;
  onIncrementToMax?: () => void;
}

/** What a stepper button needs, whichever direction it goes in. */
export interface SpinStepperHandlers {
  /** A press has begun. `pointerType` decides whether it steps now or waits for the release. */
  onPressStart: (pointerType: string) => void;
  /** The pointer came up on the button, as opposed to sliding off it. */
  onPressUp: (pointerType: string) => void;
  onPressEnd: (pointerType: string) => void;
}

export interface UseSpinButtonReturn {
  /** Spread on the control with `v-bind`. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Wire on the control with `@keydown`. */
  onKeydown: (event: KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  increment: SpinStepperHandlers;
  decrement: SpinStepperHandlers;
}

/**
 * Behaviour and accessibility for a control that steps through numbers, ported from React Aria's
 * `packages/react-aria/src/spinbutton/useSpinButton.ts` (react-aria 3.51.0).
 *
 * Two things here are less obvious than they look. Holding a stepper button repeats, and the
 * repeat re-arms itself one step at a time rather than running on an interval, so it stops the
 * moment the value reaches the end of its range. And a touch does not step on the way down at
 * all: a finger that slides off was scrolling, not pressing, so the step waits for a release
 * that actually landed on the button.
 *
 * @example
 * ```ts
 * const spin = useSpinButton({value, minValue, maxValue, onIncrement, onDecrement});
 * // <input v-bind="spin.attrs" @keydown="spin.onKeydown" @focus="spin.onFocus" …>
 * ```
 */
export const useSpinButton = (options: UseSpinButtonOptions = {}): UseSpinButtonReturn => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isSpinning = false;
  // Whether the release landed on the button. A touch that slid off never gets one, which is
  // how a scroll gesture is told apart from a press.
  let isUp = false;
  let isFocused = false;

  const clearAsync = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    isSpinning = false;
  };

  onScopeDispose(clearAsync);

  const stringFormatter = useLocalizedStringFormatter(spinbuttonStrings);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));

  const value = computed(() => toValue(options.value));
  const minValue = computed(() => toValue(options.minValue));
  const maxValue = computed(() => toValue(options.maxValue));

  /**
   * The value as assistive technology should hear it.
   *
   * The hyphen-minus a formatter writes is replaced with a real minus sign, because macOS
   * VoiceOver reads U+002D as a hyphen and says nothing at all when a currency symbol sits
   * between it and the digits. An empty field is given a word of its own, so iOS VoiceOver does
   * not read the last value it saw.
   */
  const ariaTextValue = computed(() => {
    const text = toValue(options.textValue);

    if (text === "") return stringFormatter.value.format("Empty");

    return (text ?? String(value.value)).replace("-", "−");
  });

  // Announced rather than left to `aria-valuetext`: a screen reader does not reliably re-read a
  // changed attribute on a control that already has focus.
  watch(ariaTextValue, (next) => {
    if (!isFocused) return;

    announce("");
    announce(next);
  });

  const canStepUp = () => {
    const max = maxValue.value;
    const current = value.value;

    if (max === undefined || Number.isNaN(max)) return true;
    if (current === undefined || Number.isNaN(current)) return true;

    return current < max;
  };

  const canStepDown = () => {
    const min = minValue.value;
    const current = value.value;

    if (min === undefined || Number.isNaN(min)) return true;
    if (current === undefined || Number.isNaN(current)) return true;

    return current > min;
  };

  // Each repeat arms the next one instead of running on an interval, so reaching the end of the
  // range stops the chain rather than firing steps that do nothing.
  const armUp = (delay: number) => {
    clearAsync();
    isSpinning = true;
    timer = setTimeout(() => {
      if (!canStepUp()) return;

      options.onIncrement?.();
      armUp(REPEAT_DELAY);
    }, delay);
  };

  const armDown = (delay: number) => {
    clearAsync();
    isSpinning = true;
    timer = setTimeout(() => {
      if (!canStepDown()) return;

      options.onDecrement?.();
      armDown(REPEAT_DELAY);
    }, delay);
  };

  const onFocus = () => {
    isFocused = true;
  };

  const onBlur = () => {
    isFocused = false;
  };

  const shortcuts: Record<SpinKey, () => boolean> = {
    ArrowDown: () => {
      if (!options.onDecrement) return false;
      options.onDecrement();

      return true;
    },
    ArrowUp: () => {
      if (!options.onIncrement) return false;
      options.onIncrement();

      return true;
    },
    End: () => {
      if (!options.onIncrementToMax) return false;
      options.onIncrementToMax();

      return true;
    },
    Home: () => {
      if (!options.onDecrementToMin) return false;
      options.onDecrementToMin();

      return true;
    },
    PageDown: () => {
      if (options.onDecrementPage) {
        options.onDecrementPage();

        return true;
      }

      if (options.onDecrement) {
        options.onDecrement();

        return true;
      }

      return false;
    },
    PageUp: () => {
      if (options.onIncrementPage) {
        options.onIncrementPage();

        return true;
      }

      if (options.onIncrement) {
        options.onIncrement();

        return true;
      }

      return false;
    },
  };

  // Repeats are allowed through on purpose: holding an arrow key is a legitimate way to run the
  // value up, and the browser's own key repeat is what drives it.
  const onKeydown = (event: KeyboardEvent) => {
    if (isDisabled.value || isReadOnly.value) return;

    /*
     * A key held with a modifier is a different key, and none of these are bound with one. Upstream
     * matches the whole combination rather than the key alone, so Alt with an arrow falls through
     * to whatever is listening above — which is how a date picker's popover is opened from a
     * segment.
     */
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const shortcut = shortcuts[event.key as SpinKey];

    if (!shortcut) return;
    // A handler that declines leaves the key to whatever else wants it — Home and End belong to
    // the caret when the field has no range to jump to.
    if (!shortcut()) return;

    event.preventDefault();
    event.stopPropagation();
  };

  const stepper = (
    step: () => (() => void) | undefined,
    arm: (delay: number) => void,
  ): SpinStepperHandlers => ({
    onPressEnd: (pointerType) => {
      clearAsync();

      // The step a touch did not take on the way down happens here, but only if the finger came
      // up on the button and the hold never turned into a repeat.
      if (pointerType === "touch" && !isSpinning && isUp) step()?.();

      isUp = false;
    },
    onPressStart: (pointerType) => {
      clearAsync();

      if (pointerType === "touch") {
        isUp = false;
        arm(INITIAL_DELAY_TOUCH);

        return;
      }

      step()?.();
      arm(INITIAL_DELAY_MOUSE);
    },
    onPressUp: (pointerType) => {
      clearAsync();
      if (pointerType === "touch") isUp = true;
    },
  });

  const attrs = computed<Record<string, unknown>>(() => {
    const current = value.value;

    const all: Record<string, unknown> = {
      "aria-disabled": isDisabled.value || undefined,
      "aria-readonly": isReadOnly.value || undefined,
      "aria-required": toValue(options.isRequired) || undefined,
      "aria-valuemax": maxValue.value,
      "aria-valuemin": minValue.value,
      "aria-valuenow": current !== undefined && !Number.isNaN(current) ? current : undefined,
      "aria-valuetext": ariaTextValue.value,
      role: "spinbutton",
    };

    for (const key of Object.keys(all)) {
      if (all[key] === undefined) delete all[key];
    }

    return all;
  });

  return {
    attrs,
    decrement: stepper(() => options.onDecrement, armDown),
    increment: stepper(() => options.onIncrement, armUp),
    onBlur,
    onFocus,
    onKeydown,
  };
};
