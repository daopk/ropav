export interface ButtonProps {
    variant?: 'solid' | 'outline' | 'ghost' | 'link';
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
}
