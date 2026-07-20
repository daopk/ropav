import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountDom } from '../../tests/utils/vue';
import { normalizeTypeaheadText, useTypeahead } from './useTypeahead';

interface Item {
    label: string;
    disabled?: boolean;
}

function keyboardEvent(key: string, init: KeyboardEventInit = {}) {
    return new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
    });
}

function createTypeahead(
    items: Item[],
    options: {
        activeIndex?: () => number;
        getKey?: (item: Item) => PropertyKey;
        scopeKey?: () => unknown;
        timeout?: number;
    } = {},
) {
    const matches: Array<{ item: Item; index: number }> = [];
    let typeahead!: ReturnType<typeof useTypeahead<Item>>;

    mountDom(
        defineComponent({
            setup() {
                typeahead = useTypeahead({
                    items: () => items,
                    activeIndex: options.activeIndex ?? (() => -1),
                    getKey: options.getKey ?? ((item) => item.label),
                    getTextValue: (item) => item.label,
                    isDisabled: (item) => Boolean(item.disabled),
                    onMatch(item, index) {
                        matches.push({ item, index });
                    },
                    scopeKey: options.scopeKey,
                    timeout: options.timeout,
                });
                return () => h('div');
            },
        }),
    );

    return { typeahead, matches };
}

afterEach(() => vi.useRealTimers());

describe('useTypeahead', () => {
    it('case-folds locale-specific letters before stripping combining marks', () => {
        expect(normalizeTypeaheadText('İstanbul', 'tr')).toBe(
            normalizeTypeaheadText('istanbul', 'tr'),
        );
    });

    it('matches case and accents, skips disabled items, wraps, and cycles repeated keys', () => {
        const { typeahead, matches } = createTypeahead([
            { label: 'Éclair', disabled: true },
            { label: 'Elderberry' },
            { label: 'Espresso' },
        ]);

        expect(typeahead.handleKey(keyboardEvent('e'))).toBe(true);
        expect(matches.at(-1)).toMatchObject({ index: 1 });

        typeahead.handleKey(keyboardEvent('E'));
        expect(matches.at(-1)).toMatchObject({ index: 2 });

        typeahead.handleKey(keyboardEvent('e'));
        expect(matches.at(-1)).toMatchObject({ index: 1 });
    });

    it('refines the current match with multiple characters and supports spaces', () => {
        const { typeahead, matches } = createTypeahead([
            { label: 'New Jersey' },
            { label: 'New York' },
            { label: 'Nevada' },
        ]);

        for (const key of ['n', 'e', 'w', ' ', 'y']) {
            typeahead.handleKey(keyboardEvent(key));
        }

        expect(matches.at(-1)?.item.label).toBe('New York');
    });

    it('keeps the repeated-key cursor on the matched key after reordering', () => {
        const items = [{ label: 'Alpha' }, { label: 'Aster' }];
        const { typeahead, matches } = createTypeahead(items);

        typeahead.handleKey(keyboardEvent('a'));
        items.splice(0, items.length, { label: 'Aster' }, { label: 'Alpha' });
        typeahead.handleKey(keyboardEvent('a'));

        expect(matches.at(-1)?.item.label).toBe('Aster');
    });

    it('cycles distinct matches that share a key', () => {
        const { typeahead, matches } = createTypeahead(
            [{ label: 'Alpha' }, { label: 'Apple' }, { label: 'Apricot' }],
            { getKey: () => 'shared' },
        );

        typeahead.handleKey(keyboardEvent('a'));
        typeahead.handleKey(keyboardEvent('a'));
        typeahead.handleKey(keyboardEvent('a'));

        expect(matches.map(({ index }) => index)).toEqual([0, 1, 2]);
    });

    it('starts a new search after the timeout and when the scope changes', () => {
        vi.useFakeTimers();
        let scope = 'root';
        const { typeahead, matches } = createTypeahead(
            [{ label: 'Alpha' }, { label: 'Beta' }, { label: 'Bravo' }],
            { scopeKey: () => scope, timeout: 1000 },
        );

        typeahead.handleKey(keyboardEvent('b'));
        typeahead.handleKey(keyboardEvent('r'));
        expect(matches.at(-1)?.item.label).toBe('Bravo');

        vi.advanceTimersByTime(1000);
        typeahead.handleKey(keyboardEvent('b'));
        expect(matches.at(-1)?.item.label).toBe('Beta');

        scope = 'submenu';
        typeahead.handleKey(keyboardEvent('b'));
        expect(matches.at(-1)?.item.label).toBe('Beta');
    });

    it('ignores modifiers, composition, non-printable keys, and an initial space', () => {
        const { typeahead, matches } = createTypeahead([{ label: 'Alpha' }]);
        const events = [
            keyboardEvent('a', { ctrlKey: true }),
            keyboardEvent('a', { metaKey: true }),
            keyboardEvent('a', { altKey: true }),
            keyboardEvent('a', { isComposing: true }),
            keyboardEvent('ArrowDown'),
            keyboardEvent(' '),
        ];

        for (const event of events) {
            expect(typeahead.handleKey(event)).toBe(false);
            expect(event.defaultPrevented).toBe(false);
        }
        expect(matches).toEqual([]);
    });
});
