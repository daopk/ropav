<template>
    <section v-if="shouldRenderContent" v-bind="rootProps">
        <slot v-bind="slotProps" />
    </section>
</template>

<script lang="ts" setup vapor>
import { useTabsContent } from './useTabs';
import type { TabsContentProps } from './types';

defineOptions({ name: 'RpTabsContent' });

const props = withDefaults(defineProps<TabsContentProps>(), {
    unmountOnExit: undefined,
});

const { rootProps, slotProps, shouldRenderContent } = useTabsContent(props);
</script>

<style src="./tabs-content.scss" lang="scss" scoped></style>
