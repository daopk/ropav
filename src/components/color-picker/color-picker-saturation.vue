<template>
    <div
        :id="id"
        ref="saturationRef"
        class="rp-color-picker__saturation"
        role="slider"
        :style="saturationStyle"
        :tabindex="0"
        aria-orientation="horizontal"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="Math.round(saturation)"
        :aria-valuetext="ariaValueText"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
        :aria-readonly="readonly || undefined"
        :data-readonly="readonly || undefined"
        @pointerdown="onPointerDown"
        @keydown="onKeydown"
    >
        <span class="rp-color-picker__surface" aria-hidden="true" />
        <span class="rp-color-picker__handle" aria-hidden="true" />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, type CSSProperties } from 'vue';
import {
    clampPercent,
    getHsvCssColor,
    KEYBOARD_LARGE_STEP,
    KEYBOARD_STEP,
    normalizeHue,
    normalizeHueForColor,
    roundPercent,
} from './color-picker-utils';
import type { ColorPickerSaturationProps, ColorPickerSelection } from './types';
import { useColorPickerDrag } from './useColorPickerDrag';

defineOptions({ name: 'RpColorPickerSaturation' });

const props = withDefaults(defineProps<ColorPickerSaturationProps>(), {
    hue: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerSelection];
}>();

const saturationRef = ref<HTMLElement | null>(null);
const saturation = computed(() => clampPercent(props.modelValue.saturation));
const value = computed(() => clampPercent(props.modelValue.value));
const hue = computed(() => normalizeHue(props.hue));

const saturationStyle = computed(
    () =>
        ({
            '--_rp-color-picker-hue': String(normalizeHueForColor(hue.value)),
            '--_rp-color-picker-saturation-x': `${saturation.value}%`,
            '--_rp-color-picker-saturation-y': `${100 - value.value}%`,
            '--_rp-color-picker-current': getHsvCssColor(hue.value, saturation.value, value.value),
        }) as CSSProperties,
);

const ariaValueText = computed(
    () => `${Math.round(saturation.value)}% saturation, ${Math.round(value.value)}% value`,
);

function updateValue(nextSaturation: number, nextValue: number) {
    if (props.readonly) return;

    const normalizedSaturation = roundPercent(clampPercent(nextSaturation));
    const normalizedValue = roundPercent(clampPercent(nextValue));
    if (normalizedSaturation === saturation.value && normalizedValue === value.value) return;

    emit('update:modelValue', {
        saturation: normalizedSaturation,
        value: normalizedValue,
    });
}

function updateFromPointer(e: PointerEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextSaturation = ((e.clientX - rect.left) / rect.width) * 100;
    const nextValue = 100 - ((e.clientY - rect.top) / rect.height) * 100;

    updateValue(nextSaturation, nextValue);
}

const { onPointerDown } = useColorPickerDrag({
    target: saturationRef,
    readonly: () => props.readonly,
    updateFromPointer,
});

function onKeydown(e: KeyboardEvent) {
    if (props.readonly) return;

    const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;

    switch (e.key) {
        case 'ArrowRight':
            e.preventDefault();
            updateValue(saturation.value + step, value.value);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            updateValue(saturation.value - step, value.value);
            break;
        case 'ArrowUp':
            e.preventDefault();
            updateValue(saturation.value, value.value + step);
            break;
        case 'ArrowDown':
            e.preventDefault();
            updateValue(saturation.value, value.value - step);
            break;
        case 'Home':
            e.preventDefault();
            updateValue(0, value.value);
            break;
        case 'End':
            e.preventDefault();
            updateValue(100, value.value);
            break;
    }
}
</script>

<style src="./color-picker-saturation.scss" lang="scss" scoped></style>
