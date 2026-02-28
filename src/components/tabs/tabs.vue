<template>
    <div :class="rootClass">
        <div class="rp-tabs__list" role="tablist">
            <button
                v-for="tab in tabs"
                :key="tab.name"
                role="tab"
                :class="['rp-tabs__trigger', { 'rp-tabs__trigger--active': tab.name === modelValue, 'rp-tabs__trigger--disabled': tab.disabled }]"
                :disabled="tab.disabled || undefined"
                :aria-selected="tab.name === modelValue"
                @click="select(tab.name)"
            >
                {{ tab.label }}
            </button>
        </div>
        <div class="rp-tabs__panels">
            <slot />
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, provide, reactive } from 'vue';
import { bem } from '@/utils/bem';
import { tabsKey } from './types';
import type { TabsProps, TabRegistration, TabsContext } from './types';

defineOptions({ name: 'RpTabs' });

const props = withDefaults(defineProps<TabsProps>(), {
    size: 'md',
    variant: 'line',
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const tabs = reactive<TabRegistration[]>([]);

function select(name: string) {
    emit('update:modelValue', name);
}

function register(tab: TabRegistration) {
    if (!tabs.find(t => t.name === tab.name)) {
        tabs.push(tab);
    }
}

function unregister(name: string) {
    const idx = tabs.findIndex(t => t.name === name);
    if (idx !== -1) tabs.splice(idx, 1);
}

const rootClass = computed(() =>
    bem('rp-tabs', props.variant, props.size),
);

provide<TabsContext>(tabsKey, {
    get activeTab() { return props.modelValue ?? ''; },
    get size() { return props.size; },
    get variant() { return props.variant; },
    select,
    register,
    unregister,
});
</script>

<style lang="scss" scoped>
.rp-tabs {
    font-family: var(--rp-font-family);

    // ── Sizes ──
    &--sm { --_tab-font: var(--rp-font-size-xs); --_tab-py: var(--rp-spacing-2); --_tab-px: var(--rp-spacing-3); }
    &--md { --_tab-font: var(--rp-font-size-sm); --_tab-py: var(--rp-spacing-2); --_tab-px: var(--rp-spacing-4); }
    &--lg { --_tab-font: var(--rp-font-size-base); --_tab-py: var(--rp-spacing-3); --_tab-px: var(--rp-spacing-5); }

    &__list {
        display: flex;
    }

    // ── Line variant ──
    &--line &__list {
        border-bottom: 2px solid var(--rp-color-border);
        gap: var(--rp-spacing-1);
    }

    &--line &__trigger {
        @include reset-button;
        position: relative;
        padding: var(--_tab-py) var(--_tab-px);
        font-size: var(--_tab-font);
        font-weight: var(--rp-font-weight-medium);
        color: var(--rp-color-text-secondary);
        transition: color var(--rp-transition-fast);
        margin-bottom: -2px;
        border-bottom: 2px solid transparent;

        &:hover:not(:disabled) {
            color: var(--rp-color-text);
        }

        &--active {
            color: var(--rp-color-primary);
            border-bottom-color: var(--rp-color-primary);
        }
    }

    // ── Enclosed variant ──
    &--enclosed &__list {
        border-bottom: 1px solid var(--rp-color-border);
        gap: 0;
    }

    &--enclosed &__trigger {
        @include reset-button;
        padding: var(--_tab-py) var(--_tab-px);
        font-size: var(--_tab-font);
        font-weight: var(--rp-font-weight-medium);
        color: var(--rp-color-text-secondary);
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: var(--rp-radius-md) var(--rp-radius-md) 0 0;
        margin-bottom: -1px;
        transition: color var(--rp-transition-fast),
            background-color var(--rp-transition-fast);

        &:hover:not(:disabled) {
            color: var(--rp-color-text);
        }

        &--active {
            color: var(--rp-color-text);
            background-color: var(--rp-color-surface);
            border-color: var(--rp-color-border);
        }
    }

    &__trigger {
        &--disabled {
            @include disabled-state;
        }

        &:focus-visible {
            outline: none;
            @include focus-ring;
        }
    }

    &__panels {
        padding: var(--rp-spacing-4) 0;
    }
}
</style>
