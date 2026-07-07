export const componentColors = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
    'neutral',
] as const;

export type ComponentColor = (typeof componentColors)[number];

export type ComponentColorValue = ComponentColor | (string & {});

const componentColorNames = new Set<string>(componentColors);

export function isComponentPresetColor(
    color: ComponentColorValue | undefined,
): color is ComponentColor {
    return Boolean(color && componentColorNames.has(color));
}

export function getComponentCustomColor(color: ComponentColorValue | undefined) {
    if (!color || isComponentPresetColor(color)) return undefined;

    return color;
}
