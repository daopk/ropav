import { computed, shallowRef, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { getEnabledIndexes, getNextEnabledIndex } from '@/utils/collectionNavigation';

export interface UseFlatOptionCollectionOptions<T extends object, Key extends PropertyKey> {
    items: () => readonly T[];
    baseId: string;
    isOpen: () => boolean;
    collectionRef: Readonly<Ref<HTMLElement | null>>;
    getKey: (item: T) => Key;
    isDisabled?: (item: T) => boolean;
    isSelected?: (item: T) => boolean;
    getItemsChangeActivation?: () => 'first' | 'selected' | undefined;
    loop?: boolean;
}

export interface FlatOptionState<T extends object> {
    readonly option: T;
    readonly id: string;
    readonly active: boolean;
    readonly disabled: boolean;
    readonly selected: boolean;
}

export type FlatOptionActivation<T extends object> = T | 'first' | 'last' | 'selected';

export interface FlatOptionCollection<T extends object> {
    options: ComputedRef<readonly FlatOptionState<T>[]>;
    activeIndex: ComputedRef<number>;
    activeDescendantId: ComputedRef<string | undefined>;
    activate: (target: FlatOptionActivation<T>) => void;
    move: (direction: 1 | -1) => void;
    reset: () => void;
}

function findActiveDescendant(collection: HTMLElement, id: string) {
    const documentMatch = collection.ownerDocument.getElementById(id);
    if (documentMatch && collection.contains(documentMatch)) return documentMatch;

    return [...collection.querySelectorAll<HTMLElement>('[id]')].find(
        (element) => element.id === id,
    );
}

export function useFlatOptionCollection<T extends object, Key extends PropertyKey>(
    options: Readonly<UseFlatOptionCollectionOptions<T, Key>>,
): FlatOptionCollection<T> {
    const activeKey = shallowRef<Key | null>(null);
    const isDisabled = options.isDisabled ?? (() => false);
    const isSelected = options.isSelected ?? (() => false);
    const loop = options.loop ?? true;

    const activeIndex = computed(() => {
        if (activeKey.value == null) return -1;
        return options
            .items()
            .findIndex((item) => options.getKey(item) === activeKey.value && !isDisabled(item));
    });
    const enabledIndexes = computed(() => getEnabledIndexes(options.items(), isDisabled));
    const optionStates = computed(() =>
        options.items().map((option, index) => ({
            option,
            id: `${options.baseId}-option-${index}`,
            active: index === activeIndex.value,
            disabled: isDisabled(option),
            selected: isSelected(option),
        })),
    );
    const activeDescendantId = computed(() => {
        if (!options.isOpen()) return undefined;
        return optionStates.value[activeIndex.value]?.id;
    });
    const collectionSnapshot = computed(() =>
        options.items().map((item) => [options.getKey(item), isDisabled(item)] as const),
    );

    function reset() {
        activeKey.value = null;
    }

    function activateIndex(index: number) {
        const item = options.items()[index];
        if (!item || isDisabled(item)) return;
        activeKey.value = options.getKey(item);
    }

    function activate(target: FlatOptionActivation<T>) {
        if (target === 'first') {
            const first = enabledIndexes.value[0];
            if (first === undefined) reset();
            else activateIndex(first);
            return;
        }

        if (target === 'last') {
            const indexes = enabledIndexes.value;
            const last = indexes[indexes.length - 1];
            if (last === undefined) reset();
            else activateIndex(last);
            return;
        }

        if (target === 'selected') {
            const selectedIndex = options
                .items()
                .findIndex((item) => isSelected(item) && !isDisabled(item));
            if (selectedIndex >= 0) activateIndex(selectedIndex);
            else activate('first');
            return;
        }

        if (!isDisabled(target)) activeKey.value = options.getKey(target);
    }

    function move(direction: 1 | -1) {
        if (activeIndex.value < 0) {
            activate(direction === 1 ? 'first' : 'last');
            return;
        }

        const nextIndex = getNextEnabledIndex(
            options.items(),
            activeIndex.value,
            direction,
            isDisabled,
            loop,
        );
        if (nextIndex === undefined) reset();
        else activateIndex(nextIndex);
    }

    watch(
        activeIndex,
        (index) => {
            if (activeKey.value != null && index < 0) reset();
        },
        { flush: 'sync' },
    );
    watch(collectionSnapshot, () => {
        if (activeIndex.value >= 0) return;
        const target = options.getItemsChangeActivation?.();
        if (target) activate(target);
    });
    watch(
        [activeDescendantId, options.collectionRef],
        ([id, collection]) => {
            if (!id || !collection) return;
            findActiveDescendant(collection, id)?.scrollIntoView?.({ block: 'nearest' });
        },
        { flush: 'post', immediate: true },
    );

    return {
        options: optionStates,
        activeIndex,
        activeDescendantId,
        activate,
        move,
        reset,
    };
}
