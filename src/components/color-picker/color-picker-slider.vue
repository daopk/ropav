<template>
    <div
        :ref="setSliderElement"
        :class="[rootClass, controlClass]"
        role="slider"
        :style="[sliderStyle, controlStyle]"
        :tabindex="0"
        :aria-label="ariaLabel"
        aria-orientation="horizontal"
        :aria-valuemin="0"
        :aria-valuemax="sliderState.max"
        :aria-valuenow="Math.round(sliderState.value)"
        :aria-valuetext="ariaValueText"
        :aria-readonly="readonly || undefined"
        :data-readonly="toPresenceAttribute(readonly)"
        :data-control="variant"
        @pointerdown="onPointerDown"
        @keydown="onKeydown"
    >
        <span :class="surfaceClass" aria-hidden="true" />
        <span
            :class="[internalHandleClass, handleClass]"
            :style="handleStyle"
            :data-control="variant"
            aria-hidden="true"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import { toPresenceAttribute } from '@/utils/attributes';
import { normalizeHueForColor } from '@/utils/colorPicker';
import type { ColorPickerSliderProps } from './types';
import { useColorPickerSlider } from './useColorPickerSlider';

defineOptions({ name: 'RpColorPickerSlider' });

const props = withDefaults(defineProps<ColorPickerSliderProps>(), {
    value: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:value': [value: number];
}>();

const { setSliderElement, sliderState, onPointerDown, onKeydown } = useColorPickerSlider({
    variant: () => props.variant,
    value: () => props.value,
    readonly: () => props.readonly,
    onChange: (value) => emit('update:value', value),
});

const rootClass = computed(() => `rp-color-picker__${props.variant}`);
const surfaceClass = computed(() => [
    'rp-color-picker__slider-surface',
    `rp-color-picker__${props.variant}-surface`,
]);
const internalHandleClass = computed(() => [
    'rp-color-picker__slider-handle',
    `rp-color-picker__${props.variant}-handle`,
]);

const sliderStyle = computed(() => {
    const style = {
        '--_rp-color-picker-slider-x': `${
            (sliderState.value.outputValue / sliderState.value.max) * 100
        }%`,
    } as CSSProperties;

    if (sliderState.value.isHue) {
        style['--_rp-color-picker-hue'] = String(
            normalizeHueForColor(sliderState.value.outputValue),
        );
    } else {
        style['--_rp-color-picker-opacity-color'] = props.color;
    }

    return style;
});

const ariaLabel = computed(() => (sliderState.value.isHue ? 'Hue' : 'Opacity'));
const ariaValueText = computed(() =>
    sliderState.value.isHue
        ? `${Math.round(sliderState.value.value)} degrees hue`
        : `${Math.round(sliderState.value.value)}% opacity`,
);
</script>

<style src="./color-picker-slider.scss" lang="scss" scoped></style>
