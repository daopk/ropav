<template>
    <component :is="as" v-bind="rootAttrs"><slot /></component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, useAttrs, useId, watch } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { dialogRootKey } from './dialog-core';
import type { DialogTitleProps } from './types';

defineOptions({ name: 'RpDialogTitle', inheritAttrs: false });
const props = withDefaults(defineProps<DialogTitleProps>(), { as: 'h2' });
const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogTitle');
const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-dialog-title`);
let cleanup = root.registerTitle(id.value);
watch(id, (value) => {
    cleanup();
    cleanup = root.registerTitle(value);
});
onBeforeUnmount(() => cleanup());
const rootAttrs = computed(() => mergeProps(attrs, { id: id.value }));
</script>
