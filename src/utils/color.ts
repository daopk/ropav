export interface ParsedCssColor {
    red: number;
    green: number;
    blue: number;
    opacity: number;
}

interface ParsedFunctionChannels {
    channels: [string, string, string];
    alpha?: string;
    legacy: boolean;
}

const DEFAULT_OPACITY = 100;
const NUMBER_SOURCE = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?`;
const NUMBER_PATTERN = new RegExp(`^${NUMBER_SOURCE}$`, 'i');
const HUE_PATTERN = new RegExp(`^(${NUMBER_SOURCE})(deg|grad|rad|turn)?$`, 'i');

export function parseCssColor(value: string): ParsedCssColor | undefined {
    const color = value.trim().toLowerCase();

    if (color === 'black') return { red: 0, green: 0, blue: 0, opacity: DEFAULT_OPACITY };
    if (color === 'white') return { red: 255, green: 255, blue: 255, opacity: DEFAULT_OPACITY };
    if (color === 'transparent') return { red: 0, green: 0, blue: 0, opacity: 0 };

    return parseHexColor(color) ?? parseRgbColor(color) ?? parseHslColor(color);
}

function parseHexColor(color: string): ParsedCssColor | undefined {
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

function parseRgbColor(color: string): ParsedCssColor | undefined {
    const body = color.match(/^rgba?\((.*)\)$/i)?.[1];
    if (body == null) return undefined;

    const parsed = parseFunctionChannels(body);
    if (!parsed) return undefined;

    if (parsed.legacy) {
        const percentageChannels = parsed.channels.filter((channel) => channel.endsWith('%'));
        if (
            percentageChannels.length !== 0 &&
            percentageChannels.length !== parsed.channels.length
        ) {
            return undefined;
        }
    }

    const [red, green, blue] = parsed.channels.map(parseRgbChannel);
    const opacity = parseAlpha(parsed.alpha);
    if (red == null || green == null || blue == null || opacity == null) return undefined;

    return { red, green, blue, opacity };
}

function parseHslColor(color: string): ParsedCssColor | undefined {
    const body = color.match(/^hsla?\((.*)\)$/i)?.[1];
    if (body == null) return undefined;

    const parsed = parseFunctionChannels(body);
    if (!parsed) return undefined;

    const hue = parseHue(parsed.channels[0]);
    const saturation = parsePercentage(parsed.channels[1]);
    const lightness = parsePercentage(parsed.channels[2]);
    const opacity = parseAlpha(parsed.alpha);
    if (hue == null || saturation == null || lightness == null || opacity == null) {
        return undefined;
    }

    return hslToRgb(hue, saturation, lightness, opacity);
}

function parseFunctionChannels(body: string): ParsedFunctionChannels | undefined {
    const value = body.trim();
    if (!value) return undefined;

    if (value.includes(',')) {
        if (value.includes('/')) return undefined;

        const parts = value.split(',').map((part) => part.trim());
        if ((parts.length !== 3 && parts.length !== 4) || parts.some((part) => !part)) {
            return undefined;
        }

        return {
            channels: [parts[0], parts[1], parts[2]],
            alpha: parts[3],
            legacy: true,
        };
    }

    const slashParts = value.split('/');
    if (slashParts.length > 2) return undefined;

    const channels = slashParts[0].trim().split(/\s+/).filter(Boolean);
    const alpha = slashParts[1]?.trim();
    if (channels.length !== 3 || (slashParts.length === 2 && !alpha)) return undefined;

    return {
        channels: [channels[0], channels[1], channels[2]],
        alpha,
        legacy: false,
    };
}

function parseRgbChannel(channel: string) {
    const percentage = parsePercentage(channel);
    if (percentage != null) return clamp(Math.round((percentage / 100) * 255), 0, 255);

    const number = parseNumber(channel);
    return number == null ? undefined : clamp(Math.round(number), 0, 255);
}

function parseHue(channel: string) {
    const match = channel.trim().match(HUE_PATTERN);
    if (!match) return undefined;

    const value = Number(match[1]);
    if (!Number.isFinite(value)) return undefined;

    switch (match[2]) {
        case 'grad':
            return value * 0.9;
        case 'rad':
            return (value * 180) / Math.PI;
        case 'turn':
            return value * 360;
        default:
            return value;
    }
}

function parsePercentage(channel: string) {
    const value = channel.trim();
    if (!value.endsWith('%')) return undefined;

    const number = parseNumber(value.slice(0, -1));
    return number == null ? undefined : clamp(number, 0, 100);
}

function parseAlpha(alpha: string | undefined) {
    if (alpha === undefined) return DEFAULT_OPACITY;

    const percentage = parsePercentage(alpha);
    if (percentage != null) return roundPercent(percentage);

    const number = parseNumber(alpha);
    return number == null ? undefined : roundPercent(clamp(number, 0, 1) * 100);
}

function parseNumber(value: string) {
    const token = value.trim();
    if (!NUMBER_PATTERN.test(token)) return undefined;

    const number = Number(token);
    return Number.isFinite(number) ? number : undefined;
}

function hslToRgb(
    hue: number,
    saturation: number,
    lightness: number,
    opacity: number,
): ParsedCssColor {
    const h = normalizeHue(hue);
    const s = clamp(saturation, 0, 100) / 100;
    const l = clamp(lightness, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let red = 0;
    let green = 0;
    let blue = 0;

    if (h < 60) {
        red = c;
        green = x;
    } else if (h < 120) {
        red = x;
        green = c;
    } else if (h < 180) {
        green = c;
        blue = x;
    } else if (h < 240) {
        green = x;
        blue = c;
    } else if (h < 300) {
        red = x;
        blue = c;
    } else {
        red = c;
        blue = x;
    }

    return {
        red: Math.round((red + m) * 255),
        green: Math.round((green + m) * 255),
        blue: Math.round((blue + m) * 255),
        opacity,
    };
}

function normalizeHue(value: number) {
    return ((value % 360) + 360) % 360;
}

function roundPercent(value: number) {
    return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
