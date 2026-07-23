<template>
    <span v-bind="rootAttrs">
        <span class="rp-color-swatch__icon" aria-hidden="true">
            <slot />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import { useStylesApi } from '@/styles-api';
import type { ColorSwatchPart, ColorSwatchProps, ColorSwatchSize } from './types';
import { getColorSwatchForeground, getColorSwatchOverlay } from './colorSwatchColor';

defineOptions({ name: 'RpColorSwatch', inheritAttrs: false });

const props = defineProps<ColorSwatchProps>();
const { attrs, getRootAttrs } = useStylesApi<ColorSwatchPart>(props, 'root');

const isHidden = computed(() => attrs['aria-hidden'] === true || attrs['aria-hidden'] === 'true');

const rootRole = computed(() => (isHidden.value ? undefined : 'img'));
const rootAriaLabel = computed(() =>
    isHidden.value ? undefined : props.ariaLabel || `Color swatch ${props.color}`,
);

const rootStyle = computed(() => {
    const overlay = getColorSwatchOverlay(props.color);
    const style = {
        '--_rp-color-swatch-color': props.color,
        '--_rp-color-swatch-fg': getColorSwatchForeground(props.color),
        '--_rp-color-swatch-overlay-stroke': overlay.stroke,
        '--_rp-color-swatch-overlay-shadow': overlay.shadow,
    } as CSSProperties;

    if (props.size !== undefined) {
        style['--_rp-color-swatch-size'] = normalizeSize(props.size);
    }

    return style;
});
const rootAttrs = computed(() =>
    getRootAttrs({
        class: 'rp-color-swatch',
        style: rootStyle.value,
        role: rootRole.value,
        'aria-label': rootAriaLabel.value,
    }),
);

function normalizeSize(size: ColorSwatchSize) {
    return typeof size === 'number' ? `${size}px` : size;
}
</script>

<style src="./color-swatch.scss" lang="scss" scoped></style>
