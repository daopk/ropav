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
    contrastHover: string;
    contrastActive: string;
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
    colorHover: string;
    colorActive: string;
    border: string;
    borderHover: string;
    borderActive: string;
}

export interface ComponentContrastColorOptions {
    /** Automatically selects a readable foreground for preset and opaque custom colors. */
    autoContrast?: boolean;
    /** Required when an automatically contrasted custom color is translucent. */
    contrastColor?: string;
}

export interface ComponentContrastColorRoles {
    color: string;
    hover: string;
    active: string;
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
const warnedTranslucentContrastColors = new Set<string>();

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
    return getComponentContrastColorRoles(color, options).color;
}

export function getComponentContrastColorRoles(
    color: ComponentColorValue | undefined,
    options: ComponentContrastColorOptions = {},
): ComponentContrastColorRoles {
    if (options.contrastColor !== undefined) {
        return createContrastColorRoles(options.contrastColor);
    }
    if (options.autoContrast === false) return createContrastColorRoles('var(--rp-color-white)');

    const parsed = parseComponentColor(color);
    if (parsed.kind === 'custom') return getCustomContrastColorRoles(parsed.value, true);

    const roles = getComponentColorRoles(color);
    if (!roles) return createContrastColorRoles('var(--rp-color-white)');

    return {
        color: roles.contrast,
        hover: roles.contrastHover,
        active: roles.contrastActive,
    };
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
        const hoverShade = Math.min(Number(parsed.shade) + 1, 9);
        const hover = `var(--rp-color-${parsed.color}-${hoverShade})`;

        return createComponentColorRoles(base, {
            hover,
            contrast: `var(--rp-color-${parsed.color}-${parsed.shade}-contrast)`,
            contrastHover: `var(--rp-color-${parsed.color}-${hoverShade}-contrast)`,
            contrastActive: `var(--rp-color-${parsed.color}-${parsed.shade}-active-contrast)`,
            foreground: base,
        });
    }

    const contrast = getCustomContrastColorRoles(parsed.value);
    return createComponentColorRoles(parsed.value, {
        contrast: contrast.color,
        contrastHover: contrast.hover,
        contrastActive: contrast.active,
        foreground: getCustomForegroundColor(parsed.value),
    });
}

