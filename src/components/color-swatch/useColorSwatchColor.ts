interface RgbColor {
    red: number;
    green: number;
    blue: number;
}

interface RgbaColor extends RgbColor {
    opacity: number;
}

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

function parseCssColor(color: string): RgbColor | undefined {
    const value = color.trim().toLowerCase();
    if (value === 'black') return { red: 0, green: 0, blue: 0 };
    if (value === 'white') return { red: 255, green: 255, blue: 255 };
    if (value.startsWith('var(')) return undefined;

    const parsed = parseHexColor(value) ?? parseRgbColor(value) ?? parseHslColor(value);
    if (!parsed) return undefined;

    return {
        red: parsed.red,
        green: parsed.green,
        blue: parsed.blue,
    };
}

function parseHexColor(color: string): RgbaColor | undefined {
    const hex = color.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
    if (!hex) return undefined;

    if (hex.length === 3 || hex.length === 4) {
        return {
            red: Number.parseInt(hex[0] + hex[0], 16),
            green: Number.parseInt(hex[1] + hex[1], 16),
            blue: Number.parseInt(hex[2] + hex[2], 16),
            opacity: hex.length === 4 ? Number.parseInt(hex[3] + hex[3], 16) / 255 : 1,
        };
    }

    return {
        red: Number.parseInt(hex.slice(0, 2), 16),
        green: Number.parseInt(hex.slice(2, 4), 16),
        blue: Number.parseInt(hex.slice(4, 6), 16),
        opacity: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
}

function parseRgbColor(color: string): RgbaColor | undefined {
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
        opacity: parseAlpha(parsed.alpha) ?? 1,
    };
}

function parseHslColor(color: string): RgbaColor | undefined {
    const match = color.match(/^hsla?\((.+)\)$/i);
    if (!match) return undefined;

    const parsed = parseFunctionChannels(match[1]);
    if (!parsed || parsed.channels.length !== 3) return undefined;

    const hue = parseHueChannel(parsed.channels[0]);
    const saturation = parsePercentChannel(parsed.channels[1]);
    const lightness = parsePercentChannel(parsed.channels[2]);
    if (hue == null || saturation == null || lightness == null) return undefined;

    return {
        ...hslToRgb(hue, saturation, lightness),
        opacity: parseAlpha(parsed.alpha) ?? 1,
    };
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
        return Number.isFinite(percent) ? clamp(percent / 100, 0, 1) : undefined;
    }

    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? clamp(number, 0, 1) : undefined;
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
    const h = (((hue % 360) + 360) % 360) / 360;
    const s = saturation / 100;
    const l = lightness / 100;

    if (s === 0) {
        const channel = Math.round(l * 255);
        return { red: channel, green: channel, blue: channel };
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
        red: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
        green: Math.round(hueToRgb(p, q, h) * 255),
        blue: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
    };
}

function hueToRgb(p: number, q: number, value: number) {
    let t = value;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

function getPerceivedBrightness({ red, green, blue }: RgbColor) {
    return (red * 299 + green * 587 + blue * 114) / 1000;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
