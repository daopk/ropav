export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function getValuePercent(value: number, min: number, max: number) {
    if (![value, min, max].every(Number.isFinite) || max <= min) return 0;
    return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

export function normalizeDelay(value: number | null | undefined, fallback = 0) {
    if (value == null) return fallback;
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function roundTo(value: number, fractionDigits = 2) {
    const factor = 10 ** fractionDigits;
    return Math.round(value * factor) / factor;
}
