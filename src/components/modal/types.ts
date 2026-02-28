import type { Size } from '@/types/common';

export interface ModalProps {
    modelValue?: boolean;
    title?: string;
    footer?: string;
    showFooter?: boolean;
    size?: Size;
    closable?: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
}
