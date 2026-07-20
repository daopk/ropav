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

export function normalizeTypeaheadText(value: string) {
    return value
        .normalize('NFKD')
        .replace(COMBINING_MARKS, '')
        .toLocaleLowerCase()
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
    let lastMatchKey: PropertyKey | null = null;
    let currentScope = options.scopeKey?.();
    const isDisabled = options.isDisabled ?? (() => false);

    function clearTimer() {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
    }

    function reset() {
        clearTimer();
        buffer = '';
        lastMatchKey = null;
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
        const lastMatchIndex =
            lastMatchKey == null
                ? -1
                : items.findIndex((item) => options.getKey(item) === lastMatchKey);
        const activeIndex = lastMatchIndex >= 0 ? lastMatchIndex : options.activeIndex();
        const matchIndex = getMatchIndex(query, activeIndex, !repeated && query.length > 1);
        if (matchIndex < 0) return true;

        const item = items[matchIndex];
        if (!item) return true;
        lastMatchKey = options.getKey(item);
        options.onMatch(item, matchIndex);
        return true;
    }

    onBeforeUnmount(clearTimer);

    return { handleKey, hasBuffer, reset };
}
