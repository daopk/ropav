<template>
    <span :class="rootClass" :style="rootStyle" :aria-label="ariaLabel || undefined">
        <span v-if="$slots.left" class="rp-badge__left">
            <slot name="left" />
        </span>
        <span v-if="$slots.default" class="rp-badge__label">
            <slot />
        </span>
        <span v-if="$slots.right" class="rp-badge__right">
            <slot name="right" />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type { BadgeProps } from './types';
import { getBadgeColorStyle } from './useBadgeColor';

defineOptions({ name: 'RpBadge' });

const props = defineProps<BadgeProps>();

const rootClass = computed(() =>
    bem('rp-badge', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getBadgeColorStyle(props.color, props.variant, props.autoContrast),
);
</script>

<style src="./badge.scss" lang="scss" scoped></style>
