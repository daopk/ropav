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

        <div
            v-if="swatches.length"
            class="rp-color-picker__swatches"
            :style="swatchesStyle"
            :data-fill="normalizedSwatchesPerRow ? true : undefined"
            role="group"
            aria-label="Color swatches"
        >
            <button
                v-for="(swatch, index) in swatches"
                :key="`${swatch}-${index}`"
                class="rp-color-picker__swatch"
                type="button"
                :disabled="readonly"
                :aria-pressed="isSwatchSelected(swatch)"
                :aria-label="`Select color ${swatch}`"
                :title="swatch"
                @click="emitSwatchColor(swatch)"
            >
                <ColorSwatch :color="swatch" :size="swatchSize" aria-hidden="true">
                    <IconCheck
                        v-if="isSwatchSelected(swatch)"
                        class="rp-color-picker__swatch-check"
                    />
                </ColorSwatch>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, ref, useAttrs, type CSSProperties } from 'vue';
import IconCheck from '~icons/lucide/check';
import { bem } from '@/utils/bem';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import ColorPickerSaturation from './color-picker-saturation.vue';
import ColorPickerSlider from './color-picker-slider.vue';
import {
    clampOpacity,
    clampPercent,
    DEFAULT_HUE,
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
    readonly: false,
    swatches: () => [],
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerValue];
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

const normalizedSwatchesPerRow = computed(() => normalizeSwatchesPerRow(props.swatchesPerRow));
const swatchesStyle = computed(() => {
    const swatchesPerRow = normalizedSwatchesPerRow.value;
    if (!swatchesPerRow) return undefined;

    return {
        '--_rp-color-picker-swatches-per-row': String(swatchesPerRow),
    } as CSSProperties;
});
const swatchSize = computed(() =>
    normalizedSwatchesPerRow.value ? '100%' : 'var(--_rp-color-picker-swatch-size)',
);
const showAlphaControls = computed(() => isColorPickerAlphaFormat(props.format));
const emittedStringColor = ref<{
    value: string;
    format: ColorPickerFormat;
    color: ColorPickerHsvColor;
} | null>(null);

const selectedColor = computed<ColorPickerHsvColor>(() => {
    const value = props.modelValue;
    const cached = emittedStringColor.value;
    if (cached && cached.value === value && cached.format === props.format) return cached.color;

    return (
        parseColorPickerValue(value) ?? {
            hue: DEFAULT_HUE,
            saturation: 100,
            value: 100,
            opacity: 100,
        }
    );
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
    emitColor({ hue: value });
}

function emitOpacity(value: number) {
    emitColor({ opacity: value });
}

function emitSwatchColor(swatch: string) {
    if (props.readonly) return;

    const parsedColor = parseColorPickerValue(swatch);
    if (!parsedColor) return;

    const color = normalizeColor(parsedColor);
    emitColor(color);
}

function isSwatchSelected(swatch: string) {
    const parsedColor = parseColorPickerValue(swatch);
    if (!parsedColor) return false;

    return (
        getComparableColor(normalizeColor(parsedColor)) === getComparableColor(selectedColor.value)
    );
}

function emitColor(nextColor: Partial<ColorPickerHsvColor>) {
    const color = normalizeColor({ ...selectedColor.value, ...nextColor });
    const formattedValue = formatColorPickerValue(color, props.format);

    emittedStringColor.value = {
        value: formattedValue,
        format: props.format,
        color,
    };
    emit('update:modelValue', formattedValue);
}

function normalizeColor(color: Partial<ColorPickerHsvColor>): ColorPickerHsvColor {
    return {
        hue: normalizeHue(color.hue),
        saturation: roundPercent(clampPercent(color.saturation)),
        value: roundPercent(clampPercent(color.value)),
        opacity: roundPercent(clampOpacity(color.opacity)),
    };
}

function getComparableColor(color: ColorPickerHsvColor) {
    return formatColorPickerValue(color, 'rgba');
}

function normalizeSwatchesPerRow(value: number | undefined) {
    if (!Number.isFinite(value) || value! < 1) return undefined;
    return Math.min(100, Math.floor(value!));
}
</script>

<style src="./color-picker.scss" lang="scss" scoped></style>
