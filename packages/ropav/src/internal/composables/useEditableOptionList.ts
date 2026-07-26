import { computed, nextTick, ref, watch, type ComputedRef, type Ref } from 'vue';
import { isNodeWithinElement } from '@/utils/dom/events';
import { isInteractiveElement } from '@/utils/dom/interactive';
import { filterOptions, type LabeledOption, type OptionFilter } from '@/utils/optionFilter';
import { useClickOutside } from './useClickOutside';
import { useFlatOptionCollection, type FlatOptionState } from './useFlatOptionCollection';

interface EditableOptionListSelectionBase<Option extends LabeledOption> {
    clear: () => void;
    hasSelection: () => boolean;
    isSelected: (option: Option) => boolean;
    select: (option: Option) => void;
}

export interface SingleEditableOptionListSelection<
    Option extends LabeledOption,
> extends EditableOptionListSelectionBase<Option> {
    kind: 'single';
    displayValue: () => string;
}

export interface MultipleEditableOptionListSelection<
    Option extends LabeledOption,
> extends EditableOptionListSelectionBase<Option> {
    kind: 'multiple';
    removeLast: () => void;
}

export type EditableOptionListSelection<Option extends LabeledOption> =
    | SingleEditableOptionListSelection<Option>
    | MultipleEditableOptionListSelection<Option>;

export interface UseEditableOptionListOptions<
    Option extends LabeledOption,
    Key extends PropertyKey,
> {
    baseId: string;
    clearable: () => boolean;
    disabled: () => boolean;
    filter: () => OptionFilter<Option> | false | undefined;
    getKey: (option: Option) => Key;
    inputRef: Ref<HTMLInputElement | null>;
    isDisabled: (option: Option) => boolean;
    items: () => readonly Option[] | undefined;
    onSearch: (searchValue: string) => void;
    rootRef: Ref<HTMLElement | null>;
    selection: EditableOptionListSelection<Option>;
}

interface EditableOptionListState<Option extends LabeledOption> {
    activeDescendantId: ComputedRef<string | undefined>;
    canClear: ComputedRef<boolean>;
    isOpen: Ref<boolean>;
    renderedOptions: ComputedRef<readonly FlatOptionState<Option>[]>;
    searchValue: Ref<string>;
    visibleOptions: ComputedRef<Option[]>;
}

interface EditableOptionListActions<Option extends LabeledOption> {
    clearSelection: () => void;
    focusInput: () => void;
    resetAfterFormReset: () => void;
    selectOption: (option: Option) => void;
    toggle: () => void;
}

interface EditableOptionListHandlers<Option extends LabeledOption> {
    onFocusout: (event: FocusEvent) => void;
    onInput: (event: Event) => void;
    onInputClick: () => void;
    onInputFocus: () => void;
    onInputKeydown: (event: KeyboardEvent) => void;
    onOptionMouseenter: (option: Option) => void;
    onRootMousedown: (event: MouseEvent) => void;
}

export interface EditableOptionList<Option extends LabeledOption> {
    actions: EditableOptionListActions<Option>;
    handlers: EditableOptionListHandlers<Option>;
    ids: {
        listbox: string;
        popup: string;
    };
    state: EditableOptionListState<Option>;
}

