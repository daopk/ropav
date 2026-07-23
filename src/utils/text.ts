const COMBINING_MARKS = /\p{M}/gu;
const WHITESPACE = /\s+/g;

export function normalizeTypeaheadText(value: string, locales?: Intl.LocalesArgument) {
    return value
        .toLocaleLowerCase(locales)
        .normalize('NFKD')
        .replace(COMBINING_MARKS, '')
        .replace(WHITESPACE, ' ')
        .trim();
}
