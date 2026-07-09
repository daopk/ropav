<template>
    <button
        :class="rootClass"
        :style="rootStyle"
        :disabled="disabled || loading || undefined"
        :type="type"
        :aria-label="ariaLabel || undefined"
        :aria-busy="loading || undefined"
    >
        <IconLoaderCircle v-if="loading" class="rp-icon-button__spinner" aria-hidden="true" />
        <span v-else class="rp-icon-button__icon" aria-hidden="true">
            <slot />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import { getButtonColorStyle } from '../button/useButtonColor';
import type { IconButtonProps } from './types';

defineOptions({ name: 'RpIconButton' });

const props = withDefaults(defineProps<IconButtonProps>(), {
    type: 'button',
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
    getButtonColorStyle(props.color, props.variant, props.autoContrast),
);
</script>

<style src="../button/button.scss" lang="scss" scoped></style>
<style src="./icon-button.scss" lang="scss" scoped></style>
