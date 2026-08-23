import type {ColorAreaState} from "./use-color-area-state";
import type {MoveMoveEvent} from "./use-move";
import type {ColorChannel} from "../utils/color-types";
import type {CSSProperties, ComputedRef, MaybeRefOrGetter, Ref} from "vue";

import {computed, nextTick, onScopeDispose, shallowRef, toValue, watch} from "vue";

import {colorStrings} from "../i18n/color";
import {setFormValue} from "../utils/form-value";
import {visuallyHiddenStyle} from "../utils/visually-hidden";

import {useColorAreaGradient} from "./use-color-area-gradient";
import {useFormReset} from "./use-form-reset";
import {useLabels} from "./use-labels";
import {useLocale} from "./use-locale";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";
import {useMove} from "./use-move";

/** Which of the two hidden inputs a change came through, or neither. */
type FocusedInput = "x" | "y" | null;

export interface ColorAreaInputAttrs {
  id: string;
  type: "range";
  min: number;
  max: number;
  step: number;
  value: number;
  name: string | undefined;
  form: string | undefined;
  disabled: boolean;
  tabindex: number | undefined;
  "aria-hidden": "true" | undefined;
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
  "aria-describedby": string | undefined;
  "aria-orientation": "horizontal" | "vertical";
  "aria-roledescription": string;
  "aria-valuetext": string;
}

export interface UseColorAreaOptions {
  state: ColorAreaState;
  /** The area element. Its size is what a drag is measured against. */
  containerEl: Ref<HTMLElement | null>;
  /** The visually hidden range input for the horizontal channel. */
  inputXEl: Ref<HTMLInputElement | null>;
  /** The visually hidden range input for the vertical channel. */
  inputYEl: Ref<HTMLInputElement | null>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Id override for the area element. */
  id?: MaybeRefOrGetter<string | undefined>;
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  ariaDescribedby?: MaybeRefOrGetter<string | undefined>;
  /** Name the horizontal channel is submitted under. */
  xName?: MaybeRefOrGetter<string | undefined>;
  /** Name the vertical channel is submitted under. */
  yName?: MaybeRefOrGetter<string | undefined>;
  /** `id` of the form to submit with, for an area rendered outside it. */
  form?: MaybeRefOrGetter<string | undefined>;
}

export interface ColorAreaAttrs {
  role: "group";
  id: string;
  "aria-label": string | undefined;
  "aria-labelledby": string | undefined;
}

