<template>
    <div
        :id="id"
        :class="rootClass"
        role="group"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
    >
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { ButtonGroupProps } from './types';

defineOptions({ name: 'RpButtonGroup' });

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
</script>

<style src="./button-group.scss" lang="scss" scoped></style>
