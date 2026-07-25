import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useFlatOptionCollection } from './useFlatOptionCollection';

interface Item {
    id: string;
    disabled?: boolean;
    selected?: boolean;
}

function createCollection(
    initialItems: Item[],
    options: {
        baseId?: string;
        loop?: boolean;
        open?: boolean;
        itemsChangeActivation?: 'first' | 'selected';
    } = {},
) {
    const items = ref(initialItems);
    const isOpen = ref(options.open ?? true);
    const itemsChangeActivation = ref<'first' | 'selected' | undefined>(
        options.itemsChangeActivation,
    );
    const collectionRef = ref<HTMLElement | null>(null);
    const scope = effectScope();
    const collection = scope.run(() =>
        useFlatOptionCollection({
            items: () => items.value,
            baseId: options.baseId ?? 'fruit',
            isOpen: () => isOpen.value,
            collectionRef,
            getKey: (item) => item.id,
            isDisabled: (item) => Boolean(item.disabled),
            isSelected: (item) => Boolean(item.selected),
            getItemsChangeActivation: () => itemsChangeActivation.value,
            loop: options.loop,
        }),
    )!;

    return { collection, collectionRef, isOpen, items, itemsChangeActivation, scope };
}

describe('useFlatOptionCollection', () => {
    it('coheres render state, selected activation, enabled navigation, and active identity', () => {
        const alpha = { id: 'alpha' };
        const beta = { id: 'beta', disabled: true, selected: true };
        const gamma = { id: 'gamma' };
        const { collection, isOpen, scope } = createCollection([alpha, beta, gamma]);

        collection.activate('selected');

        expect(collection.activeIndex.value).toBe(0);
        expect(collection.activeDescendantId.value).toBe('fruit-option-0');
        expect(collection.options.value).toEqual([
            {
                option: alpha,
                id: 'fruit-option-0',
                active: true,
                disabled: false,
                selected: false,
            },
            {
                option: beta,
                id: 'fruit-option-1',
                active: false,
                disabled: true,
                selected: true,
            },
            {
                option: gamma,
                id: 'fruit-option-2',
                active: false,
                disabled: false,
                selected: false,
            },
        ]);

        collection.move(1);
        expect(collection.activeIndex.value).toBe(2);
        collection.move(1);
        expect(collection.activeIndex.value).toBe(0);
        collection.move(-1);
        expect(collection.activeIndex.value).toBe(2);

        isOpen.value = false;
        expect(collection.activeDescendantId.value).toBeUndefined();
        scope.stop();
    });

    it('preserves active identity through reordering and regenerates coherent option ids', async () => {
        const alpha = { id: 'alpha' };
        const beta = { id: 'beta' };
        const gamma = { id: 'gamma' };
        const { collection, items, scope } = createCollection([alpha, beta, gamma]);

        collection.activate(beta);
        items.value = [beta, gamma, alpha];
        await nextTick();

        expect(collection.activeIndex.value).toBe(0);
        expect(collection.activeDescendantId.value).toBe('fruit-option-0');
        expect(collection.options.value[0]).toMatchObject({
            option: beta,
            id: 'fruit-option-0',
            active: true,
        });
        scope.stop();
    });

    it('stays at list boundaries when looping is disabled', () => {
        const { collection, scope } = createCollection(
            [{ id: 'alpha' }, { id: 'beta', disabled: true }, { id: 'gamma' }],
            { loop: false },
        );

        collection.activate('first');
        collection.move(-1);
        expect(collection.activeIndex.value).toBe(0);

        collection.activate('last');
        collection.move(1);
        expect(collection.activeIndex.value).toBe(2);

        collection.reset();
        collection.move(-1);
        expect(collection.activeIndex.value).toBe(2);
        scope.stop();
    });

    it('repairs an empty active state only when the caller policy requests it', async () => {
        const { collection, items, itemsChangeActivation, scope } = createCollection([], {
            itemsChangeActivation: 'first',
        });

        items.value = [{ id: 'disabled', disabled: true }, { id: 'available' }];
        await nextTick();
        expect(collection.activeIndex.value).toBe(1);

        itemsChangeActivation.value = undefined;
        items.value = [{ id: 'replacement' }];
        await nextTick();
        expect(collection.activeIndex.value).toBe(-1);

        itemsChangeActivation.value = 'selected';
        items.value = [{ id: 'next' }, { id: 'chosen', selected: true }];
        await nextTick();
        expect(collection.activeIndex.value).toBe(1);
        scope.stop();
    });

    it('scrolls the exact active option after its collection ref resolves', async () => {
        const activeOption = { id: 'beta', selected: true };
        const { collection, collectionRef, scope } = createCollection(
            [{ id: 'alpha' }, activeOption],
            { baseId: 'fruit:"[list]' },
        );
        const collectionElement = document.createElement('div');
        const activeElement = document.createElement('div');
        activeElement.id = collection.options.value[1]!.id;
        activeElement.scrollIntoView = vi.fn();
        collectionElement.append(activeElement);

        collection.activate('selected');
        collectionRef.value = collectionElement;
        await nextTick();
        await nextTick();

        expect(activeElement.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
        scope.stop();
    });

    it('does not scroll an option outside the collection', async () => {
        const { collection, collectionRef, scope } = createCollection([{ id: 'alpha' }]);
        const collectionElement = document.createElement('div');
        const outsideOption = document.createElement('div');
        outsideOption.id = collection.options.value[0]!.id;
        outsideOption.scrollIntoView = vi.fn();
        document.body.append(collectionElement, outsideOption);
        collectionRef.value = collectionElement;

        collection.activate('first');
        await nextTick();
        await nextTick();

        expect(outsideOption.scrollIntoView).not.toHaveBeenCalled();
        scope.stop();
        collectionElement.remove();
        outsideOption.remove();
    });
});
