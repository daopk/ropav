import type { Size } from '@/types/common';

export interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: Size;
    shape?: 'circle' | 'square';
}
