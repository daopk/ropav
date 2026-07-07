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
            <span
                v-if="shouldRenderContent"
                v-show="isVisible"
                :id="tooltipId"
                class="rp-tooltip__content"
                role="tooltip"
            >
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
    open: undefined,
    openDelay: 300,
    arrow: false,
    disabled: false,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
    tooltipId,
    isVisible,
    shouldRenderContent,
    rootClass,
    triggerProps,
    openTooltip,
    closeTooltip,
    onKeydown,
} = useTooltip(props, (open) => {
    emit('update:open', open);
});
</script>

<style src="./tooltip.scss" lang="scss" scoped></style>
