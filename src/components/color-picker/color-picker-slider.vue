<template>
    <div
        ref="sliderRef"
        :class="rootClass"
        role="slider"
        :style="sliderStyle"
        :tabindex="0"
        :aria-label="ariaLabel"
        aria-orientation="horizontal"
        :aria-valuemin="0"
        :aria-valuemax="max"
        :aria-valuenow="Math.round(normalizedValue)"
        :aria-valuetext="ariaValueText"
        :aria-readonly="readonly || undefined"
        :data-readonly="readonly || undefined"
        @pointerdown="onPointerDown"
        @keydown="onKeydown"
    >
        <span :class="surfaceClass" aria-hidden="true" />
        <span :class="handleClass" aria-hidden="true" />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, type CSSProperties } from 'vue';
import {
    clampHue,
    clampOpacity,
    HUE_MAX,
    KEYBOARD_LARGE_STEP,
    KEYBOARD_STEP,
    normalizeHue,
    normalizeHueForColor,
    roundPercent,
} from './color-picker-utils';
import type { ColorPickerSliderProps } from './types';
import { useColorPickerDrag } from './useColorPickerDrag';

defineOptions({ name: 'RpColorPickerSlider' });

const props = withDefaults(defineProps<ColorPickerSliderProps>(), {
    value: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:value': [value: number];
}>();

const sliderRef = ref<HTMLElement | null>(null);
const isHue = computed(() => props.variant === 'hue');
const max = computed(() => (isHue.value ? HUE_MAX : 100));
const rootClass = computed(() => `rp-color-picker__${props.variant}`);
const surfaceClass = computed(() => [
    'rp-color-picker__slider-surface',
    `rp-color-picker__${props.variant}-surface`,
]);
const handleClass = computed(() => [
    'rp-color-picker__slider-handle',
    `rp-color-picker__${props.variant}-handle`,
]);

const normalizedValue = computed(() =>
    isHue.value ? normalizeHue(props.value) : clampOpacity(props.value),
);
const currentOutputValue = computed(() => normalizeOutputValue(normalizedValue.value));

const sliderStyle = computed(() => {
    const style = {
        '--_rp-color-picker-slider-x': `${(currentOutputValue.value / max.value) * 100}%`,
    } as CSSProperties;

    if (isHue.value) {
        style['--_rp-color-picker-hue'] = String(normalizeHueForColor(currentOutputValue.value));
    } else {
        style['--_rp-color-picker-opacity-color'] = props.color;
    }

    return style;
});

const ariaLabel = computed(() => (isHue.value ? 'Hue' : 'Opacity'));
const ariaValueText = computed(() =>
    isHue.value
        ? `${Math.round(normalizedValue.value)} degrees hue`
        : `${Math.round(normalizedValue.value)}% opacity`,
);

function updateValue(nextValue: number) {
    if (props.readonly) return;

    const normalizedNextValue = normalizeOutputValue(nextValue);
    if (normalizedNextValue === currentOutputValue.value) return;

    emit('update:value', normalizedNextValue);
}

function updateFromPointer(e: PointerEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;

    updateValue(((e.clientX - rect.left) / rect.width) * max.value);
}

const { onPointerDown } = useColorPickerDrag({
    target: sliderRef,
    readonly: () => props.readonly,
    updateFromPointer,
});

function onKeydown(e: KeyboardEvent) {
    if (props.readonly) return;

    const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
            e.preventDefault();
            updateValue(normalizedValue.value + step);
            break;
        case 'ArrowLeft':
        case 'ArrowDown':
            e.preventDefault();
            updateValue(normalizedValue.value - step);
            break;
        case 'Home':
            e.preventDefault();
            updateValue(0);
            break;
        case 'End':
            e.preventDefault();
            updateValue(max.value);
            break;
    }
}

function normalizeOutputValue(value: number) {
    return isHue.value ? Math.round(clampHue(value)) : roundPercent(clampOpacity(value));
}
</script>

<style src="./color-picker-slider.scss" lang="scss" scoped></style>
