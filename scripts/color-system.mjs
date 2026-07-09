import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const colorNames = [
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
];

export const colorShades = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const primaryColor = 'blue';
export const lightPrimaryShade = 6;
export const darkPrimaryShade = 8;

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultCoreTokens = JSON.parse(
    readFileSync(join(projectRoot, 'tokens/default/core.tokens.json'), 'utf8'),
);

export const oldSemanticColorVariables = new Set([
    '--rp-color-primary',
    '--rp-color-secondary',
    '--rp-color-success',
    '--rp-color-warning',
    '--rp-color-danger',
    '--rp-color-info',
    '--rp-color-neutral',
    '--rp-color-background',
    '--rp-color-surface',
    '--rp-color-surface-raised',
    '--rp-color-surface-muted',
    '--rp-color-surface-hover',
    '--rp-color-surface-inverted',
    '--rp-color-button-default-bg',
    '--rp-color-button-default-bg-hover',
    '--rp-color-button-default-bg-active',
    '--rp-color-border',
    '--rp-color-border-hover',
    '--rp-color-text-secondary',
    '--rp-color-text-disabled',
    '--rp-color-text-inverted',
    '--rp-color-overlay',
    '--rp-color-on-primary',
    '--rp-color-on-secondary',
    '--rp-color-on-success',
    '--rp-color-on-warning',
    '--rp-color-on-danger',
    '--rp-color-on-info',
    '--rp-color-on-neutral',
    '--rp-color-primary-hover',
    '--rp-color-primary-active',
    '--rp-color-primary-subtle-bg',
    '--rp-color-primary-subtle-bg-hover',
    '--rp-color-primary-subtle-bg-active',
    '--rp-color-primary-border',
    '--rp-color-primary-border-hover',
    '--rp-color-primary-fg',
    '--rp-color-secondary-hover',
    '--rp-color-secondary-active',
    '--rp-color-secondary-subtle-bg',
    '--rp-color-secondary-subtle-bg-hover',
    '--rp-color-secondary-subtle-bg-active',
    '--rp-color-secondary-border',
    '--rp-color-secondary-border-hover',
    '--rp-color-secondary-fg',
    '--rp-color-success-hover',
    '--rp-color-success-active',
    '--rp-color-success-subtle-bg',
    '--rp-color-success-subtle-bg-hover',
    '--rp-color-success-subtle-bg-active',
    '--rp-color-success-border',
    '--rp-color-success-border-hover',
    '--rp-color-success-fg',
    '--rp-color-warning-hover',
    '--rp-color-warning-active',
    '--rp-color-warning-subtle-bg',
    '--rp-color-warning-subtle-bg-hover',
    '--rp-color-warning-subtle-bg-active',
    '--rp-color-warning-border',
    '--rp-color-warning-border-hover',
    '--rp-color-warning-fg',
    '--rp-color-danger-hover',
    '--rp-color-danger-active',
    '--rp-color-danger-subtle-bg',
    '--rp-color-danger-subtle-bg-hover',
    '--rp-color-danger-subtle-bg-active',
    '--rp-color-danger-border',
    '--rp-color-danger-border-hover',
    '--rp-color-danger-fg',
    '--rp-color-info-hover',
    '--rp-color-info-active',
    '--rp-color-info-subtle-bg',
    '--rp-color-info-subtle-bg-hover',
    '--rp-color-info-subtle-bg-active',
    '--rp-color-info-border',
    '--rp-color-info-border-hover',
    '--rp-color-info-fg',
    '--rp-color-neutral-hover',
    '--rp-color-neutral-active',
    '--rp-color-neutral-subtle-bg',
    '--rp-color-neutral-subtle-bg-hover',
    '--rp-color-neutral-subtle-bg-active',
    '--rp-color-neutral-border',
    '--rp-color-neutral-border-hover',
    '--rp-color-neutral-fg',
]);

export function getPrimaryColorVariables() {
    const variables = {};

    for (const shade of colorShades) {
        variables[`--rp-primary-color-${shade}`] = `var(--rp-color-${primaryColor}-${shade})`;
    }

    for (const suffix of colorVariantSuffixes) {
        variables[`--rp-primary-color-${suffix}`] = `var(--rp-color-${primaryColor}-${suffix})`;
    }

    return variables;
}

