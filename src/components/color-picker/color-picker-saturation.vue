<template>
    <div
        ref="saturationRef"
        class="rp-color-picker__saturation"
        role="group"
        :style="saturationStyle"
        :aria-label="groupAriaLabel"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
        :aria-readonly="readonly || undefined"
        :data-readonly="readonly || undefined"
        @pointerdown="onPointerDown"
    >
        <input
            :id="id"
            ref="saturationInputRef"
            class="rp-color-picker__axis-input rp-color-picker__axis-input--saturation"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="saturation"
            aria-label="Saturation"
            aria-orientation="horizontal"
            :aria-valuenow="Math.round(saturation)"
            :aria-valuetext="ariaValueText"
            :aria-describedby="describedby"
            :aria-readonly="readonly || undefined"
            @input="onAxisInput($event, 'saturation')"
            @keydown="onAxisKeydown($event, 'saturation')"
        />
        <input
            :id="id ? `${id}-value` : undefined"
            class="rp-color-picker__axis-input rp-color-picker__axis-input--value"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="value"
            aria-label="Value"
            aria-orientation="vertical"
            :aria-valuenow="Math.round(value)"
            :aria-valuetext="ariaValueText"
            :aria-describedby="describedby"
            :aria-readonly="readonly || undefined"
            @input="onAxisInput($event, 'value')"
            @keydown="onAxisKeydown($event, 'value')"
        />
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
import { useColorPickerDrag, type ColorPickerPointerCoordinates } from './useColorPickerDrag';

type ColorPickerAxis = 'saturation' | 'value';

defineOptions({ name: 'RpColorPickerSaturation' });

const props = withDefaults(defineProps<ColorPickerSaturationProps>(), {
    hue: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerSelection];
}>();

const saturationRef = ref<HTMLElement | null>(null);
const saturationInputRef = ref<HTMLInputElement | null>(null);
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
const groupAriaLabel = computed(() =>
    props.labelledby ? undefined : props.ariaLabel || 'Color area',
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

function updateFromPointer(e: ColorPickerPointerCoordinates, rect: DOMRect) {
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextSaturation = ((e.clientX - rect.left) / rect.width) * 100;
    const nextValue = 100 - ((e.clientY - rect.top) / rect.height) * 100;

    updateValue(nextSaturation, nextValue);
}

const { onPointerDown } = useColorPickerDrag({
    target: saturationRef,
    focusTarget: saturationInputRef,
    readonly: () => props.readonly,
    isGeometryValid: (rect) => rect.width > 0 && rect.height > 0,
    updateFromPointer,
});

function onAxisKeydown(event: KeyboardEvent, axis: ColorPickerAxis) {
    const currentValue = axis === 'saturation' ? saturation.value : value.value;
    const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    let nextValue: number | undefined;

    switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
            nextValue = currentValue + step;
            break;
        case 'ArrowLeft':
        case 'ArrowDown':
            nextValue = currentValue - step;
            break;
        case 'Home':
            nextValue = 0;
            break;
        case 'End':
            nextValue = 100;
            break;
    }

    if (nextValue === undefined) return;

    event.preventDefault();
    if (!props.readonly) updateAxis(axis, nextValue);
}

function onAxisInput(event: Event, axis: ColorPickerAxis) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;

    if (props.readonly) {
        input.value = String(axis === 'saturation' ? saturation.value : value.value);
        return;
    }

    updateAxis(axis, Number(input.value));
}

function updateAxis(axis: ColorPickerAxis, nextValue: number) {
    if (axis === 'saturation') updateValue(nextValue, value.value);
    else updateValue(saturation.value, nextValue);
}
</script>

<style src="./color-picker-saturation.scss" lang="scss" scoped></style>
