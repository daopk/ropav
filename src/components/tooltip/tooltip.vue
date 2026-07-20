<template>
    <span ref="rootRef" v-bind="rootAttrs">
        <slot v-if="!isTargetMode" :trigger-props="publicTriggerProps" />

        <Teleport :to="teleportTo" :disabled="!teleport">
            <Transition name="rp-tooltip-content">
                <span
                    v-if="shouldRenderContent"
                    v-show="isVisible"
                    :id="tooltipId"
                    ref="contentRef"
                    v-bind="contentAttrs"
                    :role="contentRole"
                    :aria-hidden="contentAriaHidden"
                    :data-side="placementSide"
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
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useTooltip } from './useTooltip';
import type { TooltipPart, TooltipProps, TooltipTriggerProps } from './types';

defineOptions({ name: 'RpTooltip', inheritAttrs: false });

const props = withDefaults(defineProps<TooltipProps>(), {
    content: '',
    autoContrast: true,
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
    isDisabled,
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

const { getPartAttrs, getRootAttrs } = useStylesApi<TooltipPart>(props, 'root');
const state = computed(() => (isVisible.value ? 'open' : 'closed'));
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-state': state.value,
        'data-disabled': presence(isDisabled.value),
        onMouseenter: openTooltip,
        onMouseleave: closeTooltip,
        onFocusin: openTooltip,
        onFocusout: closeTooltip,
        onKeydown,
    }),
);
const publicTriggerProps = computed<TooltipTriggerProps>(() => {
    const partAttrs = getPartAttrs('trigger');
    return {
        ...triggerProps.value,
        ...(props.classNames?.trigger !== undefined ? { class: partAttrs.class } : {}),
        ...(props.styles?.trigger !== undefined ? { style: partAttrs.style } : {}),
        'data-state': state.value,
        'data-disabled': presence(isDisabled.value),
    };
});
const contentAttrs = computed(() => ({
    ...getPartAttrs('content', {
        class: 'rp-tooltip__content',
        style: contentStyle.value,
    }),
    'data-state': state.value,
    'data-placement': actualPlacement.value,
}));
</script>

<style src="./tooltip.scss" lang="scss" scoped></style>
