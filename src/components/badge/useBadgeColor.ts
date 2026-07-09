import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { BadgeColor, BadgeVariant } from './types';

export function getBadgeColorStyle(
    color: BadgeColor | undefined,
    variant: BadgeVariant | undefined,
    autoContrast: boolean | undefined,
) {
    if (!color && !variant) return undefined;

    const roles = getComponentVariantColorRoles({
        color,
        variant: variant ?? 'solid',
        autoContrast,
    });
    if (!roles) return undefined;

    return {
        '--_rp-badge-bg': roles.background,
        '--_rp-badge-fg': roles.color,
        '--_rp-badge-border': roles.border,
    } as CSSProperties;
}
