<template>
    <a v-bind="rootAttrs">
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
    </a>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import { presence, useStylesApi } from '@/styles-api';
import { getButtonColorStyle } from '../button/useButtonColor';
import type { ButtonLinkPart, ButtonLinkProps } from './types';

defineOptions({ name: 'RpButtonLink', inheritAttrs: false });

const props = withDefaults(defineProps<ButtonLinkProps>(), {
    autoContrast: true,
    disabled: false,
    loading: false,
});

const isUnavailable = computed(() => props.disabled || props.loading);

const rootClass = computed(() =>
    bem('rp-button', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
        disabled: isUnavailable.value,
        loading: props.loading,
    }),
);

const rootStyle = computed(() =>
    getButtonColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);

const resolvedHref = computed(() => (isUnavailable.value ? undefined : props.href));
const resolvedTarget = computed(() => (isUnavailable.value ? undefined : props.target));
const resolvedRel = computed(() => {
    if (isUnavailable.value) return undefined;
    return props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined);
});
const resolvedDownload = computed(() => {
    if (isUnavailable.value || props.download === false) return undefined;
    return props.download === true ? '' : props.download;
});
const resolvedHrefLang = computed(() => (isUnavailable.value ? undefined : props.hreflang));

const { getPartAttrs, getRootAttrs } = useStylesApi<ButtonLinkPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        href: resolvedHref.value,
        target: resolvedTarget.value,
        rel: resolvedRel.value,
        download: resolvedDownload.value,
        hreflang: resolvedHrefLang.value,
        'aria-disabled': isUnavailable.value || undefined,
        'aria-busy': props.loading || undefined,
        tabindex: isUnavailable.value ? -1 : undefined,
        'data-disabled': presence(isUnavailable.value),
        'data-loading': presence(props.loading),
        onClickCapture: onDisabledClick,
    }),
);

function onDisabledClick(event: MouseEvent) {
    if (!isUnavailable.value) return;

    event.preventDefault();
    event.stopImmediatePropagation();
}
</script>

<style src="../button/button.scss" lang="scss" scoped></style>
