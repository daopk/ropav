<template>
    <div v-if="isActive" class="rp-tab-panel" role="tabpanel">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, inject, onMounted, onBeforeUnmount } from 'vue';
import { tabsKey } from './types';
import type { TabPanelProps } from './types';

defineOptions({ name: 'RpTabPanel' });

const props = withDefaults(defineProps<TabPanelProps>(), {
    label: '',
    disabled: false,
});

const tabs = inject(tabsKey)!;

const isActive = computed(() => tabs.activeTab === props.name);

onMounted(() => {
    tabs.register({
        name: props.name,
        label: props.label || props.name,
        disabled: props.disabled,
    });
});

onBeforeUnmount(() => {
    tabs.unregister(props.name);
});
</script>

<style lang="scss" scoped>
.rp-tab-panel {
    font-family: var(--rp-font-family);
    font-size: var(--rp-font-size-base);
    color: var(--rp-color-text);
    line-height: 1.6;
}
</style>
