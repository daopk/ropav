import { computed, ref, useId } from 'vue';
import { bem } from '@/utils/bem';
import type {
    CollapseContentRole,
    CollapseProps,
    CollapseSlotProps,
    CollapseTriggerProps,
    CollapseTriggerSlotProps,
} from './types';

const DEFAULT_ROLE: CollapseContentRole = 'region';

export function useCollapse(
    props: Readonly<CollapseProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const generatedId = useId();
    const uncontrolledOpen = ref(Boolean(props.defaultOpen));

    const collapseId = computed(() => props.id ?? `${generatedId}-collapse`);
    const isDisabled = computed(() => Boolean(props.disabled));
    const isOpen = computed(() => Boolean(props.open ?? uncontrolledOpen.value));
    const contentRole = computed(() => props.role ?? DEFAULT_ROLE);
    const shouldRenderContent = computed(() => !props.unmountOnExit || isOpen.value);

    const rootClass = computed(() =>
        bem('rp-collapse', {
            open: isOpen.value,
            closed: !isOpen.value,
            disabled: isDisabled.value,
        }),
    );

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

    const triggerSlotProps = computed<CollapseTriggerSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    function setOpen(nextOpen: boolean) {
        if (isDisabled.value) return;

        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emitOpenChange?.(nextOpen);
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
        contentRole,
        isDisabled,
        isOpen,
        shouldRenderContent,
        rootClass,
        triggerProps,
        triggerSlotProps,
        contentSlotProps,
        openCollapse,
        closeCollapse,
        toggleCollapse,
    };
}
