import type { InputHTMLAttributes } from 'vue';
import type { InputRadius, InputSize } from '../input/types';

export type NumberInputValue = number | null;

export type NumberInputRadius = InputRadius;

export type NumberInputSize = InputSize;

export interface NumberInputProps {
    id?: string;
    name?: string;
    modelValue: NumberInputValue;
    min?: number;
    max?: number;
    step?: number;
    size?: NumberInputSize;
    radius?: NumberInputRadius;
    placeholder?: string;
    controls?: boolean;
    clampOnBlur?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
    incrementLabel?: string;
    decrementLabel?: string;
}
