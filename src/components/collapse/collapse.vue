<template>
    <div v-bind="rootProps">
        <slot name="trigger" v-bind="triggerSlotProps" />

        <Transition name="rp-collapse-content">
            <section v-if="shouldRenderContent" v-show="isOpen" v-bind="contentProps">
                <div class="rp-collapse__inner">
                    <slot v-bind="contentSlotProps" />
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