export function useEditableOptionList<Option extends LabeledOption, Key extends PropertyKey>(
    options: Readonly<UseEditableOptionListOptions<Option, Key>>,
): EditableOptionList<Option> {
    const selection = options.selection;
    const isSingle = selection.kind === 'single';
    const isOpen = ref(false);
    const isSearching = ref(false);
    const popupId = `${options.baseId}-popup`;
    const searchValue = ref(isSingle ? selection.displayValue() : '');
    const filterValue = computed(() => (isSingle && !isSearching.value ? '' : searchValue.value));
    const visibleOptions = computed(() =>
        filterOptions(options.items(), filterValue.value, options.filter()),
    );
    const optionCollection = useFlatOptionCollection<Option, Key>({
        items: () => visibleOptions.value,
        baseId: options.baseId,
        isOpen: () => isOpen.value,
        collectionRef: options.rootRef,
        getKey: options.getKey,
        isDisabled: options.isDisabled,
        isSelected: selection.isSelected,
    });
    const itemsSnapshot = computed(() =>
        visibleOptions.value.map(
            (option) => [options.getKey(option), options.isDisabled(option)] as const,
        ),
    );
    const canClear = computed(
        () =>
            options.clearable() &&
            !options.disabled() &&
            (selection.hasSelection() || (isSingle && searchValue.value !== '')),
    );

    function setInputValue(value: string) {
        searchValue.value = value;
        if (options.inputRef.value && options.inputRef.value.value !== value) {
            options.inputRef.value.value = value;
        }
    }

    function syncInputToSelection() {
        if (selection.kind !== 'single') return;
        isSearching.value = false;
        setInputValue(selection.displayValue());
    }

    function resetQuery() {
        if (searchValue.value === '') return;
        setInputValue('');
        options.onSearch('');
    }

    function focusInput() {
        void nextTick(() => options.inputRef.value?.focus());
    }

    function open() {
        if (options.disabled() || isOpen.value) return;
        isOpen.value = true;
        syncInputToSelection();
        optionCollection.activate('selected');
    }

    function close(restoreInput = true) {
        isOpen.value = false;
        optionCollection.reset();
        if (restoreInput) syncInputToSelection();
    }

    function toggle() {
        if (options.disabled()) return;
        const wasOpen = isOpen.value;
        if (wasOpen) close();
        else open();
        if (!wasOpen || selection.kind === 'multiple') focusInput();
    }

    function restoreRejectedSingleSelection(option?: Option) {
        if (selection.kind !== 'single') return;
        queueMicrotask(() => {
            const accepted = option ? selection.isSelected(option) : !selection.hasSelection();
            if (!accepted && !isOpen.value) syncInputToSelection();
        });
    }

    function selectOption(option: Option) {
        if (options.isDisabled(option)) return;
        selection.select(option);

        if (selection.kind === 'single') {
            isSearching.value = false;
            setInputValue(option.label);
            close(false);
            restoreRejectedSingleSelection(option);
        } else {
            resetQuery();
            optionCollection.activate(option);
        }
        focusInput();
    }

    function clearSelection() {
        if (!canClear.value) return;

        if (selection.kind === 'single') {
            isSearching.value = false;
            setInputValue('');
            options.onSearch('');
            selection.clear();
            close(false);
            restoreRejectedSingleSelection();
        } else {
            selection.clear();
            resetQuery();
        }
        focusInput();
    }

    function resetAfterFormReset() {
        close();
        if (selection.kind === 'multiple') resetQuery();
    }

    function onOptionMouseenter(option: Option) {
        optionCollection.activate(option);
    }

    function onRootMousedown(event: MouseEvent) {
        if (selection.kind !== 'multiple' || options.disabled()) return;
        const isInput = isNodeWithinElement(event.target, options.inputRef.value);
        if (!isInput && isInteractiveElement(event.target)) return;
        open();
        options.inputRef.value?.focus();
    }

    function onFocusout(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, options.rootRef.value)) return;
        close();
    }

    function onInput(event: Event) {
        if (options.disabled()) return;
        const value = (event.currentTarget as HTMLInputElement).value;
        searchValue.value = value;
        isSearching.value = true;
        options.onSearch(value);
        if (!isOpen.value) isOpen.value = true;
        optionCollection.activate('first');
    }

    function onInputFocus() {
        open();
    }

    function onInputClick() {
        open();
    }

    function selectHighlightedOption() {
        const option = visibleOptions.value[optionCollection.activeIndex.value];
        if (option) selectOption(option);
    }

    function onInputKeydown(event: KeyboardEvent) {
        if (options.disabled() || event.isComposing) return;

        switch (event.key) {
            case 'Enter':
                if (
                    !isOpen.value ||
                    (selection.kind === 'multiple' && optionCollection.activeIndex.value < 0)
                ) {
                    return;
                }
                event.preventDefault();
                selectHighlightedOption();
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen.value) open();
                else optionCollection.move(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen.value) {
                    open();
                    optionCollection.activate('last');
                } else {
                    optionCollection.move(-1);
                }
                break;
            case 'Backspace':
                if (selection.kind === 'multiple' && searchValue.value === '') {
                    selection.removeLast();
                }
                break;
            case 'Escape':
                if (!isOpen.value) return;
                event.preventDefault();
                close();
                break;
        }
    }

    watch(itemsSnapshot, () => {
        if (!isOpen.value || optionCollection.activeIndex.value >= 0) return;
        if (selection.kind === 'multiple' || isSearching.value) {
            optionCollection.activate('first');
        }
    });
    if (selection.kind === 'single') {
        watch(selection.displayValue, (value) => {
            if (!isSearching.value) setInputValue(value);
        });
    }
    watch(options.disabled, (disabled) => {
        if (disabled) close();
    });
    useClickOutside(options.rootRef, isOpen, () => close());

    return {
        actions: {
            clearSelection,
            focusInput,
            resetAfterFormReset,
            selectOption,
            toggle,
        },
        handlers: {
            onFocusout,
            onInput,
            onInputClick,
            onInputFocus,
            onInputKeydown,
            onOptionMouseenter,
            onRootMousedown,
        },
        ids: {
            listbox: `${popupId}-viewport`,
            popup: popupId,
        },
        state: {
            activeDescendantId: optionCollection.activeDescendantId,
            canClear,
            isOpen,
            renderedOptions: optionCollection.options,
            searchValue,
            visibleOptions,
        },
    };
}
