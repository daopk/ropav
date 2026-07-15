import type { InputHTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const switchParts = ['root', 'input', 'track', 'thumb', 'label'] as const;

export type SwitchPart = (typeof switchParts)[number];

export type SwitchColor = ComponentColorValue;

export type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SwitchProps extends StylesApiProps<SwitchPart> {
    id?: string;
    name?: string;
    modelValue: boolean;
    color?: SwitchColor;
    size?: SwitchSize;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
}
