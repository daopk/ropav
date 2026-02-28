import type { Size, SemanticColor } from '@/types/common';

export interface BadgeProps {
    content?: string | number;
    max?: number;
    dot?: boolean;
    bordered?: boolean;
    placement?: 'corner' | 'edge';
    color?: SemanticColor;
    size?: Size;
    show?: boolean;
}
