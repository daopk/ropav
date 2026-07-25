import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export type MultiSelectValue = string | number;

export interface MultiSelectOption {
    label: string;
    value: MultiSelectValue;
    disabled?: boolean;
}

export type MultiSelectFilter = (option: MultiSelectOption, searchValue: string) => boolean;

export type MultiSelectRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type MultiSelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MultiSelectOptionSlotProps {
    option: MultiSelectOption;
    selected: boolean;
    highlighted: boolean;
}

export interface MultiSelectPillSlotProps {
    option: MultiSelectOption;
}

export interface MultiSelectEmptySlotProps {
    searchValue: string;
}

export interface MultiSelectProps extends StylesApiProps<MultiSelectPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: MultiSelectValue[];
    defaultValue?: MultiSelectValue[];
    options?: MultiSelectOption[];
    filter?: MultiSelectFilter | false;
    maxValues?: number;
    size?: MultiSelectSize;
    radius?: MultiSelectRadius;
    placeholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    removeLabel?: string;
    toggleLabel?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}

export const multiSelectParts = [
    'root',
    'pills',
    'pill',
    'pillLabel',
    'pillRemove',
    'input',
    'indicator',
    'clear',
    'toggle',
    'content',
    'option',
    'empty',
] as const;

export type MultiSelectPart = (typeof multiSelectParts)[number];
