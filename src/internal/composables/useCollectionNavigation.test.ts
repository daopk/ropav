import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useCollectionNavigation } from './useCollectionNavigation';

interface Item {
    id: string;
    disabled?: boolean;
}

describe('useCollectionNavigation', () => {
    it('focuses selected items, skips disabled items, and loops by default', () => {
        const items = ref<Item[]>([
            { id: 'alpha' },
            { id: 'beta', disabled: true },
            { id: 'gamma' },
        ]);
        const navigation = useCollectionNavigation({
            items: () => items.value,
            getKey: (item) => item.id,
            isDisabled: (item) => Boolean(item.disabled),
            isSelected: (item) => item.id === 'beta',
        });

        navigation.focusSelected();
        expect(navigation.activeIndex.value).toBe(0);

        navigation.moveFocus(1);
        expect(navigation.activeIndex.value).toBe(2);

        navigation.moveFocus(1);
        expect(navigation.activeIndex.value).toBe(0);

        navigation.moveFocus(-1);
        expect(navigation.activeIndex.value).toBe(2);
    });

    it('preserves the active item by key when a collection is reordered', () => {
        const items = ref<Item[]>([{ id: 'alpha' }, { id: 'beta' }, { id: 'gamma' }]);
        const navigation = useCollectionNavigation({
            items: () => items.value,
            getKey: (item) => item.id,
        });

        navigation.setActiveIndex(1);
        items.value = [{ id: 'beta' }, { id: 'gamma' }, { id: 'alpha' }];

        expect(navigation.activeKey.value).toBe('beta');
        expect(navigation.activeIndex.value).toBe(0);
    });

    it('stays at list boundaries when looping is disabled', () => {
        const navigation = useCollectionNavigation<Item, string>({
            items: () => [{ id: 'alpha' }, { id: 'beta', disabled: true }, { id: 'gamma' }],
            getKey: (item) => item.id,
            isDisabled: (item) => Boolean(item.disabled),
            loop: false,
        });

        navigation.focusFirst();
        navigation.moveFocus(-1);
        expect(navigation.activeIndex.value).toBe(0);

        navigation.focusLast();
        navigation.moveFocus(1);
        expect(navigation.activeIndex.value).toBe(2);

        navigation.resetActive();
        navigation.moveFocus(-1);
        expect(navigation.activeIndex.value).toBe(2);
    });

    it('resets when the active item is removed or no enabled items exist', async () => {
        const items = ref<Item[]>([{ id: 'alpha' }]);
        const navigation = useCollectionNavigation({
            items: () => items.value,
            getKey: (item) => item.id,
            isDisabled: (item) => Boolean(item.disabled),
        });

        navigation.focusFirst();
        items.value = [{ id: 'beta', disabled: true }];
        await Promise.resolve();

        expect(navigation.activeKey.value).toBeNull();
        expect(navigation.activeIndex.value).toBe(-1);

        navigation.focusFirst();
        expect(navigation.activeIndex.value).toBe(-1);
    });
});
