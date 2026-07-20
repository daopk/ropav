import { computed, nextTick, ref, useId, watch, type Ref } from 'vue';
import { useClickOutside } from '@/composables/useClickOutside';
import { useCollectionNavigation } from '@/composables/useCollectionNavigation';
import { useControlState } from '@/composables/useControlState';
import { useTypeahead } from '@/composables/useTypeahead';
import { bem } from '@/utils/bem';
import type { SelectOption, SelectProps } from './types';

type SelectValue = string | number | null;

type SelectBehaviorProps = Omit<SelectProps, 'classNames' | 'styles' | 'inputAttrs'>;

function hasSelectValue(value: SelectValue) {
    return value != null && value !== '';
}

function getSelectDisplayLabel(options: SelectOption[] | undefined, value: SelectValue) {
    if (!hasSelectValue(value)) return '';
    return options?.find((option) => option.value === value)?.label ?? '';
}

function getSelectActiveDescendantId(baseId: string, focusedIndex: number, isOpen: boolean) {
    return !isOpen || focusedIndex < 0 ? undefined : `${baseId}-option-${focusedIndex}`;
}

export function useSelect(
    props: Readonly<SelectBehaviorProps>,
    emitUpdate: (value: SelectValue) => void,
    getValue: () => SelectValue = () => props.modelValue ?? null,
    triggerRef: Ref<HTMLElement | null> = ref(null),
) {
    const selectRef = ref<HTMLElement | null>(null);
    const isOpen = ref(false);

    const selectId = useId();
    const listboxId = `${selectId}-listbox`;

    const control = useControlState(props);
    const visibleOptions = computed(() => props.options ?? []);
    const value = computed(getValue);

    const navigation = useCollectionNavigation<SelectOption, string | number>({
        items: () => visibleOptions.value,
        getKey: (item) => item.value,
        isDisabled: (item) => Boolean(item.disabled),
        isSelected: (item) => item.value === value.value,
    });

    const focusedIndex = navigation.activeIndex;
    const selectedIndex = computed(() =>
        visibleOptions.value.findIndex(
            (option) => option.value === value.value && !option.disabled,
        ),
    );
    const activeDescendantId = computed(() =>
        getSelectActiveDescendantId(selectId, focusedIndex.value, isOpen.value),
    );

    const typeahead = useTypeahead<SelectOption>({
        items: () => visibleOptions.value,
        activeIndex: () => (isOpen.value ? focusedIndex.value : selectedIndex.value),
        getKey: (item) => item.value,
        getTextValue: (item) => item.label,
        isDisabled: (item) => Boolean(item.disabled),
        onMatch(item, index) {
            if (isOpen.value) {
                navigation.setActiveIndex(index);
            } else if (item.value !== value.value) {
                emitUpdate(item.value);
            }
        },
    });

    const rootClass = computed(() =>
        bem('rp-select', {
            open: isOpen.value,
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const hasValue = computed(() => hasSelectValue(value.value));
    const displayLabel = computed(() => getSelectDisplayLabel(props.options, value.value));
    const canClear = computed(() =>
        Boolean(props.clearable && hasValue.value && !control.disabled),
    );

    function focusTrigger() {
        nextTick(() => triggerRef.value?.focus());
    }

    function open() {
        if (control.disabled || isOpen.value) return;
        typeahead.reset();
        isOpen.value = true;
        navigation.focusSelected();
    }

    function close() {
        isOpen.value = false;
        navigation.resetActive();
        typeahead.reset();
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
        if (!option.disabled) navigation.setActiveIndex(index);
    }

    function onFocusout(event: FocusEvent) {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && selectRef.value?.contains(nextTarget)) return;
        close();
    }

    function selectFocusedOption() {
        if (focusedIndex.value < 0 || focusedIndex.value >= visibleOptions.value.length) return;
        selectOption(visibleOptions.value[focusedIndex.value]!);
    }

    function onTriggerKeydown(e: KeyboardEvent) {
        if (control.disabled) return;
        if (typeahead.handleKey(e)) return;

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

    watch(focusedIndex, (index) => {
        if (!isOpen.value || index < 0) return;

        void nextTick(() => {
            if (!isOpen.value || focusedIndex.value !== index) return;

            selectRef.value
                ?.querySelector<HTMLElement>(`[id="${selectId}-option-${index}"]`)
                ?.scrollIntoView?.({ block: 'nearest' });
        });
    });

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
        value,
        canClear,
        toggle,
        selectOption,
        clearSelection,
        onOptionMouseenter,
        onFocusout,
        onTriggerKeydown,
    };
}
