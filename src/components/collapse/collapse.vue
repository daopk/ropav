<template>
    <div v-bind="rootAttrs">
        <slot name="trigger" v-bind="publicTriggerSlotProps" />

        <Transition name="rp-collapse-content">
            <section v-if="shouldRenderContent" v-show="isOpen" v-bind="publicContentProps">
                <div class="rp-collapse__inner">
                    <slot v-bind="contentSlotProps" />
                </div>
            </section>
        </Transition>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useCollapse } from './useCollapse';
import type { CollapsePart, CollapseProps, CollapseTriggerProps } from './types';

defineOptions({ name: 'RpCollapse', inheritAttrs: false });

const props = withDefaults(defineProps<CollapseProps>(), {
    open: undefined,
    disabled: false,
    unmountOnExit: false,
    role: 'region',
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
    isOpen,
    isDisabled,
    state,
    shouldRenderContent,
    rootProps: internalRootProps,
    triggerProps,
    contentProps,
    triggerSlotProps,
    contentSlotProps,
} = useCollapse(props, (open) => {
    emit('update:open', open);
});

const { getPartAttrs, getRootAttrs } = useStylesApi<CollapsePart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': presence(isDisabled.value),
    }),
);
const publicTriggerProps = computed<CollapseTriggerProps>(() => {
    const partAttrs = getPartAttrs('trigger');
    return {
        ...triggerProps.value,
        ...(props.classNames?.trigger !== undefined ? { class: partAttrs.class } : {}),
        ...(props.styles?.trigger !== undefined ? { style: partAttrs.style } : {}),
        'data-state': state.value,
        'data-disabled': presence(isDisabled.value),
    };
});
const publicTriggerSlotProps = computed(() => ({
    ...triggerSlotProps.value,
    triggerProps: publicTriggerProps.value,
}));
const publicContentProps = computed(() => ({
    ...contentProps.value,
    ...getPartAttrs('content', {
        class: contentProps.value.class,
    }),
}));
</script>

<style src="./collapse.scss" lang="scss" scoped></style>
