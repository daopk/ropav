<template>
    <button :class="rootClass" :disabled="disabled || loading || undefined" :type="type">
        <span v-if="loading" class="rp-button__spinner" aria-hidden="true" />
        <span v-if="$slots.prefix && !loading" class="rp-button__prefix">
            <slot name="prefix" />
        </span>
        <span class="rp-button__label">
            <slot />
        </span>
        <span v-if="$slots.suffix" class="rp-button__suffix">
            <slot name="suffix" />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { ButtonProps } from './types';

defineOptions({ name: 'RpButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
    type: 'button',
    disabled: false,
    loading: false,
});

const rootClass = computed(() =>
    bem('rp-button', {
        solid: props.variant === 'solid',
        ghost: props.variant === 'ghost',
        [`color-${props.color}`]: Boolean(props.color),
        [`size-${props.size}`]: Boolean(props.size),
    }),
);
</script>

<style src="./button.scss" lang="scss" scoped></style>
