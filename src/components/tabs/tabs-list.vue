<template>
    <div v-bind="rootProps">
        <slot v-bind="slotProps" />
    </div>
</template>

<script lang="ts" setup vapor>
import { useTabsList } from './useTabs';
import type { TabsListProps } from './types';

defineOptions({ name: 'RpTabsList' });

const props = defineProps<TabsListProps>();

const { rootProps, slotProps } = useTabsList(props);
</script>

<style src="./tabs-list.scss" lang="scss" scoped></style>
