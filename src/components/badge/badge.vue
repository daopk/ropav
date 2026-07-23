<template>
    <span v-bind="rootAttrs">
        <span v-if="$slots.left" v-bind="getPartAttrs('left', { class: 'rp-badge__left' })">
            <slot name="left" />
        </span>
        <span v-if="$slots.default" v-bind="getPartAttrs('label', { class: 'rp-badge__label' })">
            <slot />
        </span>
        <span v-if="$slots.right" v-bind="getPartAttrs('right', { class: 'rp-badge__right' })">
            <slot name="right" />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import type { BadgePart, BadgeProps } from './types';
import { getBadgeColorStyle } from './badgeColor';

defineOptions({ name: 'RpBadge', inheritAttrs: false });

const props = withDefaults(defineProps<BadgeProps>(), {
    autoContrast: true,
});

const rootClass = computed(() =>
    bem('rp-badge', {
        [props.variant ?? '']: Boolean(props.variant),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
    }),
);

const rootStyle = computed(() =>
    getBadgeColorStyle(props.color, props.variant, props.autoContrast, props.contrastColor),
);
const { getPartAttrs, getRootAttrs } = useStylesApi<BadgePart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        'aria-label': props.ariaLabel || undefined,
    }),
);
</script>

<style src="./badge.scss" lang="scss" scoped></style>
