import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { AvatarColor, AvatarVariant } from './types';

export function getAvatarColorStyle(
    color: AvatarColor | undefined,
    variant: AvatarVariant | undefined,
    autoContrast: boolean | undefined,
    contrastColor?: string,
) {
    if (!color && !variant) return undefined;

    const roles = getComponentVariantColorRoles({
        color,
        variant: variant ?? 'solid',
        autoContrast,
        contrastColor,
    });
    if (!roles) return undefined;

    return {
        '--_rp-avatar-bg': roles.background,
        '--_rp-avatar-fg': roles.color,
        '--_rp-avatar-border': roles.border,
    } as CSSProperties;
}
