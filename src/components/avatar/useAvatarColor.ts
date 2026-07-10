import type { CSSProperties } from 'vue';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import type { AvatarColor } from './types';

export function getAvatarColorStyle(
    color: AvatarColor | undefined,
    autoContrast: boolean | undefined,
) {
    if (!color) return undefined;

    const roles = getComponentVariantColorRoles({
        color,
        variant: 'solid',
        autoContrast,
    });
    if (!roles) return undefined;

    return {
        '--_rp-avatar-bg': roles.background,
        '--_rp-avatar-fg': roles.color,
    } as CSSProperties;
}
