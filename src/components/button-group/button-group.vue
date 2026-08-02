<template>
    <div v-bind="rootAttrs">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import type { ButtonGroupPart, ButtonGroupProps } from './types';

defineOptions({ name: 'RpButtonGroup', inheritAttrs: false });

const props = withDefaults(defineProps<ButtonGroupProps>(), {
    orientation: 'horizontal',
    attached: false,
    wrap: false,
});

const rootClass = computed(() =>
    bem('rp-button-group', {
        vertical: props.orientation === 'vertical',
        attached: props.attached,
        wrap: props.wrap,
    }),
);
const { getRootAttrs } = useStylesApi<ButtonGroupPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: props.id,
        class: rootClass.value,
        role: 'group',
        'data-orientation': props.orientation,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': props.labelledby,
        'aria-describedby': props.describedby,
    }),
);
</script>

<style src="./button-group.scss" lang="scss" scoped></style>
