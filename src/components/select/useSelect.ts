import { computed, nextTick, ref, useId } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import { useControlState } from '@/composables/useControlState';
import { useListNavigation } from '@/composables/useListNavigation';
import { bem } from '@/utils/bem';
import type { SelectOption, SelectProps } from './types';

type SelectValue = string | number | null;

function hasSelectValue(value: SelectValue) {
    return value != null && value !== '';
}

function getSelectDisplayLabel(options: SelectOption[] | undefined, value: SelectValue) {
    if (!hasSelectValue(value)) return '';
    return options?.find((option) => option.value === value)?.label ?? '';
}

function getSelectActiveDescendantId(baseId: string, focusedIndex: number) {
    return focusedIndex < 0 ? undefined : `${baseId}-option-${focusedIndex}`;
}

export function useSelect(props: Readonly<SelectProps>, emitUpdate: (value: SelectValue) => void) {
    const selectRef = ref<HTMLElement | null>(null);
    const triggerRef = ref<HTMLElement | null>(null);
    const isOpen = ref(false);

    const selectId = useId();
    const listboxId = `${selectId}-listbox`;

    const control = useControlState(props);
    const visibleOptions = computed(() => props.options ?? []);

    const navigation = useListNavigation<SelectOption>({
        items: () => visibleOptions.value,
        isSelected: (item) => item.value === props.modelValue,
    });

    const focusedIndex = navigation.focusedIndex;
    const activeDescendantId = computed(() =>
        getSelectActiveDescendantId(selectId, focusedIndex.value),
    );

    const rootClass = computed(() =>
        bem('rp-select', {
            open: isOpen.value,
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const hasValue = computed(() => hasSelectValue(props.modelValue));
    const displayLabel = computed(() => getSelectDisplayLabel(props.options, props.modelValue));
    const canClear = computed(() =>
        Boolean(props.clearable && hasValue.value && !control.disabled),
    );

    function focusTrigger() {
        nextTick(() => triggerRef.value?.focus());
    }

    function open() {
        if (control.disabled || isOpen.value) return;
        isOpen.value = true;
        navigation.focusSelected();
    }

    function close() {
        isOpen.value = false;
        navigation.resetFocus();
    }

    function toggle() {
        if (control.disabled) return;
        if (isOpen.value) {
            close();
            focusTrigger();
        } else {
            open();
        }
    }

    function selectOption(option: SelectOption) {
        if (option.disabled) return;
        emitUpdate(option.value);
        close();
        focusTrigger();
    }

    function clearSelection() {
        if (!canClear.value) return;
        emitUpdate(null);
        close();
        focusTrigger();
    }

    function onOptionMouseenter(option: SelectOption, index: number) {
        if (!option.disabled) focusedIndex.value = index;
    }

    function selectFocusedOption() {
        if (focusedIndex.value < 0 || focusedIndex.value >= visibleOptions.value.length) return;
        selectOption(visibleOptions.value[focusedIndex.value]!);
    }

    function onTriggerKeydown(e: KeyboardEvent) {
        if (control.disabled) return;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (!isOpen.value) open();
                else selectFocusedOption();
                break;
            case ' ':
                e.preventDefault();
                if (!isOpen.value) open();
                else selectFocusedOption();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen.value) open();
                else navigation.moveFocus(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!isOpen.value) {
                    open();
                    navigation.focusLast();
                } else {
                    navigation.moveFocus(-1);
                }
                break;
            case 'Home':
                if (isOpen.value) {
                    e.preventDefault();
                    navigation.focusFirst();
                }
                break;
            case 'End':
                if (isOpen.value) {
                    e.preventDefault();
                    navigation.focusLast();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (canClear.value) {
                    e.preventDefault();
                    clearSelection();
                }
                break;
            case 'Escape':
                e.preventDefault();
                close();
                focusTrigger();
                break;
        }
    }

    useClickOutside(selectRef, isOpen, close);

    return {
        selectRef,
        triggerRef,
        isOpen,
        selectId,
        listboxId,
        control,
        visibleOptions,
        focusedIndex,
        activeDescendantId,
        rootClass,
        hasValue,
        displayLabel,
        canClear,
        toggle,
        selectOption,
        clearSelection,
        onOptionMouseenter,
        onTriggerKeydown,
    };
}
