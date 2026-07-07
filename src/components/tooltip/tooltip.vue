<template>
    <span
        :class="rootClass"
        @mouseenter="openTooltip"
        @mouseleave="closeTooltip"
        @focusin="openTooltip"
        @focusout="closeTooltip"
        @keydown="onKeydown"
    >
        <slot :trigger-props="triggerProps" />

        <Transition name="rp-tooltip-content">
            <span v-if="isVisible" :id="tooltipId" class="rp-tooltip__content" role="tooltip">
                <slot name="content">{{ content }}</slot>
            </span>
        </Transition>
    </span>
</template>

<script lang="ts" setup vapor>
import { useTooltip } from './useTooltip';
import type { TooltipProps } from './types';

defineOptions({ name: 'RpTooltip' });

const props = withDefaults(defineProps<TooltipProps>(), {
    content: '',
    placement: 'top',
    openDelay: 300,
    arrow: false,
    disabled: false,
});

const { tooltipId, isVisible, rootClass, triggerProps, openTooltip, closeTooltip, onKeydown } =
    useTooltip(props);
</script>

<style src="./tooltip.scss" lang="scss" scoped></style>
