import type { CSSProperties } from 'vue';
import { getComponentCustomColor } from '@/utils/componentColors';
import type { BadgeColor } from './types';

export function getBadgeColorStyle(color: BadgeColor | undefined) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-badge-custom-color': customColor,
        '--_rp-badge-custom-fg': customColor,
        '--_rp-badge-custom-on': 'var(--rp-color-on-primary)',
        '--_rp-badge-custom-subtle-bg': `color-mix(in srgb, ${customColor} 12%, transparent)`,
        '--_rp-badge-custom-border': `color-mix(in srgb, ${customColor} 45%, transparent)`,
    } satisfies CSSProperties;
}
