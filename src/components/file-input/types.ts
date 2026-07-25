import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const fileInputParts = ['root', 'input', 'trigger', 'value'] as const;

export type FileInputPart = (typeof fileInputParts)[number];

export type FileInputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type FileInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FileInputTriggerSlotProps {
    files: File[];
    multiple: boolean;
}

export interface FileInputValueSlotProps {
    files: File[];
    fileNames: string[];
    hasFiles: boolean;
}

export interface FileInputProps extends StylesApiProps<FileInputPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: File[];
    accept?: string;
    capture?: boolean | 'user' | 'environment';
    multiple?: boolean;
    size?: FileInputSize;
    radius?: FileInputRadius;
    buttonLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}
