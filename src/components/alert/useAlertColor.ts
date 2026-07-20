import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { AlertColor, AlertVariant } from './types';

export function getAlertColorStyle(
    color: AlertColor | undefined,
    variant: AlertVariant | undefined,
    autoContrast: boolean | undefined,
    contrastColor?: string,
) {
    if (!color && !variant) return undefined;

    const resolvedVariant = variant ?? 'subtle';
    const roles = getComponentVariantColorRoles({
        color,
        variant: resolvedVariant,
        defaultColor: 'cyan',
        autoContrast,
        contrastColor,
    });
    if (!roles) return undefined;

    return {
        '--_rp-alert-bg': roles.background,
        '--_rp-alert-fg': resolvedVariant === 'solid' ? roles.color : 'var(--rp-color-text)',
        '--_rp-alert-title-fg': roles.color,
        '--_rp-alert-icon-fg': roles.color,
        '--_rp-alert-border': roles.border,
    } as CSSProperties;
}
