import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue';
import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const toastColors = componentColors;

export const toastVariants = ['subtle', 'surface', 'outline', 'solid'] as const;

export const toastRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;

export const toastPositions = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
] as const;

export const toastTypes = ['default', 'success', 'error', 'warning', 'info'] as const;

export type ToastColor = ComponentColorValue;

export type ToastVariant = (typeof toastVariants)[number];

export type ToastRadius = (typeof toastRadiuses)[number];

export type ToastPosition = (typeof toastPositions)[number];

export type ToastType = (typeof toastTypes)[number];

export type ToastRole = 'alert' | 'status' | 'none';

export type ToastCloseReason = 'dismiss' | 'timeout';

export type ToastStateOption<T> = MaybeRefOrGetter<T>;

export type ToastId = string;

export interface ToastProps {
    open?: boolean;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    color?: ToastColor;
    autoContrast?: boolean;
    radius?: ToastRadius;
    role?: ToastRole;
    duration?: number;
    pauseOnHover?: boolean;
    pauseOnFocus?: boolean;
    closable?: boolean;
    closeLabel?: string;
}

export interface ToastStateBindingProps {
    open: boolean;
    'onUpdate:open': (open: boolean) => void;
    onClose: (reason: ToastCloseReason) => void;
}

export interface UseToastStateOptions {
    open?: ToastStateOption<boolean | undefined>;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: (reason: ToastCloseReason) => void;
}

export interface UseToastStateReturn {
    isOpen: ComputedRef<boolean>;
    lastCloseReason: ComputedRef<ToastCloseReason | null>;
    toastProps: ComputedRef<ToastStateBindingProps>;
    setOpen: (open: boolean) => void;
    open: () => void;
    close: (reason?: ToastCloseReason) => void;
    toggle: () => void;
}

export interface ToastProviderProps {
    max?: number;
    duration?: number;
    variant?: ToastVariant;
    color?: ToastColor;
    autoContrast?: boolean;
    radius?: ToastRadius;
    role?: ToastRole;
    pauseOnHover?: boolean;
    pauseOnFocus?: boolean;
    closable?: boolean;
    closeLabel?: string;
}

export interface ToastViewportProps {
    position?: ToastPosition;
    label?: string;
    teleport?: boolean;
    teleportTo?: string | HTMLElement;
}

export interface ToastOptions extends Omit<ToastProps, 'open'> {
    /** Replaces an active toast with the same id and starts a fresh lifecycle. */
    id?: ToastId;
    type?: ToastType;
    onClose?: (reason: ToastCloseReason) => void;
}

export type ToastUpdateOptions = Partial<Omit<ToastOptions, 'id'>>;

export type ToastInput = string | ToastOptions;

export interface ToastItem {
    readonly id: ToastId;
    /** A unique key for this rendered instance, including replacements that reuse an id. */
    readonly instanceId: string;
    readonly type: ToastType;
    readonly props: Readonly<Omit<ToastProps, 'open'>>;
    readonly onClose?: (reason: ToastCloseReason) => void;
}

export interface ToastViewportSlotProps {
    toast: ToastItem;
    dismiss: () => void;
}

export type ToastCreate = (input: ToastInput, options?: ToastOptions) => ToastId;

export interface UseToastReturn {
    toasts: ComputedRef<readonly ToastItem[]>;
    show: ToastCreate;
    success: ToastCreate;
    error: ToastCreate;
    warning: ToastCreate;
    info: ToastCreate;
    update: (id: ToastId, options: ToastUpdateOptions) => void;
    dismiss: (id: ToastId, reason?: ToastCloseReason) => void;
    dismissAll: (reason?: ToastCloseReason) => void;
}

export interface ToastProviderContext extends UseToastReturn {
    dismissInstance: (instanceId: string, reason?: ToastCloseReason) => void;
}

export const toastProviderKey = Symbol('toast-provider') as InjectionKey<ToastProviderContext>;
