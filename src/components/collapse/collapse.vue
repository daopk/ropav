<template>
    <div
        :class="rootClass"
        :data-state="isOpen ? 'open' : 'closed'"
        :data-disabled="isDisabled || undefined"
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
                :id="collapseId"
                class="rp-collapse__content"
                :role="contentRole"
                :data-state="isOpen ? 'open' : 'closed'"
                :aria-hidden="isOpen ? undefined : 'true'"
                :aria-label="ariaLabel || undefined"
                :aria-labelledby="labelledby"
                :aria-describedby="describedby"
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

const {
    collapseId,
    contentRole,
    isDisabled,
    isOpen,
    shouldRenderContent,
    rootClass,
    triggerSlotProps,
    contentSlotProps,
} = useCollapse(props, (open) => {
    emit('update:open', open);
});
</script>

<style src="./collapse.scss" lang="scss" scoped></style>
