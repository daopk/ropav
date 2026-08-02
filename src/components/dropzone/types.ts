import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const dropzoneParts = ['root', 'input', 'content', 'label', 'description'] as const;

export const dropzoneStatuses = ['idle', 'accept', 'reject'] as const;

export const dropzoneErrorCodes = [
    'file-invalid-type',
    'file-too-large',
    'too-many-files',
] as const;

export type DropzonePart = (typeof dropzoneParts)[number];

export type DropzoneStatus = (typeof dropzoneStatuses)[number];

export type DropzoneErrorCode = (typeof dropzoneErrorCodes)[number];

export type DropzoneSize = 'sm' | 'md' | 'lg';

export type DropzoneRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DropzoneFileError {
    code: DropzoneErrorCode;
    message: string;
}

export interface DropzoneFileRejection {
    file: File;
    errors: DropzoneFileError[];
}

export interface DropzoneSelection {
    acceptedFiles: File[];
    rejections: DropzoneFileRejection[];
}

export interface DropzoneSlotProps {
    files: File[];
    rejections: DropzoneFileRejection[];
    status: DropzoneStatus;
    dragging: boolean;
    open: () => void;
    clear: () => void;
}

export interface DropzoneProps extends StylesApiProps<DropzonePart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: File[];
    accept?: string;
    capture?: boolean | 'user' | 'environment';
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
    size?: DropzoneSize;
    radius?: DropzoneRadius;
    label?: string;
    description?: string;
    activateOnClick?: boolean;
    activateOnKeyboard?: boolean;
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
