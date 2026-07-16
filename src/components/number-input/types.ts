import type { InputHTMLAttributes } from 'vue';
import type { InputRadius, InputSize } from '../input/types';
import type { StylesApiProps } from '../../styles-api';

export const numberInputParts = ['root', 'input', 'control'] as const;
export type NumberInputPart = (typeof numberInputParts)[number];

export type NumberInputValue = number | null;

export type NumberInputRadius = InputRadius;

export type NumberInputSize = InputSize;

export type NumberInputControlsPosition = 'left' | 'right' | 'split';

export type NumberInputTextAlign = 'left' | 'center' | 'right';

export interface NumberInputProps extends StylesApiProps<NumberInputPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: NumberInputValue;
    defaultValue?: NumberInputValue;
    min?: number;
    max?: number;
    step?: number;
    size?: NumberInputSize;
    radius?: NumberInputRadius;
    placeholder?: string;
    controls?: boolean;
    controlsPosition?: NumberInputControlsPosition;
    textAlign?: NumberInputTextAlign;
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