export function getComponentVariantColorRoles({
    color,
    variant,
    defaultColor = 'primary',
    autoContrast,
    contrastColor,
}: ComponentVariantColorOptions): ComponentVariantColorRoles | undefined {
    const roles = getComponentColorRoles(color ?? defaultColor);
    if (!roles) return undefined;

    if (variant === 'solid') {
        const contrast = getComponentContrastColorRoles(color ?? defaultColor, {
            autoContrast,
            contrastColor,
        });

        return {
            background: roles.filled,
            hover: roles.hover,
            active: roles.active,
            color: contrast.color,
            colorHover: contrast.hover,
            colorActive: contrast.active,
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
            colorHover: roles.foreground,
            colorActive: roles.foreground,
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
            colorHover: roles.foreground,
            colorActive: roles.foreground,
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
            colorHover: roles.foreground,
            colorActive: roles.foreground,
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
            colorHover: roles.foreground,
            colorActive: roles.foreground,
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
            colorHover: roles.foreground,
            colorActive: roles.foreground,
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
        colorHover: roles.foreground,
        colorActive: roles.foreground,
        border: roles.outline,
        borderHover: roles.outlineHover,
        borderActive: roles.outlineHover,
    };
}

function createComponentColorRoles(
    color: string,
    overrides: Partial<ComponentColorRoles> = {},
): ComponentColorRoles {
    const roles = {
        filled: color,
        hover: `color-mix(in srgb, ${color} 90%, var(--rp-color-black))`,
        active: `color-mix(in srgb, ${color} 80%, var(--rp-color-black))`,
        contrast: 'var(--rp-color-white)',
        contrastHover: 'var(--rp-color-white)',
        contrastActive: 'var(--rp-color-white)',
        light: `color-mix(in srgb, ${color} 12%, transparent)`,
        lightHover: `color-mix(in srgb, ${color} 18%, transparent)`,
        lightActive: `color-mix(in srgb, ${color} 24%, transparent)`,
        outline: color,
        outlineHover: `color-mix(in srgb, ${color} 62%, transparent)`,
        foreground: color,
        ...overrides,
    };

    return {
        ...roles,
        contrastHover: overrides.contrastHover ?? roles.contrast,
        contrastActive: overrides.contrastActive ?? roles.contrast,
    };
}

type RgbColor = Pick<ParsedCssColor, 'red' | 'green' | 'blue'>;

const customForegroundBackgroundMixes = [0, 0.12, 0.18, 0.24];

function getCustomForegroundColor(color: string) {
    const parsed = parseCssColor(color);
    if (!parsed || parsed.opacity < 100) return color;

    const black = { red: 0, green: 0, blue: 0 };
    const white = { red: 255, green: 255, blue: 255 };
    const darkBody = { red: 36, green: 36, blue: 36 };
    let colorPercent = 100;

    while (colorPercent > 0) {
        const weight = colorPercent / 100;
        const lightForeground = mixOpaqueColors(parsed, weight, black);
        const darkForeground = mixOpaqueColors(parsed, weight, white);
        const isReadable = customForegroundBackgroundMixes.every((backgroundWeight) => {
            const lightBackground = mixOpaqueColors(parsed, backgroundWeight, white);
            const darkBackground = mixOpaqueColors(parsed, backgroundWeight, darkBody);

            return (
                contrastRatio(lightForeground, lightBackground) >= 4.5 &&
                contrastRatio(darkForeground, darkBackground) >= 4.5
            );
        });

        if (isReadable) break;
        colorPercent -= 1;
    }

    if (colorPercent === 100) return color;

    return `color-mix(in srgb, ${color} ${colorPercent}%, var(--rp-color-bright))`;
}

function getCustomContrastColorRoles(
    color: string,
    warnForTranslucentColor = false,
): ComponentContrastColorRoles {
    const parsed = parseCssColor(color);
    if (!parsed) return createContrastColorRoles('var(--rp-color-white)');
    if (parsed.opacity < 100) {
        if (warnForTranslucentColor) warnAboutTranslucentAutoContrast(color);
        return createContrastColorRoles('var(--rp-color-white)');
    }

    const black = { red: 0, green: 0, blue: 0 };

    return {
        color: getReadableParsedColorVariable(parsed),
        hover: getReadableParsedColorVariable(mixOpaqueColors(parsed, 0.9, black)),
        active: getReadableParsedColorVariable(mixOpaqueColors(parsed, 0.8, black)),
    };
}

function getReadableParsedColorVariable(parsed: RgbColor) {
    const blackContrast = contrastRatio({ red: 0, green: 0, blue: 0 }, parsed);
    const whiteContrast = contrastRatio({ red: 255, green: 255, blue: 255 }, parsed);

    return blackContrast >= whiteContrast ? 'var(--rp-color-black)' : 'var(--rp-color-white)';
}

function createContrastColorRoles(color: string): ComponentContrastColorRoles {
    return { color, hover: color, active: color };
}

function mixOpaqueColors(first: RgbColor, firstWeight: number, second: RgbColor): RgbColor {
    const secondWeight = 1 - firstWeight;
    return {
        red: first.red * firstWeight + second.red * secondWeight,
        green: first.green * firstWeight + second.green * secondWeight,
        blue: first.blue * firstWeight + second.blue * secondWeight,
    };
}

function warnAboutTranslucentAutoContrast(color: string) {
    if (!import.meta.env.DEV) return;

    const warningKey = color.trim().toLowerCase();
    if (warnedTranslucentContrastColors.has(warningKey)) return;

    warnedTranslucentContrastColors.add(warningKey);
    console.warn(
        `[Ropav] autoContrast cannot determine a readable foreground for translucent custom color "${color}" without knowing the underlying surface. Pass contrastColor explicitly.`,
    );
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
