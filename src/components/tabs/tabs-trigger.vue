<template>
    <button v-bind="rootProps">
        <slot v-bind="slotProps" />
    </button>
</template>

<script lang="ts" setup vapor>
import { useTabsTrigger } from './useTabs';
import type { TabsTriggerProps } from './types';

defineOptions({ name: 'RpTabsTrigger' });

const props = withDefaults(defineProps<TabsTriggerProps>(), {
    disabled: false,
});

const { rootProps, slotProps } = useTabsTrigger(props);
</script>

<style src="./tabs-trigger.scss" lang="scss" scoped></style>
