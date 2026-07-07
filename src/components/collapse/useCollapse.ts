import { computed, ref, unref, useId } from 'vue';
import { bem } from '@/utils/bem';
import type {
    CollapseContentProps,
    CollapseContentRole,
    CollapseOptionValue,
    CollapseRootProps,
    CollapseSlotProps,
    CollapseState,
    CollapseTriggerProps,
    CollapseTriggerSlotProps,
    UseCollapseOptions,
    UseCollapseReturn,
} from './types';

const DEFAULT_ROLE: CollapseContentRole = 'region';

function readOption<T>(value: CollapseOptionValue<T> | undefined): T | undefined {
    if (typeof value === 'function') return (value as () => T)();
    return unref(value);
}

function ariaText(value: CollapseOptionValue<string | undefined> | undefined) {
    return readOption(value) || undefined;
}

export function useCollapse(
    options: Readonly<UseCollapseOptions> = {},
    emitOpenChange?: (open: boolean) => void,
): UseCollapseReturn {
    const generatedId = useId();
    const uncontrolledOpen = ref(Boolean(readOption(options.defaultOpen)));

    const collapseId = computed(() => readOption(options.id) ?? `${generatedId}-collapse`);
    const controlledOpen = computed(() => readOption(options.open));
    const isDisabled = computed(() => Boolean(readOption(options.disabled)));
    const isOpen = computed(() => Boolean(controlledOpen.value ?? uncontrolledOpen.value));
    const collapseState = computed<CollapseState>(() => (isOpen.value ? 'open' : 'closed'));
    const contentRole = computed(() => readOption(options.role) ?? DEFAULT_ROLE);
    const shouldRenderContent = computed(() => !readOption(options.unmountOnExit) || isOpen.value);

    const rootClass = computed(() =>
        bem('rp-collapse', {
            open: isOpen.value,
            closed: !isOpen.value,
            disabled: isDisabled.value,
        }),
    );

    const rootProps = computed<CollapseRootProps>(() => ({
        class: rootClass.value,
        'data-state': collapseState.value,
        'data-disabled': isDisabled.value || undefined,
    }));

    const contentSlotProps = computed<CollapseSlotProps>(() => ({
        isOpen: isOpen.value,
        open: openCollapse,
        close: closeCollapse,
        toggle: toggleCollapse,
    }));

    const triggerProps = computed<CollapseTriggerProps>(() => ({
        type: 'button',
        disabled: isDisabled.value || undefined,
        'aria-controls': collapseId.value,
        'aria-expanded': isOpen.value,
        'aria-disabled': isDisabled.value || undefined,
        onClick: onTriggerClick,
    }));

    const contentProps = computed<CollapseContentProps>(() => ({
        id: collapseId.value,
        role: contentRole.value,
        'data-state': collapseState.value,
        'aria-hidden': isOpen.value ? undefined : 'true',
        'aria-label': ariaText(options.ariaLabel),
        'aria-labelledby': ariaText(options.labelledby),
        'aria-describedby': ariaText(options.describedby),
    }));

    const triggerSlotProps = computed<CollapseTriggerSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    function setOpen(nextOpen: boolean) {
        if (isDisabled.value) return;

        const previousOpen = isOpen.value;
        if (controlledOpen.value === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) {
            options.onOpenChange?.(nextOpen);
            emitOpenChange?.(nextOpen);
        }
    }

    function openCollapse() {
        setOpen(true);
    }

    function closeCollapse() {
        setOpen(false);
    }

    function toggleCollapse() {
        setOpen(!isOpen.value);
    }

    function onTriggerClick() {
        toggleCollapse();
    }

    return {
        collapseId,
        collapseState,
        contentRole,
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
        open: openCollapse,
        close: closeCollapse,
        toggle: toggleCollapse,
        openCollapse,
        closeCollapse,
        toggleCollapse,
    };
}
