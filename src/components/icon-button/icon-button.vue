<template>
    <button v-bind="rootAttrs">
        <IconLoaderCircle
            v-if="loading"
            v-bind="getPartAttrs('loader', { class: 'rp-icon-button__spinner' })"
            aria-hidden="true"
        />
        <span
            v-else
            v-bind="getPartAttrs('icon', { class: 'rp-icon-button__icon' })"
            aria-hidden="true"
        >
            <slot />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import { presence, useStylesApi } from '@/styles-api';
import { getButtonColorStyle } from '../button/useButtonColor';
import type { IconButtonPart, IconButtonProps } from './types';

defineOptions({ name: 'RpIconButton', inheritAttrs: false });

const props = withDefaults(defineProps<IconButtonProps>(), {
    type: 'button',
    autoContrast: true,
    disabled: false,
    loading: false,
});

const rootClass = computed(() => [
    ...bem('rp-button', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
    'rp-icon-button',
]);

const rootStyle = computed(() =>
    getButtonColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);
const { getPartAttrs, getRootAttrs } = useStylesApi<IconButtonPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        disabled: props.disabled || props.loading || undefined,
        type: props.type,
        'aria-label': props.ariaLabel || undefined,
        'aria-busy': props.loading || undefined,
        'data-disabled': presence(props.disabled || props.loading),
        'data-loading': presence(props.loading),
    }),
);
</script>

<style src="../button/button.scss" lang="scss" scoped></style>
<style src="./icon-button.scss" lang="scss" scoped></style>
