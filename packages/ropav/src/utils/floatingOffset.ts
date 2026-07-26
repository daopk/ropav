export interface FloatingOffsetAxes {
    mainAxis?: number;
    crossAxis?: number;
}

export type FloatingOffsetValue = number | FloatingOffsetAxes;

export interface FloatingOffsetProperties {
    mainAxis: `--${string}`;
    crossAxis: `--${string}`;
}

export function getFloatingOffsetStyle(
    offset: FloatingOffsetValue | null | undefined,
    properties: FloatingOffsetProperties,
): Record<string, string> | undefined {
    if (offset == null) return undefined;

    if (typeof offset === 'number') {
        return { [properties.mainAxis]: `${offset}px` };
    }

    const style: Record<string, string> = {};
    if (offset.mainAxis != null) style[properties.mainAxis] = `${offset.mainAxis}px`;
    if (offset.crossAxis != null) style[properties.crossAxis] = `${offset.crossAxis}px`;

    return Object.keys(style).length > 0 ? style : undefined;
}
