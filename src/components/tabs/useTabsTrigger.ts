import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { toAttr, triggerClasses, useTabsItem, useTabsRegistration } from './useTabsShared';
import type {
    TabsTriggerProps,
    TabsTriggerRootProps,
    TabsTriggerSlotProps,
    TabsTriggerAlign,
    UseTabsTriggerReturn,
} from './types';

export function useTabsTrigger(props: Readonly<TabsTriggerProps>): UseTabsTriggerReturn {
    const { group, id, isSelected, state } = useTabsItem('RpTabsTrigger', props, 'tab');
    const isDisabled = computed(() => Boolean(group.disabled || props.disabled));
    const isFocusable = computed(
        () => group.getFocusableValue() === props.value && !isDisabled.value,
    );
    const align = computed<TabsTriggerAlign | undefined>(() => props.align ?? group.align);
    const effectiveAlign = computed<TabsTriggerAlign>(
        () => align.value ?? (group.orientation === 'vertical' ? 'left' : 'center'),
    );

    const rootClass = computed(() =>
        bem(
            'rp-tabs-trigger',
            `size-${group.size}`,
            triggerClasses(
                isSelected.value,
                isDisabled.value,
                group.orientation,
                group.placement,
                align.value,
            ),
        ),
    );

    const rootProps = computed<TabsTriggerRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tab',
        type: 'button',
        disabled: toAttr(isDisabled.value),
        tabIndex: isFocusable.value ? 0 : -1,
        'data-state': state.value,
        'data-disabled': toAttr(isDisabled.value),
        'data-align': toAttr(align.value),
        'aria-selected': isSelected.value,
        'aria-controls': group.getContentId(props.value),
        'aria-disabled': toAttr(isDisabled.value),
        onClick: select,
        onFocus,
        onKeydown,
    }));

    const slotProps = computed<TabsTriggerSlotProps>(() => ({
        value: props.value,
        selected: isSelected.value,
        size: group.size,
        disabled: isDisabled.value,
        align: effectiveAlign.value,
        select,
    }));

    useTabsRegistration(
        () => ({
            id: id.value,
            value: props.value,
            disabled: isDisabled.value,
        }),
        group.registerTrigger,
        group.unregisterTrigger,
        () => [id.value, props.value, isDisabled.value] as const,
    );

    function select() {
        if (!isDisabled.value) group.selectValue(props.value);
    }

    function onFocus() {
        if (group.activationMode === 'automatic') select();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        select();
    }

    return { id, state, isSelected, isDisabled, rootClass, rootProps, slotProps, select };
}
