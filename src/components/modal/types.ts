import type { Ref } from 'vue';
import type { OverlayProps } from '../overlay/types';

export type ModalPresetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type ModalSize = ModalPresetSize | (string & {});

export type ModalRole = 'dialog' | 'alertdialog';

export type ModalInitialFocus = string | HTMLElement | Ref<HTMLElement | null | undefined>;

export type ModalOverlayProps = Pick<OverlayProps, 'color' | 'opacity' | 'gradient' | 'blur'>;

export interface ModalSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface ModalProps {
    id?: string;
    open?: boolean;
    defaultOpen?: boolean;
    title?: string;
    description?: string;
    ariaLabel?: string;
    closeLabel?: string;
    role?: ModalRole;
    size?: ModalSize;
    initialFocus?: ModalInitialFocus | null;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    overlayProps?: ModalOverlayProps;
    preventScroll?: boolean;
    returnFocus?: boolean;
    keepMounted?: boolean;
}
