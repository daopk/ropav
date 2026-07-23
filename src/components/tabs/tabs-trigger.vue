<template>
    <button v-bind="rootAttrs">
        <slot v-bind="slotProps" />
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { useTabsTrigger } from './useTabs';
import type { TabsTriggerPart, TabsTriggerProps } from './types';

defineOptions({ name: 'RpTabsTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<TabsTriggerProps>(), {
    disabled: false,
});

const { rootProps: internalRootProps, slotProps } = useTabsTrigger(props);
const { getRootAttrs } = useStylesApi<TabsTriggerPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        ...internalRootProps.value,
        'data-disabled': toPresenceAttribute(internalRootProps.value['data-disabled']),
    }),
);
</script>

<style src="./tabs-trigger.scss" lang="scss" scoped></style>
