import { parseCssColor, type ParsedCssColor } from './color';

export const componentColors = [
    'dark',
    'gray',
    'red',
    'pink',
    'grape',
    'violet',
    'indigo',
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
] as const;

export const componentColorShades = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export type ComponentColor = (typeof componentColors)[number];
export type ComponentColorShade = (typeof componentColorShades)[number];
export type ComponentColorShadeValue = `${ComponentColor}.${ComponentColorShade}`;

export type ComponentColorValue = ComponentColor | ComponentColorShadeValue | (string & {});

export type ComponentColorVariant = 'solid' | 'subtle' | 'surface' | 'outline' | 'ghost' | 'plain';

export interface ComponentColorRoles {
    filled: string;
    hover: string;
    active: string;
    contrast: string;
    light: string;
    lightHover: string;
    lightActive: string;
    outline: string;
    outlineHover: string;
    foreground: string;
}

export interface ComponentVariantColorRoles {
    background: string;
    hover: string;
    active: string;
    color: string;
    border: string;
    borderHover: string;
    borderActive: string;
}

export interface ComponentContrastColorOptions {
    autoContrast?: boolean;
}

export interface ComponentVariantColorOptions extends ComponentContrastColorOptions {
    color: ComponentColorValue | undefined;
    variant: ComponentColorVariant | undefined;
    defaultColor?: ComponentColorValue;
}

export type ParsedComponentColor =
    | { kind: 'empty' }
    | { kind: 'preset'; color: ComponentColor }
    | { kind: 'primary' }
    | { kind: 'shade'; color: ComponentColor; shade: ComponentColorShade }
    | { kind: 'custom'; value: string }
    | { kind: 'invalid'; value: string };

const componentColorNames = new Set<string>(componentColors);
const componentColorShadeNames = new Set<string>(componentColorShades);

export function isComponentPresetColor(
    color: ComponentColorValue | undefined,
): color is ComponentColor {
    return Boolean(color && componentColorNames.has(color));
}

export function parseComponentColor(color: ComponentColorValue | undefined): ParsedComponentColor {
    if (!color) return { kind: 'empty' };
    if (color === 'primary') return { kind: 'primary' };

    if (componentColorNames.has(color)) {
        return { kind: 'preset', color: color as ComponentColor };
    }

    const shadeMatch = color.match(/^([a-z]+)\.(\d+)$/);
    if (shadeMatch && componentColorNames.has(shadeMatch[1])) {
        return componentColorShadeNames.has(shadeMatch[2])
            ? {
                  kind: 'shade',
                  color: shadeMatch[1] as ComponentColor,
                  shade: shadeMatch[2] as ComponentColorShade,
              }
            : { kind: 'invalid', value: color };
    }

    return { kind: 'custom', value: color };
}

export function getComponentColorValue(color: ComponentColorValue | undefined) {
    const parsed = parseComponentColor(color);

    if (parsed.kind === 'primary') return 'var(--rp-primary-color-filled)';
    if (parsed.kind === 'preset') return `var(--rp-color-${parsed.color}-filled)`;
    if (parsed.kind === 'shade') return `var(--rp-color-${parsed.color}-${parsed.shade})`;
    if (parsed.kind === 'custom') return parsed.value;

    return undefined;
}

export function getComponentContrastColor(
    color: ComponentColorValue | undefined,
    options: ComponentContrastColorOptions = {},
) {
    if (!options.autoContrast) return 'var(--rp-color-white)';

    const parsed = parseComponentColor(color);

    if (parsed.kind === 'primary') return 'var(--rp-primary-color-contrast)';
    if (parsed.kind === 'preset') return `var(--rp-color-${parsed.color}-contrast)`;
    if (parsed.kind === 'shade') return `var(--rp-color-${parsed.color}-${parsed.shade}-contrast)`;
    if (parsed.kind === 'custom') return getReadableColorVariable(parsed.value);

    return 'var(--rp-color-white)';
}

