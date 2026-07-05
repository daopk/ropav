<template>
    <div
        v-if="isActive"
        :id="tabs.getPanelId(value)"
        class="rp-tab-panel"
        role="tabpanel"
        tabindex="0"
        :aria-labelledby="tabs.getTriggerId(value)"
    >
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { useTabPanel } from './useTabs';
import type { TabPanelProps } from './types';

defineOptions({ name: 'RpTabPanel' });

const props = defineProps<TabPanelProps>();

const { tabs, isActive } = useTabPanel(props);
</script>

<style src="./tab-panel.scss" lang="scss" scoped></style>
