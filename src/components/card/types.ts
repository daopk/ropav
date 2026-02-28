import type { Size } from '@/types/common';

export interface CardProps {
    variant?: 'elevated' | 'outline' | 'filled';
    size?: Size;
    header?: string;
    footer?: string;
    showHeader?: boolean;
    showFooter?: boolean;
}