export function getComponentColorRoles(color: ComponentColorValue | undefined) {
    const parsed = parseComponentColor(color);

    if (parsed.kind === 'empty' || parsed.kind === 'invalid') {
        return undefined;
    }

    if (parsed.kind === 'primary') {
        return createComponentColorRoles('var(--rp-primary-color-filled)', {
            hover: 'var(--rp-primary-color-filled-hover)',
            contrast: 'var(--rp-primary-color-contrast)',
            light: 'var(--rp-primary-color-light)',
            lightHover: 'var(--rp-primary-color-light-hover)',
            outline: 'var(--rp-primary-color-outline)',
            outlineHover: 'color-mix(in srgb, var(--rp-primary-color-outline) 62%, transparent)',
            foreground: 'var(--rp-primary-color-light-color)',
        });
    }

    if (parsed.kind === 'preset') {
        return createComponentColorRoles(`var(--rp-color-${parsed.color}-filled)`, {
            hover: `var(--rp-color-${parsed.color}-filled-hover)`,
            contrast: `var(--rp-color-${parsed.color}-contrast)`,
            light: `var(--rp-color-${parsed.color}-light)`,
            lightHover: `var(--rp-color-${parsed.color}-light-hover)`,
            outline: `var(--rp-color-${parsed.color}-outline)`,
            outlineHover: `color-mix(in srgb, var(--rp-color-${parsed.color}-outline) 62%, transparent)`,
            foreground: `var(--rp-color-${parsed.color}-light-color)`,
        });
    }

    if (parsed.kind === 'shade') {
        const base = `var(--rp-color-${parsed.color}-${parsed.shade})`;
        const hover = `var(--rp-color-${parsed.color}-${Math.min(Number(parsed.shade) + 1, 9)})`;

        return createComponentColorRoles(base, {
            hover,
            contrast: `var(--rp-color-${parsed.color}-${parsed.shade}-contrast)`,
            foreground: base,
        });
    }

    return createComponentColorRoles(parsed.value, {
        contrast: getReadableColorVariable(parsed.value),
    });
}

export function getComponentVariantColorRoles({
    color,
    variant,
    defaultColor = 'primary',
    autoContrast,
}: ComponentVariantColorOptions): ComponentVariantColorRoles | undefined {
    const roles = getComponentColorRoles(color ?? defaultColor);
    if (!roles) return undefined;

    const contrast = getComponentContrastColor(color ?? defaultColor, { autoContrast });

    if (variant === 'solid') {
        return {
            background: roles.filled,
            hover: roles.hover,
            active: roles.active,
            color: contrast,
            border: roles.filled,
            borderHover: roles.hover,
            borderActive: roles.active,
        };
    }

    if (variant === 'subtle') {
        return {
            background: roles.light,
            hover: roles.lightHover,
            active: roles.lightActive,
            color: roles.foreground,
            border: 'transparent',
            borderHover: 'transparent',
            borderActive: 'transparent',
        };
    }

    if (variant === 'surface') {
        return {
            background: roles.light,
            hover: roles.lightHover,
            active: roles.lightActive,
            color: roles.foreground,
            border: roles.outline,
            borderHover: roles.lightHover,
            borderActive: roles.outlineHover,
        };
    }

    if (variant === 'outline') {
        return {
            background: 'transparent',
            hover: roles.lightHover,
            active: roles.lightActive,
            color: roles.foreground,
            border: roles.outline,
            borderHover: roles.outlineHover,
            borderActive: roles.outlineHover,
        };
    }

    if (variant === 'ghost') {
        return {
            background: 'transparent',
            hover: roles.lightHover,
            active: roles.lightActive,
            color: roles.foreground,
            border: 'transparent',
            borderHover: 'transparent',
            borderActive: 'transparent',
        };
    }

    if (variant === 'plain') {
        return {
            background: 'transparent',
            hover: 'transparent',
            active: 'transparent',
            color: roles.foreground,
            border: 'transparent',
            borderHover: 'transparent',
            borderActive: 'transparent',
        };
    }

    return {
        background: 'var(--rp-color-default)',
        hover: roles.lightHover,
        active: roles.lightActive,
        color: roles.foreground,
        border: roles.outline,
        borderHover: roles.outlineHover,
        borderActive: roles.outlineHover,
    };
}

function createComponentColorRoles(
    color: string,
    overrides: Partial<ComponentColorRoles> = {},
): ComponentColorRoles {
    return {
        filled: color,
        hover: `color-mix(in srgb, ${color} 90%, var(--rp-color-black))`,
        active: `color-mix(in srgb, ${color} 80%, var(--rp-color-black))`,
        contrast: 'var(--rp-color-white)',
        light: `color-mix(in srgb, ${color} 12%, transparent)`,
        lightHover: `color-mix(in srgb, ${color} 18%, transparent)`,
        lightActive: `color-mix(in srgb, ${color} 24%, transparent)`,
        outline: color,
        outlineHover: `color-mix(in srgb, ${color} 62%, transparent)`,
        foreground: color,
        ...overrides,
    };
}

type RgbColor = Pick<ParsedCssColor, 'red' | 'green' | 'blue'>;

function getReadableColorVariable(color: string) {
    const parsed = parseCssColor(color);
    if (!parsed) return 'var(--rp-color-white)';

    const blackContrast = contrastRatio({ red: 0, green: 0, blue: 0 }, parsed);
    const whiteContrast = contrastRatio({ red: 255, green: 255, blue: 255 }, parsed);

    return blackContrast >= whiteContrast ? 'var(--rp-color-black)' : 'var(--rp-color-white)';
}

function contrastRatio(foreground: RgbColor, background: RgbColor) {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);

    return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: RgbColor) {
    const [red, green, blue] = [color.red, color.green, color.blue]
        .map((channel) => channel / 255)
        .map((channel) =>
            channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
        );

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
