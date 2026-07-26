export function toPresenceAttribute(value: unknown): '' | undefined {
    return value ? '' : undefined;
}

export function toOptionalAttribute<T extends boolean | string | undefined>(
    value: T,
): T | undefined {
    return value || undefined;
}
