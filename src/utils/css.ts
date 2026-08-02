export type CssLength = number | string | null | undefined;

export function toCssLength(value: CssLength): string | undefined {
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;
    if (typeof value !== 'string') return undefined;

    return value.trim() || undefined;
}

export function toPositiveCssLength(value: CssLength): string | undefined {
    if (typeof value === 'number' && value <= 0) return undefined;
    return toCssLength(value);
}
