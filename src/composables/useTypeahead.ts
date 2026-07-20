import { onBeforeUnmount } from 'vue';

const DEFAULT_TYPEAHEAD_TIMEOUT = 1000;
const COMBINING_MARKS = /\p{M}/gu;
const WHITESPACE = /\s+/g;

export interface UseTypeaheadOptions<T> {
    items: () => readonly T[];
    activeIndex: () => number;
    getKey: (item: T) => PropertyKey;
    getTextValue: (item: T) => string;
    onMatch: (item: T, index: number) => void;
    isDisabled?: (item: T) => boolean;
    scopeKey?: () => unknown;
    timeout?: number;
}

export function normalizeTypeaheadText(value: string, locales?: Intl.LocalesArgument) {
    return value
        .toLocaleLowerCase(locales)
        .normalize('NFKD')
        .replace(COMBINING_MARKS, '')
        .replace(WHITESPACE, ' ')
        .trim();
}

function isRepeatedQuery(query: string) {
    const characters = [...query];
    return characters.length > 1 && characters.every((character) => character === characters[0]);
}

export function useTypeahead<T>(options: UseTypeaheadOptions<T>) {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastMatch: { item: T; index: number; key: PropertyKey } | undefined;
    let currentScope = options.scopeKey?.();
    const isDisabled = options.isDisabled ?? (() => false);

    function clearTimer() {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
    }

    function reset() {
        clearTimer();
        buffer = '';
        lastMatch = undefined;
        currentScope = options.scopeKey?.();
    }

    function scheduleReset() {
        clearTimer();
        timer = setTimeout(reset, options.timeout ?? DEFAULT_TYPEAHEAD_TIMEOUT);
    }

    function hasBuffer() {
        return buffer.length > 0;
    }

    function getMatchIndex(query: string, startIndex: number, keepCurrent: boolean) {
        const items = options.items();
        if (items.length === 0) return -1;

        function matches(index: number) {
            const item = items[index];
            return Boolean(
                item &&
                !isDisabled(item) &&
                normalizeTypeaheadText(options.getTextValue(item)).startsWith(query),
            );
        }

        if (keepCurrent && startIndex >= 0 && matches(startIndex)) return startIndex;

        for (let offset = 1; offset <= items.length; offset += 1) {
            const index = (startIndex + offset + items.length) % items.length;
            if (matches(index)) return index;
        }
        return -1;
    }

    function getLastMatchIndex(items: readonly T[]) {
        const match = lastMatch;
        if (!match) return -1;
        if (Object.is(items[match.index], match.item)) return match.index;

        const identityIndex = items.findIndex((item) => Object.is(item, match.item));
        if (identityIndex >= 0) return identityIndex;

        let keyIndex = -1;
        for (let index = 0; index < items.length; index += 1) {
            if (!Object.is(options.getKey(items[index]!), match.key)) continue;
            if (keyIndex >= 0) return -1;
            keyIndex = index;
        }
        return keyIndex;
    }

    function handleKey(event: KeyboardEvent) {
        const nextScope = options.scopeKey?.();
        if (!Object.is(currentScope, nextScope)) reset();
        currentScope = nextScope;

        if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.isComposing ||
            event.key.length !== 1 ||
            (event.key === ' ' && !hasBuffer())
        ) {
            return false;
        }

        event.preventDefault();
        buffer += event.key;
        scheduleReset();

        const normalizedBuffer = normalizeTypeaheadText(buffer);
        if (!normalizedBuffer) return true;
        const repeated = isRepeatedQuery(normalizedBuffer);
        const query = repeated ? [...normalizedBuffer][0]! : normalizedBuffer;
        const items = options.items();
        const lastMatchIndex = getLastMatchIndex(items);
        const activeIndex = lastMatchIndex >= 0 ? lastMatchIndex : options.activeIndex();
        const matchIndex = getMatchIndex(query, activeIndex, !repeated && query.length > 1);
        if (matchIndex < 0) return true;

        const item = items[matchIndex];
        if (!item) return true;
        lastMatch = { item, index: matchIndex, key: options.getKey(item) };
        options.onMatch(item, matchIndex);
        return true;
    }

    onBeforeUnmount(clearTimer);

    return { handleKey, hasBuffer, reset };
}
