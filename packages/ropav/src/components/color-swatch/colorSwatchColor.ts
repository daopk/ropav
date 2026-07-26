import { parseCssColor, type ParsedCssColor } from '@/utils/color';

export function getColorSwatchForeground(color: string) {
    const background = parseCssColor(color);
    if (!background) return 'var(--rp-color-white)';

    return getPerceivedBrightness(background) >= 186
        ? 'var(--rp-color-black)'
        : 'var(--rp-color-white)';
}

export function getColorSwatchOverlay(color: string) {
    const background = parseCssColor(color);
    if (!background || getPerceivedBrightness(background) >= 80) {
        return {
            stroke: 'rgb(0 0 0 / 10%)',
            shadow: 'rgb(0 0 0 / 15%)',
        };
    }

    return {
        stroke: 'rgb(255 255 255 / 18%)',
        shadow: 'rgb(255 255 255 / 10%)',
    };
}

function getPerceivedBrightness({ red, green, blue }: ParsedCssColor) {
    return (red * 299 + green * 587 + blue * 114) / 1000;
}
