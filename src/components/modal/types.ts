export interface ModalProps {
    modelValue?: boolean;
    title?: string;
    footer?: string;
    showFooter?: boolean;
    size?: 'sm' | 'md' | 'lg';
    closable?: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
}
