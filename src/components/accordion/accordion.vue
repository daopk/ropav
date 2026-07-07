<template>
    <div v-bind="rootProps">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useAccordion } from './useAccordion';
import type { AccordionModelValue, AccordionProps } from './types';

defineOptions({ name: 'RpAccordion' });

const props = withDefaults(defineProps<AccordionProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    multiple: false,
    collapsible: true,
    disabled: false,
    unmountOnExit: false,
    orientation: 'vertical',
});

const emit = defineEmits<{
    'update:modelValue': [value: AccordionModelValue];
}>();

const { rootProps } = useAccordion(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./accordion.scss" lang="scss" scoped></style>
