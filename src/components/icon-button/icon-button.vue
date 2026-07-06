<template>
    <button
        :class="rootClass"
        :disabled="disabled || isLoading || undefined"
        :type="type"
        :aria-label="ariaLabel || undefined"
    >
        <IconLoaderCircle v-if="isLoading" class="rp-icon-button__spinner" aria-hidden="true" />
        <span v-else class="rp-icon-button__icon" aria-hidden="true">
            <slot />
        </span>
    </button>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconLoaderCircle from '~icons/lucide/loader-circle';
import { bem } from '@/utils/bem';
import type { IconButtonProps } from './types';

defineOptions({ name: 'RpIconButton' });

const props = withDefaults(defineProps<IconButtonProps>(), {
    type: 'button',
    disabled: false,
    loading: false,
});

const isLoading = computed(() => props.loading && !props.disabled);

const rootClass = computed(() => [
    ...bem('rp-button', {
        [props.variant ?? '']: Boolean(props.variant),
        [`color-${props.color}`]: Boolean(props.color),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
    'rp-icon-button',
]);
</script>

<style src="../button/button.scss" lang="scss" scoped></style>
<style src="./icon-button.scss" lang="scss" scoped></style>
