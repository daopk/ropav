<template>
    <span
        ref="rootRef"
        :class="rootClass"
        @mouseenter="openTooltip"
        @mouseleave="closeTooltip"
        @focusin="openTooltip"
        @focusout="closeTooltip"
        @keydown="onKeydown"
    >
        <slot v-if="!isTargetMode" :trigger-props="triggerProps" />

        <Teleport :to="teleportTo" :disabled="!teleport">
            <Transition name="rp-tooltip-content">
                <span
                    v-if="shouldRenderContent"
                    v-show="isVisible"
                    :id="tooltipId"
                    ref="contentRef"
                    class="rp-tooltip__content"
                    :role="contentRole"
                    :aria-hidden="contentAriaHidden"
                    :data-placement="actualPlacement"
                    :data-side="placementSide"
                    :style="contentStyle"
                >
                    <span
                        v-if="arrow"
                        ref="arrowRef"
                        class="rp-tooltip__arrow"
                        :data-side="placementSide"
                        :style="arrowStyle"
                        aria-hidden="true"
                    />
                    <slot name="content">{{ content }}</slot>
                </span>
            </Transition>
        </Teleport>
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
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    teleport: true,
    disabled: false,
    decorative: false,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
    rootRef,
    contentRef,
    arrowRef,
    tooltipId,
    isVisible,
    isTargetMode,
    shouldRenderContent,
    rootClass,
    triggerProps,
    contentRole,
    contentAriaHidden,
    contentStyle,
    actualPlacement,
    placementSide,
    arrowStyle,
    teleportTo,
    openTooltip,
    closeTooltip,
    onKeydown,
} = useTooltip(props, (open) => {
    emit('update:open', open);
});

void rootRef;
void contentRef;
void arrowRef;
</script>

<style src="./tooltip.scss" lang="scss" scoped></style>
