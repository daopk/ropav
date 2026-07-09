<template>
    <button
        :class="rootClass"
        :style="rootStyle"
        :disabled="disabled || loading || undefined"
        :type="type"
        :aria-busy="loading || undefined"
    >
        <span v-if="loading" class="rp-button__loading" aria-hidden="true">
            <slot name="loading">
                <IconLoaderCircle class="rp-button__spinner" />
            </slot>
        </span>
        <span class="rp-button__content">
            <span v-if="$slots.left" class="rp-button__left">
                <slot name="left" />
            </span>
            <span class="rp-button__label">
                <slot />
            </span>
            <span v-if="$slots.right" class="rp-button__right">
                <slot name="right" />
            </span>
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import type { ButtonProps } from './types';
import { getButtonColorStyle } from './useButtonColor';

defineOptions({ name: 'RpButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
    type: 'button',
    disabled: false,
    loading: false,
});

const rootClass = computed(() =>
    bem('rp-button', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
        loading: props.loading,
    }),
);

const rootStyle = computed(() =>
    getButtonColorStyle(props.color, props.variant, props.autoContrast),
);
</script>

<style src="./button.scss" lang="scss" scoped></style>
