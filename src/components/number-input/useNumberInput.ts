import { computed, type InputHTMLAttributes } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import type {
    NumberInputControlsPosition,
    NumberInputProps,
    NumberInputTextAlign,
    NumberInputValue,
} from './types';

export interface NumberInputBounds {
    min: number | undefined;
    max: number | undefined;
}

type StepDirection = -1 | 1;

export type NumberInputControl = 'decrement' | 'increment';

function finiteOrUndefined(value: number | undefined) {
    return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function normalizeZero(value: number) {
    return Object.is(value, -0) ? 0 : value;
}

function getDecimalPlaces(value: number) {
    const [coefficient = '', exponentText] = String(value).toLowerCase().split('e');
    const fractionLength = coefficient.split('.')[1]?.length ?? 0;
    const exponent = Number(exponentText ?? 0);

    return Math.max(0, fractionLength - (Number.isFinite(exponent) ? exponent : 0));
}

function roundWithPrecision(value: number, ...operands: number[]) {
    const precision = Math.min(15, Math.max(0, ...operands.map(getDecimalPlaces)));
    return normalizeZero(Number(value.toFixed(precision)));
}

export function normalizeNumberInputBounds(
    min: number | undefined,
    max: number | undefined,
): NumberInputBounds {
    const safeMin = finiteOrUndefined(min);
    const safeMax = finiteOrUndefined(max);

    if (safeMin !== undefined && safeMax !== undefined && safeMax < safeMin) {
        return { min: safeMax, max: safeMin };
    }

    return { min: safeMin, max: safeMax };
}

export function normalizeNumberInputStep(step: number | undefined) {
    return step !== undefined && Number.isFinite(step) && step > 0 ? step : 1;
}

export function clampNumberInputValue(value: number, bounds: NumberInputBounds) {
    const aboveMin = bounds.min === undefined ? value : Math.max(bounds.min, value);
    const withinBounds = bounds.max === undefined ? aboveMin : Math.min(bounds.max, aboveMin);

    return normalizeZero(withinBounds);
}

export function stepNumberInputValue(
    value: NumberInputValue,
    direction: StepDirection,
    step: number,
    bounds: NumberInputBounds,
) {
    const current = value ?? 0;
    const rawNext = current + direction * step;

    if (!Number.isFinite(rawNext)) {
        if (direction === 1 && bounds.max !== undefined) return bounds.max;
        if (direction === -1 && bounds.min !== undefined) return bounds.min;
        return normalizeZero(current);
    }

    const next = roundWithPrecision(rawNext, current, step);

    return clampNumberInputValue(next, bounds);
}

export function parseNumberInputValue(value: string): NumberInputValue {
    if (value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? normalizeZero(parsed) : null;
}

export function normalizeNumberInputControlsPosition(
    position: NumberInputControlsPosition | undefined,
): NumberInputControlsPosition {
    return position === 'left' || position === 'split' ? position : 'right';
}

export function normalizeNumberInputTextAlign(
    textAlign: NumberInputTextAlign | undefined,
): NumberInputTextAlign {
    return textAlign === 'center' || textAlign === 'right' ? textAlign : 'left';
}

export function getModelInputValue(value: NumberInputValue) {
    return value !== null && Number.isFinite(value) ? String(normalizeZero(value)) : '';
}

export function useNumberInput(
    props: Readonly<NumberInputProps>,
    emitUpdate: (value: NumberInputValue) => void,
    getValue: () => NumberInputValue = () => props.modelValue ?? null,
) {
    const control = useControlState(props);
    const bounds = computed(() => normalizeNumberInputBounds(props.min, props.max));
    const nativeStep = computed(() => normalizeNumberInputStep(props.step));
    const currentValue = computed(getValue);
    const modelInputValue = computed(() => getModelInputValue(currentValue.value));
    const isInteractive = computed(() => !control.disabled && !props.readonly);
    const controlsPosition = computed(() =>
        normalizeNumberInputControlsPosition(props.controlsPosition),
    );
    const textAlign = computed(() => normalizeNumberInputTextAlign(props.textAlign));
    const leftControls = computed<NumberInputControl[]>(() => {
        if (!props.controls || controlsPosition.value === 'right') return [];
        if (controlsPosition.value === 'split') return ['decrement'];

        return ['decrement', 'increment'];
    });
    const rightControls = computed<NumberInputControl[]>(() => {
        if (!props.controls || controlsPosition.value === 'left') return [];
        if (controlsPosition.value === 'split') return ['increment'];

        return ['decrement', 'increment'];
    });

    const rootClass = computed(() =>
        bem('rp-number-input', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            controls: props.controls,
            [`controls-${controlsPosition.value}`]: props.controls,
            [`text-align-${textAlign.value}`]: true,
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            readonly: props.readonly,
        }),
    );

    const canIncrement = computed(() => {
        if (!isInteractive.value) return false;
        if (currentValue.value === null || !Number.isFinite(currentValue.value)) return true;

        return bounds.value.max === undefined || currentValue.value < bounds.value.max;
    });

    const canDecrement = computed(() => {
        if (!isInteractive.value) return false;
        if (currentValue.value === null || !Number.isFinite(currentValue.value)) return true;

        return bounds.value.min === undefined || currentValue.value > bounds.value.min;
    });

    function emitStep(direction: StepDirection) {
        const canStep = direction === 1 ? canIncrement.value : canDecrement.value;
        if (!canStep) return false;

        const current = Number.isFinite(currentValue.value) ? currentValue.value : null;
        const next = stepNumberInputValue(current, direction, nativeStep.value, bounds.value);
        if (current !== null && next === current) return false;

        emitUpdate(next);
        return true;
    }

    function onInputUpdate(value: string) {
        if (!isInteractive.value) return;
        emitUpdate(parseNumberInputValue(value));
    }

    function onKeydown(event: KeyboardEvent) {
        if (!isInteractive.value) return;

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            emitStep(1);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            emitStep(-1);
        }
    }

    function onBlur(event: FocusEvent) {
        if (!isInteractive.value || !props.clampOnBlur) return;

        const input = event.currentTarget;
        if (!(input instanceof HTMLInputElement) || input.value === '') return;

        const current = parseNumberInputValue(input.value);
        if (current === null) {
            input.value = modelInputValue.value;
            return;
        }

        const next = clampNumberInputValue(current, bounds.value);
        if (next === current) return;

        input.value = String(next);
        emitUpdate(next);
    }

    const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
        const attrs = props.inputAttrs ?? {};

        return {
            ...attrs,
            min: bounds.value.min,
            max: bounds.value.max,
            step: nativeStep.value,
            inputmode: attrs.inputmode ?? 'decimal',
            style: [attrs.style, { textAlign: textAlign.value }],
            onBlur(event) {
                onBlur(event);
                attrs.onBlur?.(event);
            },
            onKeydown(event) {
                onKeydown(event);
                attrs.onKeydown?.(event);
            },
        };
    });

    return {
        control,
        rootClass,
        bounds,
        nativeStep,
        nativeInputAttrs,
        modelInputValue,
        leftControls,
        rightControls,
        canIncrement,
        canDecrement,
        increment: () => emitStep(1),
        decrement: () => emitStep(-1),
        onInputUpdate,
    };
}
