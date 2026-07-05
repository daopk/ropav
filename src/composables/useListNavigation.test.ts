import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useListNavigation, type ListNavigationItem } from './useListNavigation';

interface Item extends ListNavigationItem {
    id: string;
}

describe('useListNavigation', () => {
    it('focuses selected items, skips disabled items, and loops by default', () => {
        const items = ref<Item[]>([
            { id: 'alpha' },
            { id: 'beta', disabled: true },
            { id: 'gamma' },
        ]);
        const navigation = useListNavigation({
            items: () => items.value,
            isSelected: (item) => item.id === 'beta',
        });

        navigation.focusSelected();
        expect(navigation.focusedIndex.value).toBe(0);

        navigation.moveFocus(1);
        expect(navigation.focusedIndex.value).toBe(2);

        navigation.moveFocus(1);
        expect(navigation.focusedIndex.value).toBe(0);

        navigation.moveFocus(-1);
        expect(navigation.focusedIndex.value).toBe(2);
    });

    it('stays at list boundaries when looping is disabled', () => {
        const navigation = useListNavigation<Item>({
            items: () => [{ id: 'alpha' }, { id: 'beta', disabled: true }, { id: 'gamma' }],
            loop: false,
        });

        navigation.focusFirst();
        navigation.moveFocus(-1);
        expect(navigation.focusedIndex.value).toBe(0);

        navigation.focusLast();
        navigation.moveFocus(1);
        expect(navigation.focusedIndex.value).toBe(2);
    });

    it('resets focus when no enabled items are available', () => {
        const items = ref<Item[]>([{ id: 'alpha', disabled: true }]);
        const navigation = useListNavigation({ items: () => items.value });

        navigation.focusFirst();
        expect(navigation.focusedIndex.value).toBe(-1);

        navigation.focusedIndex.value = 0;
        items.value = [];
        navigation.moveFocus(1);

        expect(navigation.focusedIndex.value).toBe(-1);
    });
});
