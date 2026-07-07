import { computed, useId, useSlots, watch } from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { bem } from '@/utils/bem';
import type { TooltipProps, TooltipTriggerProps } from './types';

export function useTooltip(
    props: Readonly<TooltipProps>,
    emitOpenChange?: (open: boolean) => void,
) {
    const slots = useSlots();
    const generatedId = useId();

    const tooltipId = computed(() => props.id ?? `${generatedId}-tooltip`);
    const placement = computed(() => props.placement ?? 'top');
    const hasContent = computed(() => Boolean(props.content || slots.content));
    const isDisabled = computed(() => Boolean(props.disabled || !hasContent.value));
    const shouldRenderContent = computed(() => !isDisabled.value);

    const { isOpen, open, closeImmediate } = useDelayedOpen({
        open: () => props.open,
        openDelay: () => props.openDelay ?? 300,
        disabled: () => isDisabled.value,
        onOpenChange: emitOpenChange,
    });

    const isVisible = computed(() => isOpen.value && !isDisabled.value);

    const rootClass = computed(() =>
        bem('rp-tooltip', {
            [`placement-${placement.value}`]: true,
            [`color-${props.color}`]: Boolean(props.color),
            arrow: props.arrow,
            open: isVisible.value,
            disabled: props.disabled,
        }),
    );

    const triggerProps = computed<TooltipTriggerProps>(() => ({
        'aria-describedby': shouldRenderContent.value ? tooltipId.value : undefined,
    }));

    function openTooltip() {
        open();
    }

    function closeTooltip() {
        closeImmediate();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeTooltip();
    }

    watch(isDisabled, (disabled) => {
        if (disabled) closeTooltip();
    });

    return {
        tooltipId,
        isOpen,
        isVisible,
        shouldRenderContent,
        rootClass,
        triggerProps,
        openTooltip,
        closeTooltip,
        onKeydown,
    };
}
