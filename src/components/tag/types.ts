import type { Size, SemanticColor } from '@/types/common';

export interface TagProps {
    variant?: 'solid' | 'outline' | 'subtle';
    color?: SemanticColor;
    size?: Size;
    closable?: boolean;
}
