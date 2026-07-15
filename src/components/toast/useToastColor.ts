import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { ToastColor, ToastVariant } from './types';

export function getToastColorStyle(
    color: ToastColor | undefined,
    variant: ToastVariant | undefined,
    autoContrast: boolean | undefined,
) {
    if (!color && !variant) return undefined;

    const resolvedVariant = variant ?? 'surface';
    const roles = getComponentVariantColorRoles({
        color,
        variant: resolvedVariant,
        defaultColor: 'cyan',
        autoContrast,
    });
    if (!roles) return undefined;

    return {
        '--_rp-toast-bg': roles.background,
        '--_rp-toast-fg': resolvedVariant === 'solid' ? roles.color : 'var(--rp-color-text)',
        '--_rp-toast-title-fg': resolvedVariant === 'solid' ? roles.color : 'var(--rp-color-text)',
        '--_rp-toast-icon-fg': roles.color,
        '--_rp-toast-border': roles.border,
    } as CSSProperties;
}
