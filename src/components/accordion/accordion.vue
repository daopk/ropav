<template>
    <div v-bind="rootAttrs">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useAccordion } from './useAccordion';
import type { AccordionModelValue, AccordionPart, AccordionProps } from './types';

defineOptions({ name: 'RpAccordion', inheritAttrs: false });

const props = withDefaults(defineProps<AccordionProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    multiple: false,
    collapsible: true,
    disabled: false,
    unmountOnExit: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: AccordionModelValue];
}>();

const { rootProps: internalRootProps } = useAccordion(props, (value) => {
    emit('update:modelValue', value);
});
const { getRootAttrs } = useStylesApi<AccordionPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': presence(props.disabled),
    }),
);
</script>

<style src="./accordion.scss" lang="scss" scoped></style>
