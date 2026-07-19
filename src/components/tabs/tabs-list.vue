<template>
    <ScrollArea
        v-bind="rootAttrs"
        embedded
        type="auto"
        :scrollbars="scrollbarAxis"
        :viewport-attrs="{ tabindex: -1 }"
    >
        <slot v-bind="slotProps" />
    </ScrollArea>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import ScrollArea from '../scroll-area/scroll-area.vue';
import { useTabsList } from './useTabs';
import type { TabsListPart, TabsListProps } from './types';

defineOptions({ name: 'RpTabsList', inheritAttrs: false });

const props = defineProps<TabsListProps>();

const { rootProps: internalRootProps, slotProps } = useTabsList(props);
const scrollbarAxis = computed(() => (slotProps.value.orientation === 'horizontal' ? 'x' : 'y'));
const { getRootAttrs } = useStylesApi<TabsListPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': presence(internalRootProps.value['data-disabled']),
    }),
);
</script>

<style src="./tabs-list.scss" lang="scss" scoped></style>
