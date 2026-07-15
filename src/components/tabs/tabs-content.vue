<template>
    <section v-if="shouldRenderContent" v-bind="rootAttrs">
        <slot v-bind="slotProps" />
    </section>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { useTabsContent } from './useTabs';
import type { TabsContentPart, TabsContentProps } from './types';

defineOptions({ name: 'RpTabsContent', inheritAttrs: false });

const props = withDefaults(defineProps<TabsContentProps>(), {
    unmountOnExit: undefined,
});

const { rootProps: internalRootProps, slotProps, shouldRenderContent } = useTabsContent(props);
const { getRootAttrs } = useStylesApi<TabsContentPart>(props, 'root');
const rootAttrs = computed(() => getRootAttrs(internalRootProps.value));
</script>

<style src="./tabs-content.scss" lang="scss" scoped></style>
