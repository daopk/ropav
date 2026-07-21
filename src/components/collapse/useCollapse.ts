import { computed, toValue, useId } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import type {
    CollapseContentProps,
    CollapseContentRole,
    CollapseOption,
    CollapseRootProps,
    CollapseSlotProps,
    CollapseState,
    CollapseTriggerProps,
    CollapseTriggerSlotProps,
    UseCollapseOptions,
    UseCollapseReturn,
} from './types';

const DEFAULT_ROLE: CollapseContentRole = 'region';

function optionValue<T>(value: CollapseOption<T | undefined> | undefined) {
    return toValue(value);
}

export function useCollapse(
    options: Readonly<UseCollapseOptions> = {},
    emitOpenChange?: (open: boolean) => void,
): UseCollapseReturn {
    const generatedId = useId();

    const id = computed(() => optionValue<string>(options.id) ?? `${generatedId}-collapse`);
    const isDisabled = computed(() => Boolean(optionValue<boolean>(options.disabled)));
    const controllableOpen = useControllableValue({
        modelValue: () => optionValue<boolean>(options.open),
        defaultValue: () => false,
        onChange: (nextOpen) => {
            options.onOpenChange?.(nextOpen);
            emitOpenChange?.(nextOpen);
        },
    });
    const isOpen = controllableOpen.value;
    const state = computed<CollapseState>(() => (isOpen.value ? 'open' : 'closed'));
    const shouldRenderContent = computed(
        () => !optionValue<boolean>(options.unmountOnExit) || isOpen.value,
    );

    const rootClass = computed(() =>
        bem('rp-collapse', {
            open: isOpen.value,
            closed: !isOpen.value,
            disabled: isDisabled.value,
        }),
    );

    const rootProps = computed<CollapseRootProps>(() => ({
        class: rootClass.value,
        'data-state': state.value,
        'data-disabled': isDisabled.value || undefined,
    }));

    const contentSlotProps = computed<CollapseSlotProps>(() => ({
        isOpen: isOpen.value,
        open,
        close,
        toggle,
    }));

    const triggerProps = computed<CollapseTriggerProps>(() => ({
        type: 'button',
        disabled: isDisabled.value || undefined,
        'aria-controls': id.value,
        'aria-expanded': isOpen.value,
        'aria-disabled': isDisabled.value || undefined,
        onClick: onTriggerClick,
    }));

    const contentProps = computed<CollapseContentProps>(() => ({
        class: 'rp-collapse__content',
        id: id.value,
        role: optionValue<CollapseContentRole>(options.role) ?? DEFAULT_ROLE,
        'data-state': state.value,
        'aria-hidden': isOpen.value ? undefined : 'true',
        'aria-label': optionValue<string>(options.ariaLabel) || undefined,
        'aria-labelledby': optionValue<string>(options.ariaLabelledby) || undefined,
        'aria-describedby': optionValue<string>(options.ariaDescribedby) || undefined,
    }));

    const triggerSlotProps = computed<CollapseTriggerSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    function setOpen(nextOpen: boolean) {
        if (isDisabled.value || nextOpen === isOpen.value) return;

        controllableOpen.setValue(nextOpen);
    }

    function open() {
        setOpen(true);
    }

    function close() {
        setOpen(false);
    }

    function toggle() {
        setOpen(!isOpen.value);
    }

    function onTriggerClick() {
        toggle();
    }

    return {
        id,
        state,
        isDisabled,
        isOpen,
        shouldRenderContent,
        rootClass,
        rootProps,
        triggerProps,
        contentProps,
        triggerSlotProps,
        contentSlotProps,
        setOpen,
        open,
        close,
        toggle,
    };
}
