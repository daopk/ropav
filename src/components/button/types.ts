import type { Size, SemanticColor } from '@/types/common';

export interface ButtonProps {
    variant?: 'solid' | 'outline' | 'ghost' | 'link';
    color?: SemanticColor;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
}
