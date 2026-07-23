import { parseCssColor, type ParsedCssColor } from './color';
import { clamp, roundTo } from './number';

export const colorPickerFormats = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla'] as const;

export type ColorPickerFormat = (typeof colorPickerFormats)[number];

export const DEFAULT_HUE = 0;
export const HUE_MAX = 359;
export const DEFAULT_OPACITY = 100;
export const COLOR_PICKER_KEYBOARD_STEP = 1;
export const COLOR_PICKER_KEYBOARD_LARGE_STEP = 10;

export interface ColorPickerHsvColor {
    hue: number;
    saturation: number;
    value: number;
    opacity: number;
}

interface HslColor {
    hue: number;
    saturation: number;
    lightness: number;
}

export function clampPercent(value: number | undefined) {
    return clamp(Number.isFinite(value) ? value! : 0, 0, 100);
}

export function normalizeHue(value: number | undefined) {
    if (!Number.isFinite(value)) return DEFAULT_HUE;
    return ((value! % 360) + 360) % 360;
}

export function normalizeHueForColor(value: number | undefined) {
    const hue = normalizeHue(value);
    return hue === HUE_MAX ? 360 : hue;
}

export function clampHue(value: number) {
    return clamp(Number.isFinite(value) ? value : DEFAULT_HUE, 0, HUE_MAX);
}

export function clampOpacity(value: number | undefined) {
    return clamp(Number.isFinite(value) ? value! : DEFAULT_OPACITY, 0, 100);
}

export function roundPercent(value: number) {
    return roundTo(value);
}

export function getColorPickerKeyboardValue(
    key: string,
    currentValue: number,
    maxValue: number,
    step = COLOR_PICKER_KEYBOARD_STEP,
) {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowUp':
            return currentValue + step;
        case 'ArrowLeft':
        case 'ArrowDown':
            return currentValue - step;
        case 'Home':
            return 0;
        case 'End':
            return maxValue;
        default:
            return undefined;
    }
}

export function isColorPickerAlphaFormat(format: ColorPickerFormat) {
    return format === 'hexa' || format === 'rgba' || format === 'hsla';
}

export function parseColorPickerValue(value: string): ColorPickerHsvColor | undefined {
    const rgb = parseCssColor(value);
    if (!rgb) return undefined;

    return rgbToHsv(rgb);
}

export function formatColorPickerValue(color: ColorPickerHsvColor, format: ColorPickerFormat) {
    const rgb = hsvToRgb(color.hue, color.saturation, color.value);
    const opacity = clampOpacity(color.opacity);

    switch (format) {
        case 'hex':
            return `#${toHexChannel(rgb.red)}${toHexChannel(rgb.green)}${toHexChannel(rgb.blue)}`;
        case 'hexa':
            return `#${toHexChannel(rgb.red)}${toHexChannel(rgb.green)}${toHexChannel(
                rgb.blue,
            )}${toHexChannel(Math.round((opacity / 100) * 255))}`;
        case 'rgb':
            return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
        case 'rgba':
            return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${formatAlpha(opacity)})`;
        case 'hsl': {
            const hsl = rgbToHsl(rgb);
            return `hsl(${formatNumber(hsl.hue)}, ${formatNumber(
                hsl.saturation,
            )}%, ${formatNumber(hsl.lightness)}%)`;
        }
        case 'hsla': {
            const hsl = rgbToHsl(rgb);
            return `hsla(${formatNumber(hsl.hue)}, ${formatNumber(
                hsl.saturation,
            )}%, ${formatNumber(hsl.lightness)}%, ${formatAlpha(opacity)})`;
        }
    }
}

export function getHsvCssColor(hue: number, saturation: number, value: number) {
    const rgb = hsvToRgb(hue, saturation, value);
    return `rgb(${rgb.red} ${rgb.green} ${rgb.blue})`;
}

function hsvToRgb(hue: number, saturation: number, value: number) {
    const normalizedHue = normalizeHueForColor(hue);
    const s = clampPercent(saturation) / 100;
    const v = clampPercent(value) / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (normalizedHue < 60) {
        r = c;
        g = x;
    } else if (normalizedHue < 120) {
        r = x;
        g = c;
    } else if (normalizedHue < 180) {
        g = c;
        b = x;
    } else if (normalizedHue < 240) {
        g = x;
        b = c;
    } else if (normalizedHue < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    return {
        red: Math.round((r + m) * 255),
        green: Math.round((g + m) * 255),
        blue: Math.round((b + m) * 255),
    };
}

function rgbToHsv({ red, green, blue, opacity }: ParsedCssColor): ColorPickerHsvColor {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = DEFAULT_HUE;
    if (delta) {
        if (max === r) hue = 60 * (((g - b) / delta) % 6);
        else if (max === g) hue = 60 * ((b - r) / delta + 2);
        else hue = 60 * ((r - g) / delta + 4);
    }

    return {
        hue: normalizeHue(hue),
        saturation: roundPercent(max === 0 ? 0 : (delta / max) * 100),
        value: roundPercent(max * 100),
        opacity: roundPercent(opacity),
    };
}

function rgbToHsl({ red, green, blue }: Pick<ParsedCssColor, 'red' | 'green' | 'blue'>): HslColor {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;

    if (!delta) {
        return { hue: DEFAULT_HUE, saturation: 0, lightness: roundPercent(lightness * 100) };
    }

    let hue: number;
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);

    const saturation = delta / (1 - Math.abs(2 * lightness - 1));

    return {
        hue: roundPercent(normalizeHue(hue)),
        saturation: roundPercent(saturation * 100),
        lightness: roundPercent(lightness * 100),
    };
}

function toHexChannel(value: number) {
    return clamp(value, 0, 255).toString(16).padStart(2, '0');
}

function formatAlpha(opacity: number) {
    return formatNumber(clampOpacity(opacity) / 100);
}

function formatNumber(value: number) {
    return String(roundTo(value));
}
