import { computed, ref } from 'vue';

export interface ListNavigationItem {
    disabled?: boolean;
}

export interface UseListNavigationOptions<T extends ListNavigationItem> {
    items: () => T[];
    isSelected?: (item: T) => boolean;
    loop?: boolean;
}

export function useListNavigation<T extends ListNavigationItem>(
    options: UseListNavigationOptions<T>,
) {
    const localFocusedIndex = ref(-1);
    const loop = options.loop ?? true;

    const enabledIndexes = computed(() =>
        options.items()
            .map((item, index) => item.disabled ? -1 : index)
            .filter((index) => index >= 0),
    );

    function resetFocus() {
        localFocusedIndex.value = -1;
    }

    function setNearest(index: number, direction: 1 | -1) {
        const indexes = enabledIndexes.value;
        if (indexes.length === 0) {
            resetFocus();
            return;
        }

        if (options.items()[index] && !options.items()[index]?.disabled) {
            localFocusedIndex.value = index;
            return;
        }

        const next = direction === 1
            ? indexes.find((i) => i > index)
            : [...indexes].reverse().find((i) => i < index);

        if (next !== undefined) {
            localFocusedIndex.value = next;
        } else if (loop) {
            localFocusedIndex.value = direction === 1 ? indexes[0]! : indexes[indexes.length - 1]!;
        }
    }

    function focusSelected() {
        const items = options.items();
        const selectedIndex = options.isSelected
            ? items.findIndex((item) => options.isSelected!(item) && !item.disabled)
            : -1;
        if (selectedIndex >= 0) {
            localFocusedIndex.value = selectedIndex;
        } else {
            focusFirst();
        }
    }

    function focusFirst() {
        const first = enabledIndexes.value[0];
        localFocusedIndex.value = first ?? -1;
    }

    function focusLast() {
        const indexes = enabledIndexes.value;
        localFocusedIndex.value = indexes[indexes.length - 1] ?? -1;
    }

    function moveFocus(delta: 1 | -1) {
        if (localFocusedIndex.value < 0) {
            delta === 1 ? focusFirst() : focusLast();
            return;
        }
        setNearest(localFocusedIndex.value + delta, delta);
    }

    return {
        focusedIndex: localFocusedIndex,
        resetFocus,
        focusSelected,
        focusFirst,
        focusLast,
        moveFocus,
    };
}
