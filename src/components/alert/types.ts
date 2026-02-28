import type { StatusColor } from '@/types/common';

export interface AlertProps {
    color?: StatusColor;
    variant?: 'subtle' | 'solid' | 'outline';
    closable?: boolean;
    title?: string;
}
