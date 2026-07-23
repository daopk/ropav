<template>
    <div v-bind="rootAttrs">
        <slot v-bind="slotProps" />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { useTabs } from './useTabs';
import type { TabsPart, TabsProps, TabsValue } from './types';

defineOptions({ name: 'RpTabs', inheritAttrs: false });

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

const { rootProps: internalRootProps, slotProps } = useTabs(props, (value) => {
    emit('update:modelValue', value);
});
const { getRootAttrs } = useStylesApi<TabsPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': toPresenceAttribute(props.disabled),
    }),
);
</script>

<style src="./tabs.scss" lang="scss" scoped></style>
