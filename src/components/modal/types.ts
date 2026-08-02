import type { Ref } from 'vue';
import type { FocusTrapOptions } from '../focus-trap/types';
import type { TeleportProps } from '../floating/types';
import type { OverlayProps } from '../overlay/types';
import type { StylesApiProps } from '../../styles-api';
import type { DialogCloseReason } from '../dialog/types';

export const modalParts = [
    'root',
    'overlay',
    'panel',
    'header',
    'title',
    'description',
    'body',
    'footer',
    'close',
] as const;
export type ModalPart = (typeof modalParts)[number];

export type ModalPresetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type ModalSize = ModalPresetSize | (string & {});

export type ModalRole = 'dialog' | 'alertdialog';

export type ModalInitialFocus = string | HTMLElement | Ref<HTMLElement | null | undefined>;

export type ModalOverlayProps = Pick<OverlayProps, 'color' | 'opacity' | 'gradient' | 'blur'>;

export type ModalFocusTrapOptions = Omit<
    FocusTrapOptions,
    | 'allowOutsideClick'
    | 'clickOutsideDeactivates'
    | 'escapeDeactivates'
    | 'fallbackFocus'
    | 'initialFocus'
    | 'preventScroll'
    | 'returnFocusOnDeactivate'
>;

export interface ModalSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface ModalProps extends TeleportProps, StylesApiProps<ModalPart> {
    id?: string;
    open?: boolean;
    baseZIndex?: number;
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
    modal?: boolean;
    focusTrapOptions?: ModalFocusTrapOptions;
}

export type { DialogCloseReason as ModalCloseReason };
