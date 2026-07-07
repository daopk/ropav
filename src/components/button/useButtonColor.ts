import type { CSSProperties } from 'vue';
import { getComponentCustomColor } from '@/utils/componentColors';
import type { ButtonColor } from './types';

export function getButtonColorStyle(color: ButtonColor | undefined) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-button-custom-color': customColor,
        '--_rp-button-custom-hover': `color-mix(in srgb, ${customColor} 90%, #111111)`,
        '--_rp-button-custom-active': `color-mix(in srgb, ${customColor} 80%, #111111)`,
        '--_rp-button-custom-on': 'var(--rp-color-on-primary)',
        '--_rp-button-custom-subtle-bg': `color-mix(in srgb, ${customColor} 12%, transparent)`,
        '--_rp-button-custom-subtle-bg-hover': `color-mix(in srgb, ${customColor} 18%, transparent)`,
        '--_rp-button-custom-subtle-bg-active': `color-mix(in srgb, ${customColor} 24%, transparent)`,
        '--_rp-button-custom-border': `color-mix(in srgb, ${customColor} 45%, transparent)`,
        '--_rp-button-custom-border-hover': `color-mix(in srgb, ${customColor} 62%, transparent)`,
        '--_rp-button-custom-fg': customColor,
    } satisfies CSSProperties;
}
