<template>
    <span :class="rootClass" :style="rootStyle" :aria-label="ariaLabel || undefined">
        <span v-if="dot" class="rp-badge__dot" aria-hidden="true" />
        <span v-if="$slots.default" class="rp-badge__label">
            <slot />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, useSlots, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getComponentCustomColor, isComponentPresetColor } from '@/utils/componentColors';
import type { BadgeColor, BadgeProps } from './types';

defineOptions({ name: 'RpBadge' });

const props = withDefaults(defineProps<BadgeProps>(), {
    dot: false,
});

const slots = useSlots();

const hasDefaultSlot = computed(() => Boolean(slots.default));

const rootClass = computed(() =>
    bem('rp-badge', {
        [props.variant ?? '']: Boolean(props.variant),
        [`color-${props.color}`]: isComponentPresetColor(props.color),
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
        dot: props.dot,
        'dot-only': props.dot && !hasDefaultSlot.value,
    }),
);

const rootStyle = computed(() => getBadgeColorStyle(props.color));

function getBadgeColorStyle(color: BadgeColor | undefined) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-badge-custom-bg': customColor,
        '--_rp-badge-custom-fg': customColor,
        '--_rp-badge-custom-on-bg': 'var(--rp-color-on-primary)',
        '--_rp-badge-custom-subtle-bg': `color-mix(in srgb, ${customColor} 12%, transparent)`,
        '--_rp-badge-custom-border': `color-mix(in srgb, ${customColor} 45%, transparent)`,
    } satisfies CSSProperties;
}
</script>

<style src="./badge.scss" lang="scss" scoped></style>
