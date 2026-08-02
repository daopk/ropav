<template>
    <div ref="root" v-bind="rootAttrs">
        <slot />
    </div>
</template>

<script setup lang="ts" vapor>
import { computed, shallowRef } from 'vue';
import { useStylesApi } from '@/styles-api';
import { bem } from '@/utils/bem';
import { useToolbar } from './useToolbar';
import type { ToolbarPart, ToolbarProps } from './types';

defineOptions({ name: 'RpToolbar', inheritAttrs: false });

const props = withDefaults(defineProps<ToolbarProps>(), {
    orientation: 'horizontal',
});

const root = shallowRef<HTMLElement | null>(null);
const { focus, onFocusin, onKeydown } = useToolbar(root, () => props.orientation);
const rootClass = computed(() =>
    bem('rp-toolbar', {
        vertical: props.orientation === 'vertical',
    }),
);
const { getRootAttrs } = useStylesApi<ToolbarPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: props.id,
        class: rootClass.value,
        role: 'toolbar',
        'data-orientation': props.orientation,
        'aria-orientation': props.orientation,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': props.labelledby,
        'aria-describedby': props.describedby,
        onFocusin,
        onKeydown,
    }),
);

defineExpose({ nativeElement: root, focus });
</script>

<style src="./toolbar.scss" lang="scss" scoped></style>
