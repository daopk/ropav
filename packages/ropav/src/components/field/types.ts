export interface FieldControlProps {
    id: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    labelledby?: string;
    describedby?: string;
}

export interface FieldSlotProps extends FieldControlProps {
    controlProps: FieldControlProps;
}

export interface FieldProps extends StylesApiProps<FieldPart> {
    id?: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
}
import type { StylesApiProps } from '../../styles-api';

export const fieldParts = ['root', 'label', 'required', 'control', 'description'] as const;
export type FieldPart = (typeof fieldParts)[number];
