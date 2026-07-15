<template>
    <span ref="rootRef" v-bind="rootAttrs" :class="rootClass" @focusout="onCompositeFocusout">
        <slot
            v-if="!isTargetMode"
            :trigger-props="slotProps.triggerProps"
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
                    :class="['rp-popover__content', contentClass]"
                    :role="popoverRole"
                    :aria-label="ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-describedby="ariaDescribedby"
                    :data-placement="actualPlacement"
                    :data-side="placementSide"
                    :style="contentStyle"
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
import { usePopover } from './usePopover';
import type { PopoverProps } from './types';

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
    isTargetMode,
    popoverRole,
    ariaLabel,
    ariaLabelledby,
    ariaDescribedby,
    shouldRenderContent,
    shouldShowContent,
    rootClass,
    rootAttrs,
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
</script>

<style src="./popover.scss" lang="scss" scoped></style>
