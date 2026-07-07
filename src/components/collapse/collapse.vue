<template>
    <div
        :class="rootProps.class"
        :data-state="rootProps['data-state']"
        :data-disabled="rootProps['data-disabled']"
    >
        <slot
            name="trigger"
            :trigger-props="triggerSlotProps.triggerProps"
            :is-open="triggerSlotProps.isOpen"
            :open="triggerSlotProps.open"
            :close="triggerSlotProps.close"
            :toggle="triggerSlotProps.toggle"
        />

        <Transition name="rp-collapse-content">
            <section
                v-if="shouldRenderContent"
                v-show="isOpen"
                :id="contentProps.id"
                class="rp-collapse__content"
                :role="contentProps.role"
                :data-state="contentProps['data-state']"
                :aria-hidden="contentProps['aria-hidden']"
                :aria-label="contentProps['aria-label']"
                :aria-labelledby="contentProps['aria-labelledby']"
                :aria-describedby="contentProps['aria-describedby']"
            >
                <div class="rp-collapse__inner">
                    <slot
                        :is-open="contentSlotProps.isOpen"
                        :open="contentSlotProps.open"
                        :close="contentSlotProps.close"
                        :toggle="contentSlotProps.toggle"
                    />
                </div>
            </section>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { useCollapse } from './useCollapse';
import type { CollapseProps } from './types';

defineOptions({ name: 'RpCollapse' });

const props = withDefaults(defineProps<CollapseProps>(), {
    open: undefined,
    defaultOpen: false,
    disabled: false,
    unmountOnExit: false,
    role: 'region',
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const { isOpen, shouldRenderContent, rootProps, contentProps, triggerSlotProps, contentSlotProps } =
    useCollapse(props, (open) => {
        emit('update:open', open);
    });
</script>

<style src="./collapse.scss" lang="scss" scoped></style>
