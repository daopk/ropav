import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { ButtonColor, ButtonVariant } from './types';

export function getButtonColorStyle(
    color: ButtonColor | undefined,
    variant: ButtonVariant | undefined,
    autoContrast: boolean | undefined,
    contrastColor?: string,
) {
    if (!color && !variant) return undefined;

    const roles = getComponentVariantColorRoles({ color, variant, autoContrast, contrastColor });
    if (!roles) return undefined;

    return {
        '--_rp-button-bg': roles.background,
        '--_rp-button-bg-hover': roles.hover,
        '--_rp-button-bg-active': roles.active,
        '--_rp-button-border': roles.border,
        '--_rp-button-border-hover': roles.borderHover,
        '--_rp-button-border-active': roles.borderActive,
        '--_rp-button-fg': roles.color,
        '--_rp-button-fg-hover': roles.colorHover,
        '--_rp-button-fg-active': roles.colorActive,
    } as CSSProperties;
}
