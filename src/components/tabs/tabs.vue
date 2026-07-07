<template>
    <div v-bind="rootProps">
        <slot v-bind="slotProps" />
    </div>
</template>

<script lang="ts" setup vapor>
import { useTabs } from './useTabs';
import type { TabsProps, TabsValue } from './types';

defineOptions({ name: 'RpTabs' });

const props = withDefaults(defineProps<TabsProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    size: 'md',
    variant: 'line',
    orientation: 'horizontal',
    placement: 'left',
    activationMode: 'automatic',
    disabled: false,
    unmountOnExit: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: TabsValue];
}>();

const { rootProps, slotProps } = useTabs(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./tabs.scss" lang="scss" scoped></style>
