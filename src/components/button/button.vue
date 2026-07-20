<template>
    <button v-bind="rootAttrs">
        <span
            v-if="loading"
            v-bind="getPartAttrs('loader', { class: 'rp-button__loading' })"
            aria-hidden="true"
        >
            <slot name="loading">
                <IconLoaderCircle class="rp-button__spinner" />
            </slot>
        </span>
        <span class="rp-button__content">
            <span v-if="$slots.left" v-bind="getPartAttrs('left', { class: 'rp-button__left' })">
                <slot name="left" />
            </span>
            <span v-bind="getPartAttrs('label', { class: 'rp-button__label' })">
                <slot />
            </span>
            <span v-if="$slots.right" v-bind="getPartAttrs('right', { class: 'rp-button__right' })">
                <slot name="right" />
            </span>
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import { presence, useStylesApi } from '@/styles-api';
import type { ButtonPart, ButtonProps } from './types';
import { getButtonColorStyle } from './useButtonColor';

defineOptions({ name: 'RpButton', inheritAttrs: false });

const props = withDefaults(defineProps<ButtonProps>(), {
    type: 'button',
    autoContrast: true,
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
    getButtonColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);

const { getPartAttrs, getRootAttrs } = useStylesApi<ButtonPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        disabled: props.disabled || props.loading || undefined,
        type: props.type,
        'aria-busy': props.loading || undefined,
        'data-disabled': presence(props.disabled || props.loading),
        'data-loading': presence(props.loading),
    }),
);
</script>

<style src="./button.scss" lang="scss" scoped></style>
