<template>
    <button
        :id="tabs.getTriggerId(value)"
        type="button"
        role="tab"
        :class="rootClass"
        :disabled="disabled || undefined"
        :aria-selected="isActive"
        :aria-controls="tabs.getPanelId(value)"
        :tabindex="isActive ? 0 : -1"
        :data-value="value"
        :data-state="isActive ? 'active' : 'inactive'"
        :data-disabled="disabled || undefined"
        @click="select"
    >
        <slot />
    </button>
</template>

<script lang="ts" setup vapor>
import { useTabsTrigger } from './useTabs';
import type { TabsTriggerProps } from './types';

defineOptions({ name: 'RpTabsTrigger' });

const props = withDefaults(defineProps<TabsTriggerProps>(), {
    disabled: false,
});

const { tabs, isActive, rootClass, select } = useTabsTrigger(props);
</script>

<style src="./tabs-trigger.scss" lang="scss" scoped></style>
