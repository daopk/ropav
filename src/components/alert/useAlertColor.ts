import type { CSSProperties } from 'vue';
import { getComponentCustomColor } from '@/utils/componentColors';
import type { AlertColor } from './types';

export function getAlertColorStyle(color: AlertColor | undefined) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-alert-custom-color': customColor,
        '--_rp-alert-custom-fg': customColor,
        '--_rp-alert-custom-on': 'var(--rp-color-on-primary)',
        '--_rp-alert-custom-subtle-bg': `color-mix(in srgb, ${customColor} 12%, transparent)`,
        '--_rp-alert-custom-border': `color-mix(in srgb, ${customColor} 45%, transparent)`,
    } satisfies CSSProperties;
}
