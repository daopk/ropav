<template>
    <component :is="as" v-bind="rootAttrs"><slot /></component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, useAttrs, useId, watch } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { dialogRootKey } from './dialogContext';
import type { DialogDescriptionProps } from './types';

defineOptions({ name: 'RpDialogDescription', inheritAttrs: false });
const props = withDefaults(defineProps<DialogDescriptionProps>(), { as: 'p' });
const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogDescription');
const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-dialog-description`);
let cleanup = root.registerDescription(id.value);
watch(id, (value) => {
    cleanup();
    cleanup = root.registerDescription(value);
});
onBeforeUnmount(() => cleanup());
const rootAttrs = computed(() => mergeProps(attrs, { id: id.value }));
</script>
