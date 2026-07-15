<template>
    <span ref="rootRef" v-bind="publicRootAttrs">
        <slot
            v-if="!isTargetMode"
            :trigger-props="styledTriggerProps"
            :is-open="slotProps.isOpen"
            :open="slotProps.open"
            :close="slotProps.close"
            :toggle="slotProps.toggle"
        />

        <Teleport :to="teleportTo" :disabled="!teleport">
            <Transition name="rp-popover-content">
                <section
                    v-if="shouldRenderContent"
                    v-show="shouldShowContent"
                    :id="popoverId"
                    ref="contentRef"
                    v-bind="contentAttrs"
                    :role="popoverRole"
                    :aria-label="ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-describedby="ariaDescribedby"
                    :data-side="placementSide"
                    :tabindex="trapFocus ? -1 : undefined"
                    @focusout="onCompositeFocusout"
                >
                    <slot
                        name="content"
                        :is-open="contentSlotProps.isOpen"
                        :open="contentSlotProps.open"
                        :close="contentSlotProps.close"
                        :toggle="contentSlotProps.toggle"
                    >
                        <slot
                            v-if="isTargetMode"
                            :is-open="contentSlotProps.isOpen"
                            :open="contentSlotProps.open"
                            :close="contentSlotProps.close"
                            :toggle="contentSlotProps.toggle"
                        />
                    </slot>
                    <span
                        v-if="arrow"
                        ref="arrowRef"
                        class="rp-popover__arrow"
                        :data-side="placementSide"
                        :style="arrowStyle"
                        aria-hidden="true"
                    />
                </section>
            </Transition>
        </Teleport>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { usePopover } from './usePopover';
import type { PopoverPart, PopoverProps, PopoverTriggerProps } from './types';

defineOptions({ name: 'RpPopover', inheritAttrs: false });

const props = withDefaults(defineProps<PopoverProps>(), {
    placement: 'bottom',
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    arrow: false,
    teleport: true,
    open: undefined,
    disabled: false,
    role: 'dialog',
    closeOnOutsideClick: true,
    closeOnEscape: true,
    keepMounted: false,
    trapFocus: false,
    initialFocus: null,
    returnFocus: true,
    focusTrapOptions: () => ({}),
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
    rootRef,
    contentRef,
    arrowRef,
    popoverId,
    isDisabled,
    isTargetMode,
    popoverRole,
    ariaLabel,
    ariaLabelledby,
    ariaDescribedby,
    shouldRenderContent,
    shouldShowContent,
    rootClass,
    contentStyle,
    slotProps,
    contentSlotProps,
    actualPlacement,
    placementSide,
    arrowStyle,
    teleportTo,
    onCompositeFocusout,
} = usePopover(props, (open) => {
    emit('update:open', open);
});

void rootRef;
void contentRef;
void arrowRef;

const { getPartAttrs, getRootAttrs } = useStylesApi<PopoverPart>(props, 'root');
const publicRootAttrs = computed(() =>
    getRootAttrs(
        {
            class: rootClass.value,
            onFocusout: onCompositeFocusout,
            'data-state': slotProps.value.isOpen ? 'open' : 'closed',
            'data-disabled': presence(isDisabled.value),
        },
        {},
        ['onFocusout'],
    ),
);
const styledTriggerProps = computed<PopoverTriggerProps>(() => {
    const partAttrs = getPartAttrs('trigger');
    return {
        ...slotProps.value.triggerProps,
        ...(props.classNames?.trigger !== undefined ? { class: partAttrs.class } : {}),
        ...(props.styles?.trigger !== undefined ? { style: partAttrs.style } : {}),
        'data-state': slotProps.value.isOpen ? 'open' : 'closed',
        'data-disabled': presence(isDisabled.value),
    };
});
const contentAttrs = computed(() => ({
    ...getPartAttrs('content', {
        class: 'rp-popover__content',
        compatibilityClass: props.contentClass,
        style: contentStyle.value,
    }),
    'data-state': slotProps.value.isOpen ? 'open' : 'closed',
    'data-placement': actualPlacement.value,
}));
</script>

<style src="./popover.scss" lang="scss" scoped></style>
