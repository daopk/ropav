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

export interface FieldProps {
    id?: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
}