export function getColorVariantVariables(color, scheme) {
    const isDark = scheme === 'dark';
    const primaryShade = isDark ? darkPrimaryShade : lightPrimaryShade;
    const outlineShade = isDark ? Math.max(primaryShade - 4, 0) : primaryShade;
    const hoverShade = Math.min(primaryShade + 1, 9);
    const contrast = getReadableColorVariable(getColorTokenValue(color, primaryShade));

    if (!isDark) {
        return {
            [`--rp-color-${color}-filled`]: `var(--rp-color-${color}-${primaryShade})`,
            [`--rp-color-${color}-filled-hover`]: `var(--rp-color-${color}-${hoverShade})`,
            [`--rp-color-${color}-contrast`]: contrast,
            [`--rp-color-${color}-light`]: `var(--rp-color-${color}-1)`,
            [`--rp-color-${color}-light-hover`]: `var(--rp-color-${color}-2)`,
            [`--rp-color-${color}-light-color`]: `var(--rp-color-${color}-9)`,
            [`--rp-color-${color}-outline`]: `var(--rp-color-${color}-${outlineShade})`,
            [`--rp-color-${color}-outline-hover`]: `color-mix(in srgb, var(--rp-color-${color}-${outlineShade}) 5%, transparent)`,
        };
    }

    return {
        [`--rp-color-${color}-filled`]: `var(--rp-color-${color}-${primaryShade})`,
        [`--rp-color-${color}-filled-hover`]: `var(--rp-color-${color}-${hoverShade})`,
        [`--rp-color-${color}-contrast`]: contrast,
        [`--rp-color-${color}-light`]: `color-mix(in srgb, var(--rp-color-${color}-9) 50%, var(--rp-color-black))`,
        [`--rp-color-${color}-light-hover`]: `color-mix(in srgb, var(--rp-color-${color}-9) 70%, var(--rp-color-black))`,
        [`--rp-color-${color}-light-color`]: `var(--rp-color-${color}-0)`,
        [`--rp-color-${color}-outline`]: `var(--rp-color-${color}-${outlineShade})`,
        [`--rp-color-${color}-outline-hover`]: `color-mix(in srgb, var(--rp-color-${color}-${outlineShade}) 5%, transparent)`,
    };
}

export function getSchemeColorVariables(scheme) {
    if (scheme === 'dark') {
        return {
            '--rp-color-scheme': 'dark',
            '--rp-color-bright': 'var(--rp-color-white)',
            '--rp-color-text': 'var(--rp-color-dark-0)',
            '--rp-color-body': 'var(--rp-color-dark-7)',
            '--rp-color-placeholder': 'var(--rp-color-dark-3)',
            '--rp-color-default': 'var(--rp-color-dark-6)',
            '--rp-color-default-hover': 'var(--rp-color-dark-5)',
            '--rp-color-default-color': 'var(--rp-color-white)',
            '--rp-color-default-border': 'var(--rp-color-dark-4)',
            '--rp-color-default-border-hover': 'var(--rp-color-dark-3)',
            '--rp-color-dimmed': 'var(--rp-color-dark-2)',
            '--rp-color-disabled': 'var(--rp-color-dark-6)',
            '--rp-color-disabled-color': 'var(--rp-color-dark-3)',
            '--rp-color-disabled-border': 'var(--rp-color-dark-4)',
            '--rp-color-focus-ring':
                'color-mix(in srgb, var(--rp-primary-color-filled) 45%, transparent)',
            '--rp-color-control-bg': 'var(--rp-color-default)',
            '--rp-color-control-readonly-bg': 'var(--rp-color-default-hover)',
            '--rp-color-control-fg': 'var(--rp-color-default-color)',
            '--rp-color-control-placeholder': 'var(--rp-color-placeholder)',
            '--rp-color-control-icon': 'var(--rp-color-dimmed)',
            '--rp-color-control-border': 'var(--rp-color-default-border)',
            '--rp-color-control-border-hover': 'var(--rp-color-default-border-hover)',
            '--rp-color-control-border-focus': 'var(--rp-primary-color-filled)',
            '--rp-color-control-track-bg': 'var(--rp-color-disabled-border)',
            '--rp-color-control-thumb-bg': 'var(--rp-color-white)',
            '--rp-color-control-selected-bg': 'var(--rp-primary-color-filled)',
            '--rp-color-control-selected-fg': 'var(--rp-color-white)',
        };
    }

    return {
        '--rp-color-scheme': 'light',
        '--rp-color-bright': 'var(--rp-color-black)',
        '--rp-color-text': 'var(--rp-color-black)',
        '--rp-color-body': 'var(--rp-color-white)',
        '--rp-color-placeholder': 'var(--rp-color-gray-5)',
        '--rp-color-default': 'var(--rp-color-white)',
        '--rp-color-default-hover': 'var(--rp-color-gray-1)',
        '--rp-color-default-color': 'var(--rp-color-black)',
        '--rp-color-default-border': 'var(--rp-color-gray-4)',
        '--rp-color-default-border-hover': 'var(--rp-color-gray-5)',
        '--rp-color-dimmed': 'var(--rp-color-gray-6)',
        '--rp-color-disabled': 'var(--rp-color-gray-2)',
        '--rp-color-disabled-color': 'var(--rp-color-gray-5)',
        '--rp-color-disabled-border': 'var(--rp-color-gray-3)',
        '--rp-color-focus-ring':
            'color-mix(in srgb, var(--rp-primary-color-filled) 32%, transparent)',
        '--rp-color-control-bg': 'var(--rp-color-default)',
        '--rp-color-control-readonly-bg': 'var(--rp-color-default-hover)',
        '--rp-color-control-fg': 'var(--rp-color-default-color)',
        '--rp-color-control-placeholder': 'var(--rp-color-placeholder)',
        '--rp-color-control-icon': 'var(--rp-color-dimmed)',
        '--rp-color-control-border': 'var(--rp-color-default-border)',
        '--rp-color-control-border-hover': 'var(--rp-color-default-border-hover)',
        '--rp-color-control-border-focus': 'var(--rp-primary-color-filled)',
        '--rp-color-control-track-bg': 'var(--rp-color-disabled-border)',
        '--rp-color-control-thumb-bg': 'var(--rp-color-white)',
        '--rp-color-control-selected-bg': 'var(--rp-primary-color-filled)',
        '--rp-color-control-selected-fg': 'var(--rp-color-white)',
    };
}

