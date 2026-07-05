<template>
    <span
        class="rp-tooltip"
        :aria-describedby="isVisible && !disabled && $slots.content ? tooltipId : undefined"
        @mouseenter="onShow"
        @mouseleave="onHide"
        @focusin="onShow"
        @focusout="onHide"
    >
        <slot />
        <span
            v-if="isVisible && !disabled && $slots.content"
            :id="tooltipId"
            :class="tipClass"
            role="tooltip"
        >
            <slot name="content" />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { useTooltip } from './useTooltip';
import type { TooltipProps } from './types';

defineOptions({ name: 'RpTooltip' });

const props = withDefaults(defineProps<TooltipProps>(), {
    placement: 'top',
    delay: 200,
    disabled: false,
});

const { tooltipId, isVisible, tipClass, onShow, onHide } = useTooltip(props);
</script>

<style src="./tooltip.scss" lang="scss" scoped></style>
