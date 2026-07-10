<template>
    <div v-bind="rootAttrs" :class="rootClass" :data-readonly="readonly || undefined">
        <div v-if="$slots.default" class="rp-color-picker__header">
            <span class="rp-color-picker__label">
                <slot />
            </span>
        </div>

        <template v-if="withPicker">
            <ColorPickerSaturation
                :id="id"
                :model-value="saturationValue"
                :hue="selectedColor.hue"
                :readonly="readonly"
                :aria-label="ariaLabel"
                :describedby="describedby"
                :labelledby="labelledby"
                @update:model-value="updateSelection"
            />

            <ColorPickerSlider
                variant="hue"
                :value="selectedColor.hue"
                :readonly="readonly"
                @update:value="updateHue"
            />

            <ColorPickerSlider
                v-if="showAlphaControls"
                variant="opacity"
                :color="opacityColor"
                :value="selectedColor.opacity"
                :readonly="readonly"
                @update:value="updateOpacity"
            />
        </template>

        <div
            v-if="validSwatches.length"
            ref="swatchesRef"
            class="rp-color-picker__swatches"
            :style="swatchesStyle"
            :data-fill="normalizedSwatchesPerRow ? true : undefined"
            :data-with-picker="withPicker || undefined"
            :id="withPicker ? undefined : id"
            role="radiogroup"
            :aria-label="withPicker ? 'Color swatches' : ariaLabel || 'Color swatches'"
            :aria-describedby="withPicker ? undefined : describedby"
            :aria-labelledby="withPicker ? undefined : labelledby"
            @focusout="onSwatchesFocusout"
        >
            <button
                v-for="(swatch, index) in validSwatches"
                :key="`${swatch}-${index}`"
                class="rp-color-picker__swatch"
                type="button"
                role="radio"
                :disabled="readonly"
                :tabindex="readonly ? -1 : getSwatchTabindex(index)"
                :aria-checked="isSwatchSelected(index)"
                :aria-label="`Select color ${swatch}`"
                :title="swatch"
                @click="selectSwatch(swatch)"
                @focus="onSwatchFocus(index)"
                @keydown="onSwatchKeydown($event, index)"
            >
                <ColorSwatch :color="swatch" :size="swatchSize" aria-hidden="true">
                    <IconCheck
                        v-if="isSwatchSelected(index)"
                        class="rp-color-picker__swatch-check"
                    />
                </ColorSwatch>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, useAttrs } from 'vue';
import IconCheck from '~icons/lucide/check';
import { bem } from '@/utils/bem';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import ColorPickerSaturation from './color-picker-saturation.vue';
import ColorPickerSlider from './color-picker-slider.vue';
import type { ColorPickerProps, ColorPickerValue } from './types';
import { useColorPickerSwatches } from './useColorPickerSwatches';
import { useColorPickerValue } from './useColorPickerValue';

defineOptions({ name: 'RpColorPicker', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPickerProps>(), {
    format: 'hex',
    readonly: false,
    withPicker: true,
    swatches: () => [],
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerValue];
}>();

const rootClass = computed(() =>
    bem('rp-color-picker', {
        [`size-${props.size}`]: Boolean(props.size),
        readonly: props.readonly,
    }),
);
const attrs = useAttrs();
const rootAttrs = computed(() => {
    const { disabled: _disabled, invalid: _invalid, required: _required, ...filteredAttrs } = attrs;
    return filteredAttrs;
});

const {
    selectedColor,
    saturationValue,
    opacityColor,
    showAlphaControls,
    updateSelection,
    updateHue,
    updateOpacity,
    selectColor,
    isColorSelected,
} = useColorPickerValue(props, (value) => emit('update:modelValue', value));

const {
    swatchesRef,
    normalizedSwatchesPerRow,
    validSwatches,
    swatchesStyle,
    swatchSize,
    isSwatchSelected,
    getSwatchTabindex,
    selectSwatch,
    onSwatchFocus,
    onSwatchesFocusout,
    onSwatchKeydown,
} = useColorPickerSwatches(props, {
    isSelected: isColorSelected,
    select: selectColor,
});

void swatchesRef;
</script>

<style src="./color-picker.scss" lang="scss" scoped></style>