export function getDerivedColorVariables(scheme) {
    return {
        ...(scheme === 'light'
            ? {
                  ...getPrimaryColorVariables(),
                  ...getColorShadeContrastVariables(),
              }
            : {}),
        ...Object.assign({}, ...colorNames.map((color) => getColorVariantVariables(color, scheme))),
        ...getSchemeColorVariables(scheme),
    };
}

export function getAllDerivedColorVariableNames() {
    return new Set([
        ...Object.keys(getPrimaryColorVariables()),
        ...Object.keys(getSchemeColorVariables('light')),
        ...Object.keys(getSchemeColorVariables('dark')),
        ...Object.keys(getColorShadeContrastVariables()),
        ...colorNames.flatMap((color) => [
            ...Object.keys(getColorVariantVariables(color, 'light')),
            ...Object.keys(getColorVariantVariables(color, 'dark')),
        ]),
    ]);
}

export function getColorShadeContrastVariables() {
    const variables = {};

    for (const color of colorNames) {
        for (const shade of colorShades) {
            variables[`--rp-color-${color}-${shade}-contrast`] = getReadableColorVariable(
                getColorTokenValue(color, shade),
            );
        }
    }

    return variables;
}

export function getReadableColorVariable(color) {
    const background = colorFromHex(color);
    const black = colorFromHex(getCoreColorTokenValue('black'));
    const white = colorFromHex(getCoreColorTokenValue('white'));
    const blackContrast = contrastRatio(black, background);
    const whiteContrast = contrastRatio(white, background);

    return blackContrast >= whiteContrast ? 'var(--rp-color-black)' : 'var(--rp-color-white)';
}

function getColorTokenValue(color, shade) {
    const token = defaultCoreTokens.color?.[color]?.[String(shade)];
    if (!token || typeof token.$value !== 'string') {
        throw new Error(`Missing color token value: color.${color}.${shade}`);
    }

    return token.$value;
}

function getCoreColorTokenValue(color) {
    const token = defaultCoreTokens.color?.[color];
    if (!token || typeof token.$value !== 'string') {
        throw new Error(`Missing core color token value: color.${color}`);
    }

    return token.$value;
}

function colorFromHex(hex) {
    const value = hex.trim();
    const shortHex = value.match(/^#([\da-f])([\da-f])([\da-f])$/i);
    if (shortHex) {
        return {
            red: Number.parseInt(shortHex[1] + shortHex[1], 16),
            green: Number.parseInt(shortHex[2] + shortHex[2], 16),
            blue: Number.parseInt(shortHex[3] + shortHex[3], 16),
            alpha: 1,
        };
    }

    const fullHex = value.match(/^#([\da-f]{6})$/i);
    if (!fullHex) {
        throw new Error(`Unsupported color value: ${hex}`);
    }

    return {
        red: Number.parseInt(value.slice(1, 3), 16),
        green: Number.parseInt(value.slice(3, 5), 16),
        blue: Number.parseInt(value.slice(5, 7), 16),
        alpha: 1,
    };
}

function contrastRatio(foreground, background) {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);

    return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color) {
    const [red, green, blue] = [color.red, color.green, color.blue]
        .map((channel) => channel / 255)
        .map((channel) =>
            channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
        );

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

const colorVariantSuffixes = [
    'filled',
    'filled-hover',
    'contrast',
    'light',
    'light-hover',
    'light-color',
    'outline',
    'outline-hover',
];
