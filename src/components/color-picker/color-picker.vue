<template>
    <div v-bind="rootAttrs" :class="rootClass" :data-readonly="readonly || undefined">
        <div v-if="$slots.default" class="rp-color-picker__header">
            <span class="rp-color-picker__label">
                <slot />
            </span>
        </div>

        <ColorPickerSaturation
            :id="id"
            :model-value="saturationValue"
            :hue="selectedColor.hue"
            :readonly="readonly"
            :aria-label="ariaLabel"
            :describedby="describedby"
            :labelledby="labelledby"
            @update:model-value="emitModelValue"
        />

        <ColorPickerSlider
            variant="hue"
            :value="selectedColor.hue"
            :readonly="readonly"
            @update:value="emitHue"
        />

        <ColorPickerSlider
            v-if="showAlphaControls"
            variant="opacity"
            :color="opacityColor"
            :value="selectedColor.opacity"
            :readonly="readonly"
            @update:value="emitOpacity"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useAttrs } from 'vue';
import { bem } from '@/utils/bem';
import ColorPickerSaturation from './color-picker-saturation.vue';
import ColorPickerSlider from './color-picker-slider.vue';
import {
    clampOpacity,
    clampPercent,
    formatColorPickerValue,
    getHsvCssColor,
    isColorPickerAlphaFormat,
    normalizeHue,
    parseColorPickerValue,
    roundPercent,
    type ColorPickerHsvColor,
} from './color-picker-utils';
import type {
    ColorPickerFormat,
    ColorPickerProps,
    ColorPickerSelection,
    ColorPickerValue,
} from './types';

defineOptions({ name: 'RpColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerProps>(), {
    format: 'hex',
    hue: 0,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerValue];
    'update:hue': [value: number];
}>();

const rootClass = computed(() =>
    bem('rp-color-picker', {
        readonly: props.readonly,
    }),
);
const attrs = useAttrs();
const rootAttrs = computed(() => {
    const { disabled: _disabled, invalid: _invalid, required: _required, ...filteredAttrs } = attrs;
    return filteredAttrs;
});

const showAlphaControls = computed(() => isColorPickerAlphaFormat(props.format));
const emittedStringColor = ref<{
    value: string;
    format: ColorPickerFormat;
    color: ColorPickerHsvColor;
} | null>(null);

const selectedColor = computed<ColorPickerHsvColor>(() => {
    const value = props.modelValue;

    if (typeof value === 'string') {
        const cached = emittedStringColor.value;
        if (cached && cached.value === value && cached.format === props.format) return cached.color;

        return (
            parseColorPickerValue(value) ?? {
                hue: normalizeHue(props.hue),
                saturation: 100,
                value: 100,
                opacity: 100,
            }
        );
    }

    return normalizeColor({
        hue: normalizeHue(props.hue),
        saturation: value.saturation,
        value: value.value,
        opacity: value.opacity,
    });
});

const saturationValue = computed<ColorPickerSelection>(() => ({
    saturation: selectedColor.value.saturation,
    value: selectedColor.value.value,
}));

const opacityColor = computed(() =>
    getHsvCssColor(
        selectedColor.value.hue,
        selectedColor.value.saturation,
        selectedColor.value.value,
    ),
);

function emitModelValue(value: ColorPickerSelection) {
    emitColor({
        saturation: value.saturation,
        value: value.value,
        ...(value.opacity === undefined ? {} : { opacity: value.opacity }),
    });
}

function emitHue(value: number) {
    emit('update:hue', value);
    if (typeof props.modelValue === 'string') emitColor({ hue: value });
}

function emitOpacity(value: number) {
    emitColor({ opacity: value });
}

function emitColor(nextColor: Partial<ColorPickerHsvColor>) {
    const color = normalizeColor({ ...selectedColor.value, ...nextColor });

    if (typeof props.modelValue === 'string') {
        const formattedValue = formatColorPickerValue(color, props.format);
        emittedStringColor.value = {
            value: formattedValue,
            format: props.format,
            color,
        };
        emit('update:modelValue', formattedValue);
        return;
    }

    const value: ColorPickerSelection = {
        saturation: color.saturation,
        value: color.value,
    };

    if (showAlphaControls.value) value.opacity = color.opacity;

    emit('update:modelValue', value);
}

function normalizeColor(color: Partial<ColorPickerHsvColor>): ColorPickerHsvColor {
    return {
        hue: normalizeHue(color.hue),
        saturation: roundPercent(clampPercent(color.saturation)),
        value: roundPercent(clampPercent(color.value)),
        opacity: roundPercent(clampOpacity(color.opacity)),
    };
}
</script>

<style src="./color-picker.scss" lang="scss" scoped></style>
