import { computed, useTemplateRef, type InputHTMLAttributes } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import {
    provideNestedFormControlOwner,
    useFormControl,
} from '@/internal/composables/useFormControl';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import {
    clampNumberInputValue,
    getModelInputValue,
    normalizeNumberInputBounds,
    normalizeNumberInputControlsPosition,
    normalizeNumberInputStep,
    normalizeNumberInputTextAlign,
    parseNumberInputValue,
    stepNumberInputValue,
    type NumberInputControl,
    type NumberInputStepDirection,
} from './numberInputModel';
import type { NumberInputProps, NumberInputValue } from './types';

interface InputComponentHandle {
    readonly nativeElement: HTMLInputElement | null;
}

export function useNumberInput(
    props: Readonly<NumberInputProps>,
    onUpdate: (value: NumberInputValue) => void,
) {
    const controllable = useControllableValue<NumberInputValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: onUpdate,
    });
    const inputComponent = useTemplateRef<InputComponentHandle>('inputComponent');
    provideNestedFormControlOwner();

    const control = useControlState(props);
    const bounds = computed(() => normalizeNumberInputBounds(props.min, props.max));
    const nativeStep = computed(() => normalizeNumberInputStep(props.step));
    const currentValue = controllable.value;
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

    function emitStep(direction: NumberInputStepDirection) {
        const canStep = direction === 1 ? canIncrement.value : canDecrement.value;
        if (!canStep) return false;

        const current = Number.isFinite(currentValue.value) ? currentValue.value : null;
        const next = stepNumberInputValue(current, direction, nativeStep.value, bounds.value);
        if (current !== null && next === current) return false;

        controllable.setValue(next);
        return true;
    }

    function onInputUpdate(value: string) {
        if (!isInteractive.value) return;
        controllable.setValue(parseNumberInputValue(value));
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
        controllable.setValue(next);
    }

    useFormControl({
        elements: () => [inputComponent.value?.nativeElement],
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            (element as HTMLInputElement).defaultValue = getModelInputValue(
                controllable.initialValue,
            );
        },
        validationMessage: () => props.validationMessage,
        readResetValue([element]) {
            controllable.resetValue(parseNumberInputValue((element as HTMLInputElement).value));
        },
        syncControlledValue([element]) {
            (element as HTMLInputElement).value = getModelInputValue(controllable.value.value);
        },
    });

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
