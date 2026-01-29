export interface InputProps {
    modelValue?: string | number;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    readonly?: boolean;
    clearable?: boolean;
    block?: boolean;
}
