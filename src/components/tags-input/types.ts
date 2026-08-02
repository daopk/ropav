import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export type TagsInputValueValidator = (value: string) => boolean;

export type TagsInputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TagsInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TagsInputTagSlotProps {
    value: string;
}

export interface TagsInputProps extends StylesApiProps<TagsInputPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: string[];
    defaultValue?: string[];
    maxTags?: number;
    allowDuplicates?: boolean;
    splitChars?: string[];
    acceptValueOnBlur?: boolean;
    validate?: TagsInputValueValidator;
    size?: TagsInputSize;
    radius?: TagsInputRadius;
    placeholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    removeLabel?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}

export const tagsInputParts = [
    'root',
    'tags',
    'tag',
    'tagLabel',
    'tagRemove',
    'input',
    'clear',
] as const;

export type TagsInputPart = (typeof tagsInputParts)[number];
