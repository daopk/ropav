import type { TextareaHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const textareaParts = ['root', 'input'] as const;
export type TextareaPart = (typeof textareaParts)[number];

export type TextareaRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextareaResize = 'none' | 'vertical' | 'both';

export interface TextareaProps extends StylesApiProps<TextareaPart> {
    id?: string;
    name?: string;
    modelValue: string;
    size?: TextareaSize;
    radius?: TextareaRadius;
    resize?: TextareaResize;
    autosize?: boolean;
    minRows?: number;
    maxRows?: number;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: TextareaHTMLAttributes;
}
