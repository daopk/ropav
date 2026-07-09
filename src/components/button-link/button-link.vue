<template>
    <a
        :class="rootClass"
        :style="rootStyle"
        :href="resolvedHref"
        :target="resolvedTarget"
        :rel="resolvedRel"
        :download="resolvedDownload"
        :hreflang="resolvedHrefLang"
        :aria-disabled="isUnavailable || undefined"
        :aria-busy="loading || undefined"
        :tabindex="isUnavailable ? -1 : undefined"
        @click.capture="onDisabledClick"
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
    </a>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import { getButtonColorStyle } from '../button/useButtonColor';
import type { ButtonLinkProps } from './types';

defineOptions({ name: 'RpButtonLink' });

const props = withDefaults(defineProps<ButtonLinkProps>(), {
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
    getButtonColorStyle(props.color, props.variant, props.autoContrast),
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

function onDisabledClick(event: MouseEvent) {
    if (!isUnavailable.value) return;

    event.preventDefault();
    event.stopImmediatePropagation();
}
</script>

<style src="../button/button.scss" lang="scss" scoped></style>
