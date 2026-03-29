import type { Size, SemanticColor } from '@/types/common';

export interface AlertProps {
    color?: SemanticColor;
    variant?: 'subtle' | 'solid' | 'outline';
    size?: Size;
    closable?: boolean;
    title?: string;
}
