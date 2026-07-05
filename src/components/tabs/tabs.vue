<template>
    <div :class="rootClass">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useId } from 'vue';
import { useTabs } from './useTabs';
import type { TabsProps } from './types';

defineOptions({ name: 'RpTabs' });

const props = defineProps<TabsProps>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const tabsId = useId();
const { rootClass } = useTabs(props, tabsId, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./tabs.scss" lang="scss" scoped></style>
