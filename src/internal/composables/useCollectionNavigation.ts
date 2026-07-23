import { computed, shallowRef, watch } from 'vue';
import type { ComputedRef, ShallowRef } from 'vue';
import { getEnabledIndexes, getNextEnabledIndex } from '@/utils/collectionNavigation';

export interface UseCollectionNavigationOptions<T, Key extends PropertyKey> {
    items: () => readonly T[];
    getKey: (item: T) => Key;
    isDisabled?: (item: T) => boolean;
    isSelected?: (item: T) => boolean;
    loop?: boolean;
}

export interface CollectionNavigation<Key extends PropertyKey> {
    activeKey: ShallowRef<Key | null>;
    activeIndex: ComputedRef<number>;
    enabledIndexes: ComputedRef<number[]>;
    resetActive: () => void;
    setActiveIndex: (index: number) => boolean;
    focusSelected: () => void;
    focusFirst: () => void;
    focusLast: () => void;
    moveFocus: (direction: 1 | -1) => void;
}

export function useCollectionNavigation<T, Key extends PropertyKey>(
    options: UseCollectionNavigationOptions<T, Key>,
): CollectionNavigation<Key> {
    const activeKey = shallowRef<Key | null>(null) as ShallowRef<Key | null>;
    const isDisabled = options.isDisabled ?? (() => false);
    const loop = options.loop ?? true;

    const activeIndex = computed(() => {
        if (activeKey.value == null) return -1;
        return options
            .items()
            .findIndex((item) => options.getKey(item) === activeKey.value && !isDisabled(item));
    });

    const enabledIndexes = computed(() => getEnabledIndexes(options.items(), isDisabled));

    function resetActive() {
        activeKey.value = null;
    }

    function setActiveIndex(index: number) {
        const item = options.items()[index];
        if (!item || isDisabled(item)) return false;
        activeKey.value = options.getKey(item);
        return true;
    }

    function focusSelected() {
        const items = options.items();
        const selectedIndex = options.isSelected
            ? items.findIndex((item) => options.isSelected!(item) && !isDisabled(item))
            : -1;
        if (selectedIndex >= 0) setActiveIndex(selectedIndex);
        else focusFirst();
    }

    function focusFirst() {
        const first = enabledIndexes.value[0];
        if (first === undefined) resetActive();
        else setActiveIndex(first);
    }

    function focusLast() {
        const indexes = enabledIndexes.value;
        const last = indexes[indexes.length - 1];
        if (last === undefined) resetActive();
        else setActiveIndex(last);
    }

    function moveFocus(direction: 1 | -1) {
        if (activeIndex.value < 0) {
            if (direction === 1) focusFirst();
            else focusLast();
            return;
        }
        const nextIndex = getNextEnabledIndex(
            options.items(),
            activeIndex.value,
            direction,
            isDisabled,
            loop,
        );
        if (nextIndex === undefined) resetActive();
        else setActiveIndex(nextIndex);
    }

    watch(
        activeIndex,
        (index) => {
            if (activeKey.value != null && index < 0) resetActive();
        },
        { flush: 'sync' },
    );

    return {
        activeKey,
        activeIndex,
        enabledIndexes,
        resetActive,
        setActiveIndex,
        focusSelected,
        focusFirst,
        focusLast,
        moveFocus,
    };
}
