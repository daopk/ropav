<template>
    <button :class="rootClass" :disabled="disabled || isLoading || undefined" :type="type">
        <IconLoaderCircle v-if="isLoading" class="rp-button__spinner" aria-hidden="true" />
        <span v-if="$slots.left && !isLoading" class="rp-button__left">
            <slot name="left" />
        </span>
        <span class="rp-button__label">
            <slot />
        </span>
        <span v-if="$slots.right" class="rp-button__right">
            <slot name="right" />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import type { ButtonProps } from './types';

defineOptions({ name: 'RpButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
    type: 'button',
    disabled: false,
    loading: false,
});

const isLoading = computed(() => props.loading && !props.disabled);

const rootClass = computed(() =>
    bem('rp-button', {
        [props.variant ?? '']: Boolean(props.variant),
        [`color-${props.color}`]: Boolean(props.color),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);
</script>

<style src="./button.scss" lang="scss" scoped></style>
