export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export type ButtonVariant = 'solid' | 'ghost';

export interface ButtonProps {
    variant?: ButtonVariant;
    color?: ButtonColor;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}
