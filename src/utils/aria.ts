import { hasAttributeToken, parseAttributeTokens } from './dom/attributes';

export function parseAriaIdRefs(value: string | null | undefined): string[] {
    return parseAttributeTokens(value);
}

export function hasAriaIdRef(value: string | null | undefined, id: string) {
    return hasAttributeToken(value, id);
}

export function mergeAriaIdRefs(...values: Array<string | null | undefined>): string | undefined {
    const ids = values.flatMap(parseAriaIdRefs);
    return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined;
}
