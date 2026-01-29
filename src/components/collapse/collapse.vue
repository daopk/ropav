<template>
    <div class="rp-collapse">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { provide } from 'vue';
import { collapseKey } from './types';
import type { CollapseProps, CollapseContext } from './types';

defineOptions({ name: 'RpCollapse' });

const props = withDefaults(defineProps<CollapseProps>(), {
    modelValue: () => [],
    accordion: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string[]];
}>();

provide<CollapseContext>(collapseKey, {
    get activeNames() { return props.modelValue ?? []; },
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
}
</style>
