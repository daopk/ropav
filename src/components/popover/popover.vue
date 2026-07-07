<template>
    <span ref="rootRef" :class="rootClass">
        <slot
            v-if="!isTargetMode"
            :trigger-props="slotProps.triggerProps"
            :is-open="slotProps.isOpen"
            :open="slotProps.open"
            :close="slotProps.close"
            :toggle="slotProps.toggle"
        />

        <Transition name="rp-popover-content">
            <section
                v-if="shouldRenderContent"
                v-show="isVisible"
                :id="popoverId"
                class="rp-popover__content"
                :role="popoverRole"
                :style="contentStyle"
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
            </section>
        </Transition>
    </span>
</template>

<script lang="ts" setup vapor>
import { usePopover } from './usePopover';
import type { PopoverProps } from './types';

defineOptions({ name: 'RpPopover' });

const props = withDefaults(defineProps<PopoverProps>(), {
    placement: 'bottom',
    open: undefined,
    disabled: false,
    role: 'dialog',
    closeOnOutsideClick: true,
    closeOnEscape: true,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
    rootRef,
    popoverId,
    isVisible,
    isTargetMode,
    popoverRole,
    shouldRenderContent,
    rootClass,
    contentStyle,
    slotProps,
    contentSlotProps,
} = usePopover(props, (open) => {
    emit('update:open', open);
});

void rootRef;
</script>

<style src="./popover.scss" lang="scss" scoped></style>
