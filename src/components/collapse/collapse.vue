<template>
    <div :class="rootClass">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, provide } from 'vue';
import { bem } from '@/utils/bem';
import { collapseKey } from './types';
import type { CollapseProps, CollapseContext } from './types';

defineOptions({ name: 'RpCollapse' });

const props = withDefaults(defineProps<CollapseProps>(), {
    modelValue: () => [],
    accordion: false,
    size: 'md',
});

const emit = defineEmits<{
    'update:modelValue': [value: string[]];
}>();

const rootClass = computed(() =>
    bem('rp-collapse', props.size),
);

provide<CollapseContext>(collapseKey, {
    get activeNames() { return props.modelValue ?? []; },
    get size() { return props.size; },
    toggle(name: string) {
        const current = props.modelValue ?? [];
        if (props.accordion) {
            emit('update:modelValue', current.includes(name) ? [] : [name]);
        } else {
            emit('update:modelValue',
                current.includes(name)
                    ? current.filter((n) => n !== name)
                    : [...current, name],
            );
        }
    },
});
</script>

<style lang="scss" scoped>
.rp-collapse {
    font-family: var(--rp-font-family);
    border: 1px solid var(--rp-color-border);
    border-radius: var(--rp-radius-lg);
    overflow: hidden;

    &--sm { --_collapse-py: var(--rp-spacing-3); --_collapse-px: var(--rp-spacing-3); --_collapse-font: var(--rp-font-size-sm); }
    &--md { --_collapse-py: var(--rp-spacing-4); --_collapse-px: var(--rp-spacing-4); --_collapse-font: var(--rp-font-size-base); }
    &--lg { --_collapse-py: var(--rp-spacing-5); --_collapse-px: var(--rp-spacing-5); --_collapse-font: var(--rp-font-size-lg); }
}
</style>
