<template>
    <div
        :ref="setSaturationElement"
        :class="['rp-color-picker__saturation', controlClass]"
        role="group"
        :style="[saturationStyle, controlStyle]"
        :aria-label="groupAriaLabel"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
        :data-readonly="toPresenceAttribute(readonly)"
        data-control="saturation"
        @pointerdown="onPointerDown"
    >
        <input
            :id="id"
            :ref="setSaturationInput"
            class="rp-color-picker__axis-input rp-color-picker__axis-input--saturation"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="selection.saturation"
            aria-label="Saturation"
            aria-orientation="horizontal"
            :aria-valuenow="Math.round(selection.saturation)"
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
            :value="selection.value"
            aria-label="Value"
            aria-orientation="vertical"
            :aria-valuenow="Math.round(selection.value)"
            :aria-valuetext="ariaValueText"
            :aria-describedby="describedby"
            :aria-readonly="readonly || undefined"
            @input="onAxisInput($event, 'value')"
            @keydown="onAxisKeydown($event, 'value')"
        />
        <span class="rp-color-picker__surface" aria-hidden="true" />
        <span
            :class="['rp-color-picker__handle', handleClass]"
            :style="handleStyle"
            data-control="saturation"
            aria-hidden="true"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type CSSProperties } from 'vue';
import { toPresenceAttribute } from '@/utils/attributes';
import { getHsvCssColor, normalizeHueForColor } from '@/utils/colorPicker';
import type { ColorPickerSaturationProps, ColorPickerSelection } from './types';
import { useColorPickerSaturation } from './useColorPickerSaturation';

defineOptions({ name: 'RpColorPickerSaturation' });

const props = withDefaults(defineProps<ColorPickerSaturationProps>(), {
    hue: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerSelection];
}>();

const {
    setSaturationElement,
    setSaturationInput,
    selection,
    normalizedHue,
    onPointerDown,
    onAxisKeydown,
    onAxisInput,
} = useColorPickerSaturation({
    modelValue: () => props.modelValue,
    hue: () => props.hue,
    readonly: () => props.readonly,
    onChange: (nextSelection) => emit('update:modelValue', nextSelection),
});

const saturationStyle = computed(
    () =>
        ({
            '--_rp-color-picker-hue': String(normalizeHueForColor(normalizedHue.value)),
            '--_rp-color-picker-saturation-x': `${selection.value.saturation}%`,
            '--_rp-color-picker-saturation-y': `${100 - selection.value.value}%`,
            '--_rp-color-picker-current': getHsvCssColor(
                normalizedHue.value,
                selection.value.saturation,
                selection.value.value,
            ),
        }) as CSSProperties,
);

const ariaValueText = computed(
    () =>
        `${Math.round(selection.value.saturation)}% saturation, ${Math.round(
            selection.value.value,
        )}% value`,
);
const groupAriaLabel = computed(() =>
    props.labelledby ? undefined : props.ariaLabel || 'Color area',
);
</script>

<style src="./color-picker-saturation.scss" lang="scss" scoped></style>
