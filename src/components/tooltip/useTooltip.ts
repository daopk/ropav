import { computed, useId } from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { bem } from '@/utils/bem';
import type { TooltipProps } from './types';

export function useTooltip(props: Readonly<TooltipProps>) {
    const tooltipId = useId();
    const visibility = useDelayedOpen({
        openDelay: () => props.delay,
        disabled: () => props.disabled,
    });

    function onShow() {
        visibility.open();
    }

    function onHide() {
        visibility.closeImmediate();
    }

    const tipClass = computed(() =>
        bem('rp-tooltip__tip', props.placement ?? 'top'),
    );

    return {
        tooltipId,
        isVisible: visibility.isOpen,
        tipClass,
        onShow,
        onHide,
    };
}