export interface UseColorAreaReturn {
  areaAttrs: ComputedRef<ColorAreaAttrs>;
  areaStyle: ComputedRef<CSSProperties>;
  /**
   * A press anywhere on the area jumps the colour there **and** keeps dragging it. Attach with
   * `@pointerdown`, never through `v-bind`: a vapor render re-attaches every `on*` key that
   * arrived that way, which drops the listener when the press itself re-rendered the element.
   */
  areaHandlers: {onPointerdown: (event: PointerEvent) => void};
  thumbAttrs: {role: "presentation"};
  thumbStyle: ComputedRef<CSSProperties>;
  thumbHandlers: {
    onFocusout: (event: FocusEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
    onPointerdown: (event: PointerEvent) => void;
  };
  xInputProps: ComputedRef<ColorAreaInputAttrs>;
  yInputProps: ComputedRef<ColorAreaInputAttrs>;
  /** Takes an input out of sight while leaving it focusable, and lets a press through it. */
  inputStyle: CSSProperties;
  xInputHandlers: {onChange: (event: Event) => void; onFocus: () => void};
  yInputHandlers: {onChange: (event: Event) => void; onFocus: () => void};
  isDisabled: ComputedRef<boolean>;
}

/**
 * A two dimensional colour control: two channels on two axes, one thumb, two hidden inputs.
 *
 * Ported from React Aria's `packages/react-aria/src/color/useColorArea.ts` (react-aria 3.51.0).
 * Four things here are easy to port wrongly, and each of them is invisible in a screenshot:
 *
 * - **Two move handlers, not one.** The thumb has its own, and the *container* has a second one
 *   gated on a flag set by a press that landed on the area itself. That is what makes a press on
 *   the background jump the colour there and then carry on as a drag, rather than needing a second
 *   press on the thumb.
 * - **`Home` / `End` page along x, they do not jump to the ends.** `PageUp` / `PageDown` page along
 *   y. This is *not* the slider's meaning of those keys, so copying them from `useSliderThumb`
 *   would silently give a colour area the wrong keyboard.
 * - **`aria-valuetext` has two shapes**, and which one is used depends on whether the value was
 *   last changed with the keyboard: before that a screen reader hears all three channels, after it
 *   only the one that moved. Both flags reset when focus leaves.
 * - **The two inputs juggle `tabindex` and `aria-hidden`** so that assistive technology lists one
 *   two-dimensional control rather than two sliders — until the keyboard is used, at which point
 *   both are revealed so each channel can be read.
 *
 * @example
 * ```ts
 * const area = useColorArea({containerEl, inputXEl, inputYEl, state});
 * // <div v-bind="area.areaAttrs.value" @pointerdown="area.areaHandlers.onPointerdown">
 * ```
 */
export const useColorArea = (options: UseColorAreaOptions): UseColorAreaReturn => {
  const {containerEl, inputXEl, inputYEl, state} = options;

  const locale = useLocale();
  const strings = useLocalizedStringFormatter(colorStrings);
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));

  const focusedInput = shallowRef<FocusedInput>(null);
  const valueChangedViaKeyboard = shallowRef(false);
  const valueChangedViaInputChangeEvent = shallowRef(false);

  const focusInput = (element: Ref<HTMLInputElement | null> = inputXEl) => {
    // Without `preventScroll` an area near the edge of a scroll container drags the page as it
    // takes focus, which reads as the thumb jumping.
    element.value?.focus({preventScroll: true});
  };

  /**
   * Put both inputs back to what the state holds, attribute included.
   *
   * Vapor writes `value` as a property and skips the write when the bound value has not changed —
   * and a form reset does not go through the binding at all. Without a `value` *attribute* the
   * browser puts a reset range input back to the **midpoint of its range**, which for a hue is
   * 180°, so one axis of a reset colour area would show a value the state never had. Keeping the
   * attribute in step is what makes the restore land on the right value. See {@link setFormValue}.
   */
  const reassert = () => {
    setFormValue(inputXEl.value, String(state.xValue.value));
    setFormValue(inputYEl.value, String(state.yValue.value));
  };

  watch([inputXEl, inputYEl, state.xValue, state.yValue], reassert, {
    flush: "post",
    immediate: true,
  });

  useFormReset(
    inputXEl,
    () => state.defaultValue.value,
    (value) => {
      state.setValue(value);
      // Belt and braces alongside the attribute the watcher above keeps in step: this covers a
      // reset called from script, where the restore happens before that watcher has run.
      void nextTick(reassert);
    },
  );

  /** Where the thumb is during a drag, in fractions of the area — not in pixels. */
  let currentPosition: {x: number; y: number} | null = null;
  /** The pointer that owns the interaction in flight, if any. */
  let currentPointer: number | null | undefined;
  /** Whether the press that started this interaction landed on the area rather than the thumb. */
  let isOnColorArea = false;
  let detachRelease: (() => void) | undefined;

  const onMoveStart = () => {
    currentPosition = null;
    state.setDragging(true);
  };

  const onMove = ({deltaX, deltaY, pointerType, shiftKey}: MoveMoveEvent) => {
    currentPosition ??= state.getThumbPosition();

    const rect = containerEl.value?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;
    const valueChanged = deltaX !== 0 || deltaY !== 0;
    const isRTL = locale.value.direction === "rtl";

    if (pointerType === "keyboard") {
      // Shift takes a page, but only when a page is actually bigger than a step — for a channel
      // where they are equal it would otherwise look like shift did nothing.
      const stepX =
        shiftKey && state.xChannelPageStep.value > state.xChannelStep.value
          ? state.xChannelPageStep.value
          : state.xChannelStep.value;
      const stepY =
        shiftKey && state.yChannelPageStep.value > state.yChannelStep.value
          ? state.yChannelPageStep.value
          : state.yChannelStep.value;

      if ((deltaX > 0 && !isRTL) || (deltaX < 0 && isRTL)) state.incrementX(stepX);
      else if ((deltaX < 0 && !isRTL) || (deltaX > 0 && isRTL)) state.decrementX(stepX);
      else if (deltaY > 0) state.decrementY(stepY);
      else if (deltaY < 0) state.incrementY(stepY);

      valueChangedViaKeyboard.value = valueChanged;
      // Whichever axis moved further is the one a screen reader should be reading.
      focusedInput.value = valueChanged && Math.abs(deltaY) > Math.abs(deltaX) ? "y" : "x";

      return;
    }

    currentPosition.x += ((isRTL ? -1 : 1) * deltaX) / width;
    currentPosition.y += deltaY / height;
    state.setColorFromPoint(currentPosition.x, currentPosition.y);
  };

  const onMoveEnd = () => {
    isOnColorArea = false;
    state.setDragging(false);
    focusInput(focusedInput.value === "y" ? inputYEl : inputXEl);
  };

  const {handlers: thumbMove} = useMove({onMove, onMoveEnd, onMoveStart});

  // A press that lands on the area keeps dragging from there, so the container needs a move
  // machine of its own — gated, or every pointer move over the area would move the colour.
  const {handlers: containerMove} = useMove({
    onMove: (event) => isOnColorArea && onMove(event),
    onMoveEnd: () => isOnColorArea && onMoveEnd(),
    onMoveStart: () => isOnColorArea && onMoveStart(),
  });

  /** Bracket a keyboard change in a drag, so the interaction reports an end of its own. */
  const keyboardUpdate = (
    update: () => void,
    element: Ref<HTMLInputElement | null>,
    input: "x" | "y",
  ) => {
    state.setDragging(true);
    valueChangedViaKeyboard.value = true;
    update();
    state.setDragging(false);
    focusInput(element);
    focusedInput.value = input;
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (isDisabled.value) return;

    const isRTL = locale.value.direction === "rtl";

    switch (event.key) {
      case "PageUp":
        keyboardUpdate(() => state.incrementY(state.yChannelPageStep.value), inputYEl, "y");
        break;
      case "PageDown":
        keyboardUpdate(() => state.decrementY(state.yChannelPageStep.value), inputYEl, "y");
        break;
      // Not "jump to the end" the way a slider reads them: on a colour area both page along x.
      case "Home":
        keyboardUpdate(
          () =>
            isRTL
              ? state.incrementX(state.xChannelPageStep.value)
              : state.decrementX(state.xChannelPageStep.value),
          inputXEl,
          "x",
        );
        break;
      case "End":
        keyboardUpdate(
          () =>
            isRTL
              ? state.decrementX(state.xChannelPageStep.value)
              : state.incrementX(state.xChannelPageStep.value),
          inputXEl,
          "x",
        );
        break;
      default:
        // Arrows are the move machinery's business, and everything else is the browser's.
        thumbMove.onKeydown(event);

        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  /** Anything but the primary button, or a modified click, belongs to the browser. */
  const isForeignPress = (event: PointerEvent) =>
    event.pointerType === "mouse" &&
    (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey);

  const onRelease = (event: PointerEvent) => {
    if (event.pointerId !== currentPointer) return;

    valueChangedViaKeyboard.value = false;
    focusInput();
    state.setDragging(false);
    currentPointer = undefined;
    isOnColorArea = false;
    detachRelease?.();
  };

  const watchRelease = () => {
    window.addEventListener("pointerup", onRelease, false);
    window.addEventListener("pointercancel", onRelease, false);

    detachRelease = () => {
      window.removeEventListener("pointerup", onRelease, false);
      window.removeEventListener("pointercancel", onRelease, false);
      detachRelease = undefined;
    };
  };

  const onThumbPointerdown = (event: PointerEvent) => {
    if (isDisabled.value || isForeignPress(event)) return;

    if (!state.isDragging.value) {
      currentPointer = event.pointerId;
      valueChangedViaKeyboard.value = false;
      focusInput();
      state.setDragging(true);
      watchRelease();
    }

    // The drag itself is the move machinery's, and it has to see the press that started it.
    thumbMove.onPointerdown(event);
  };

  const onAreaPointerdown = (event: PointerEvent) => {
    if (isDisabled.value || isForeignPress(event)) return;

    const area = event.currentTarget;

    if (area instanceof Element) {
      const rect = area.getBoundingClientRect();
      let x = (event.clientX - rect.x) / rect.width;
      const y = (event.clientY - rect.y) / rect.height;

      if (locale.value.direction === "rtl") x = 1 - x;

      // A press outside the box, or one arriving while something else is already dragging, is
      // not ours. In a layout-less environment `rect` is all zeroes and the division gives
      // `NaN`, which fails this guard — so a synthetic press there is a silent no-op.
      if (
        x >= 0 &&
        x <= 1 &&
        y >= 0 &&
        y <= 1 &&
        !state.isDragging.value &&
        currentPointer === undefined
      ) {
        isOnColorArea = true;
        valueChangedViaKeyboard.value = false;
        currentPointer = event.pointerId;
        state.setColorFromPoint(x, y);
        focusInput();
        state.setDragging(true);
        watchRelease();
      }
    }

    // After the press has claimed the area, so the first move continues from where it landed.
    containerMove.onPointerdown(event);
  };

  onScopeDispose(() => detachRelease?.(), true);

  const onChange = (event: Event) => {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) return;

    valueChangedViaInputChangeEvent.value = true;

    if (input === inputXEl.value) state.setXValue(parseFloat(input.value));
    else if (input === inputYEl.value) state.setYValue(parseFloat(input.value));
  };

  const colorPickerLabel = computed(() => strings.value.format("colorPicker") as string);

  /**
   * The value text a screen reader reads for one channel.
   *
   * Before the value has been touched it reads all three channels, so the listener knows where in
   * the square they are; once a keystroke or an input change has moved one channel, only that
   * channel is read, so a stream of arrow presses is not a stream of three-channel sentences.
   */
  const valueTextFor = (channel: ColorChannel) => {
    const color = state.getDisplayColor();
    const {xChannel, yChannel, zChannel} = state.channels.value;
    const tag = locale.value.locale;
    const nameAndValue = (of: ColorChannel) =>
      strings.value.format("colorNameAndValue", {
        name: color.getChannelName(of, tag),
        value: color.formatChannelValue(of, tag),
      }) as string;

    const head =
      valueChangedViaInputChangeEvent.value || valueChangedViaKeyboard.value
        ? nameAndValue(channel)
        : [
            nameAndValue(channel),
            nameAndValue(channel === yChannel ? xChannel : yChannel),
            nameAndValue(zChannel),
          ].join(", ");

    return `${head}, ${color.getColorName(tag)}`;
  };

  /**
   * Both inputs are named for the whole control, not for their own channel: they are two halves of
   * one two-dimensional slider, and naming them separately would announce two controls.
   */
  const inputLabel = computed(() => {
    const given = toValue(options.ariaLabel);

    if (!given) return colorPickerLabel.value;

    return strings.value.format("colorInputLabel", {
      channelLabel: colorPickerLabel.value,
      label: given,
    }) as string;
  });

  const areaLabels = useLabels(() => {
    const given = toValue(options.ariaLabel);

    return {
      "aria-label": given ? `${given}, ${colorPickerLabel.value}` : undefined,
      "aria-labelledby": toValue(options.ariaLabelledby),
      id: toValue(options.id),
    };
  });

  const gradient = useColorAreaGradient({direction: () => locale.value.direction, state});

  const inputFor = (axis: "x" | "y"): ComputedRef<ColorAreaInputAttrs> =>
    computed(() => {
      const isX = axis === "x";
      const channel = isX ? state.channels.value.xChannel : state.channels.value.yChannel;
      const range = state.value.value.getChannelRange(channel);
      const id = `${areaLabels.value.id}-${axis}`;
      const labelledby = toValue(options.ariaLabelledby);
      /**
       * Only one of the two is reachable at a time, so a tab stop lands on a single control. The
       * x input is the one that answers before anything has focus, which is why its condition
       * also covers `null`.
       */
      const isReachable = isX
        ? !focusedInput.value || focusedInput.value === "x"
        : focusedInput.value === "y";

      return {
        "aria-describedby": toValue(options.ariaDescribedby),
        /**
         * Hidden so that listing the form controls shows one two-dimensional slider rather than
         * two — but revealed again once the keyboard has moved the value, because then each
         * channel has to be readable on its own.
         */
        "aria-hidden": isReachable || valueChangedViaKeyboard.value ? undefined : "true",
        "aria-label": inputLabel.value,
        // `aria-labelledby` wins outright over `aria-label`, so the input's own id goes first to
        // keep its label part of the name. Same rule `useLabels` applies.
        "aria-labelledby": labelledby ? `${id} ${labelledby}` : undefined,
        "aria-orientation": isX ? ("horizontal" as const) : ("vertical" as const),
        "aria-roledescription": strings.value.format("twoDimensionalSlider") as string,
        "aria-valuetext": valueTextFor(channel),
        disabled: isDisabled.value,
        form: toValue(options.form),
        id,
        max: range.maxValue,
        min: range.minValue,
        name: toValue(isX ? options.xName : options.yName),
        step: isX ? state.xChannelStep.value : state.yChannelStep.value,
        tabindex: isReachable ? undefined : -1,
        type: "range" as const,
        value: isX ? state.xValue.value : state.yValue.value,
      };
    });

  return {
    areaAttrs: computed(() => ({
      "aria-label": areaLabels.value["aria-label"],
      "aria-labelledby": areaLabels.value["aria-labelledby"],
      id: areaLabels.value.id,
      role: "group",
    })),
    areaHandlers: {onPointerdown: onAreaPointerdown},
    areaStyle: gradient.areaStyle,
    inputStyle: {
      ...visuallyHiddenStyle,
      // Filling the area rather than sitting in a 1px box, with the pointer passing straight
      // through: that is what lets a press reach the area while keydown still bubbles up from the
      // focused input to the thumb that handles it.
      height: "100%",
      opacity: 0.0001,
      pointerEvents: "none",
      width: "100%",
    },
    isDisabled,
    thumbAttrs: {role: "presentation"},
    thumbHandlers: {
      onFocusout: (event: FocusEvent) => {
        const {currentTarget, relatedTarget} = event;

        // Focus moving between the two inputs never leaves the thumb, and the flags have to
        // survive that — they only reset when the control as a whole is left.
        if (
          currentTarget instanceof Node &&
          relatedTarget instanceof Node &&
          currentTarget.contains(relatedTarget)
        ) {
          return;
        }

        valueChangedViaKeyboard.value = false;
        valueChangedViaInputChangeEvent.value = false;
      },
      onKeydown,
      onPointerdown: onThumbPointerdown,
    },
    thumbStyle: gradient.thumbStyle,
    xInputHandlers: {
      onChange,
      onFocus: () => {
        focusedInput.value = "x";
      },
    },
    xInputProps: inputFor("x"),
    yInputHandlers: {
      onChange,
      onFocus: () => {
        focusedInput.value = "y";
      },
    },
    yInputProps: inputFor("y"),
  };
};
