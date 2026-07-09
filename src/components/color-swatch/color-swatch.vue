<template>
    <span
        v-bind="attrs"
        class="rp-color-swatch"
        :style="rootStyle"
        :role="rootRole"
        :aria-label="rootAriaLabel"
    >
        <span class="rp-color-swatch__icon" aria-hidden="true">
            <slot />
        </span>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed, useAttrs, type CSSProperties } from 'vue';
import type { ColorSwatchProps, ColorSwatchSize } from './types';
import { getColorSwatchForeground } from './useColorSwatchColor';

defineOptions({ name: 'RpColorSwatch', inheritAttrs: false });

const props = defineProps<ColorSwatchProps>();
const attrs = useAttrs();

const isHidden = computed(() => attrs['aria-hidden'] === true || attrs['aria-hidden'] === 'true');

const rootRole = computed(() => (isHidden.value ? undefined : 'img'));
const rootAriaLabel = computed(() =>
    isHidden.value ? undefined : props.ariaLabel || `Color swatch ${props.color}`,
);

const rootStyle = computed(() => {
    const style = {
        '--_rp-color-swatch-color': props.color,
        '--_rp-color-swatch-fg': getColorSwatchForeground(props.color),
    } as CSSProperties;

    if (props.size !== undefined) {
        style['--_rp-color-swatch-size'] = normalizeSize(props.size);
    }

    return style;
});

function normalizeSize(size: ColorSwatchSize) {
    return typeof size === 'number' ? `${size}px` : size;
}
</script>

<style src="./color-swatch.scss" lang="scss" scoped></style>
