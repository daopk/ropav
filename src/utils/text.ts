const COMBINING_MARKS = /\p{M}/gu;
const WHITESPACE = /\s+/g;

export function getNameInitials(name: string | null | undefined) {
    if (!name) return '';

    const parts = name.trim().split(WHITESPACE).filter(Boolean);
    const firstPart = parts[0];
    if (!firstPart) return '';

    if (parts.length === 1) {
        return Array.from(firstPart).slice(0, 2).join('').toLocaleUpperCase();
    }

    const lastPart = parts.at(-1) ?? firstPart;
    const firstInitial = Array.from(firstPart)[0] ?? '';
    const lastInitial = Array.from(lastPart)[0] ?? '';

    return `${firstInitial}${lastInitial}`.toLocaleUpperCase();
}

export function normalizeTypeaheadText(value: string, locales?: Intl.LocalesArgument) {
    return value
        .toLocaleLowerCase(locales)
        .normalize('NFKD')
        .replace(COMBINING_MARKS, '')
        .replace(WHITESPACE, ' ')
        .trim();
}
