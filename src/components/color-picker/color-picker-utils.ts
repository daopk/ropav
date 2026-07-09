import type { ColorPickerFormat } from './types';

export const DEFAULT_HUE = 0;
export const HUE_MAX = 359;
export const KEYBOARD_STEP = 1;
export const KEYBOARD_LARGE_STEP = 10;
export const DEFAULT_OPACITY = 100;

export interface ColorPickerHsvColor {
    hue: number;
    saturation: number;
    value: number;
    opacity: number;
}

interface RgbColor {
    red: number;
    green: number;
    blue: number;
    opacity: number;
}

interface HslColor {
    hue: number;
    saturation: number;
    lightness: number;
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
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
    return Math.round(value * 100) / 100;
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

function rgbToHsv({ red, green, blue, opacity }: RgbColor): ColorPickerHsvColor {
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

function rgbToHsl({ red, green, blue }: Pick<RgbColor, 'red' | 'green' | 'blue'>): HslColor {
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

function hslToRgb(hue: number, saturation: number, lightness: number, opacity: number): RgbColor {
    const h = normalizeHue(hue);
    const s = clampPercent(saturation) / 100;
    const l = clampPercent(lightness) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
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
        opacity,
    };
}

function parseCssColor(value: string): RgbColor | undefined {
    const color = value.trim().toLowerCase();
    return parseHexColor(color) ?? parseRgbColor(color) ?? parseHslColor(color);
}

function parseHexColor(color: string): RgbColor | undefined {
    const hex = color.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
    if (!hex) return undefined;

    if (hex.length === 3 || hex.length === 4) {
        return {
            red: Number.parseInt(hex[0] + hex[0], 16),
            green: Number.parseInt(hex[1] + hex[1], 16),
            blue: Number.parseInt(hex[2] + hex[2], 16),
            opacity:
                hex.length === 4
                    ? roundPercent((Number.parseInt(hex[3] + hex[3], 16) / 255) * 100)
                    : DEFAULT_OPACITY,
        };
    }

    return {
        red: Number.parseInt(hex.slice(0, 2), 16),
        green: Number.parseInt(hex.slice(2, 4), 16),
        blue: Number.parseInt(hex.slice(4, 6), 16),
        opacity:
            hex.length === 8
                ? roundPercent((Number.parseInt(hex.slice(6, 8), 16) / 255) * 100)
                : DEFAULT_OPACITY,
    };
}

function parseRgbColor(color: string): RgbColor | undefined {
    const match = color.match(/^rgba?\((.+)\)$/i);
    if (!match) return undefined;

    const parsed = parseFunctionChannels(match[1]);
    if (!parsed || parsed.channels.length !== 3) return undefined;

    const [red, green, blue] = parsed.channels.map(parseRgbChannel);
    if (red == null || green == null || blue == null) return undefined;

    return {
        red,
        green,
        blue,
        opacity: parseAlpha(parsed.alpha) ?? DEFAULT_OPACITY,
    };
}

function parseHslColor(color: string): RgbColor | undefined {
    const match = color.match(/^hsla?\((.+)\)$/i);
    if (!match) return undefined;

    const parsed = parseFunctionChannels(match[1]);
    if (!parsed || parsed.channels.length !== 3) return undefined;

    const hue = parseHueChannel(parsed.channels[0]);
    const saturation = parsePercentChannel(parsed.channels[1]);
    const lightness = parsePercentChannel(parsed.channels[2]);
    if (hue == null || saturation == null || lightness == null) return undefined;

    return hslToRgb(hue, saturation, lightness, parseAlpha(parsed.alpha) ?? DEFAULT_OPACITY);
}

function parseFunctionChannels(value: string) {
    if (value.includes(',')) {
        const parts = value.split(',').map((part) => part.trim());
        return {
            channels: parts.slice(0, 3),
            alpha: parts[3],
        };
    }

    const [channelsValue, alpha] = value.split('/').map((part) => part.trim());
    return {
        channels: channelsValue.split(/\s+/).filter(Boolean),
        alpha,
    };
}

function parseRgbChannel(channel: string) {
    const value = channel.trim();
    if (value.endsWith('%')) {
        const percent = Number.parseFloat(value.slice(0, -1));
        return Number.isFinite(percent) ? clamp(Math.round((percent / 100) * 255), 0, 255) : null;
    }

    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? clamp(Math.round(number), 0, 255) : null;
}

function parseHueChannel(channel: string) {
    const value = channel.trim().replace(/deg$/i, '');
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : null;
}

function parsePercentChannel(channel: string) {
    const value = channel.trim();
    if (!value.endsWith('%')) return null;

    const percent = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(percent) ? clamp(percent, 0, 100) : null;
}

function parseAlpha(alpha: string | undefined) {
    if (alpha == null || alpha === '') return undefined;

    const value = alpha.trim();
    if (value.endsWith('%')) {
        const percent = Number.parseFloat(value.slice(0, -1));
        return Number.isFinite(percent) ? roundPercent(clamp(percent, 0, 100)) : undefined;
    }

    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? roundPercent(clamp(number, 0, 1) * 100) : undefined;
}

function toHexChannel(value: number) {
    return clamp(value, 0, 255).toString(16).padStart(2, '0');
}

function formatAlpha(opacity: number) {
    return formatNumber(clampOpacity(opacity) / 100);
}

function formatNumber(value: number) {
    return String(Math.round(value * 100) / 100);
}
