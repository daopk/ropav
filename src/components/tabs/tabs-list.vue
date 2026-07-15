<template>
    <div v-bind="rootAttrs">
        <slot v-bind="slotProps" />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useTabsList } from './useTabs';
import type { TabsListPart, TabsListProps } from './types';

defineOptions({ name: 'RpTabsList', inheritAttrs: false });

const props = defineProps<TabsListProps>();

const { rootProps: internalRootProps, slotProps } = useTabsList(props);
const { getRootAttrs } = useStylesApi<TabsListPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': presence(internalRootProps.value['data-disabled']),
    }),
);
</script>

<style src="./tabs-list.scss" lang="scss" scoped></style>
