<template>
    <div v-bind="rootAttrs">
        <div v-if="$slots.default" class="rp-color-picker__header">
            <span v-bind="getPartAttrs('label', { class: 'rp-color-picker__label' })">
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
                :control-class="classNames?.control"
                :control-style="styles?.control"
                :handle-class="classNames?.handle"
                :handle-style="styles?.handle"
                @update:model-value="updateSelection"
            />

            <ColorPickerSlider
                variant="hue"
                :value="selectedColor.hue"
                :readonly="readonly"
                :control-class="classNames?.control"
                :control-style="styles?.control"
                :handle-class="classNames?.handle"
                :handle-style="styles?.handle"
                @update:value="updateHue"
            />

            <ColorPickerSlider
                v-if="showAlphaControls"
                variant="opacity"
                :color="opacityColor"
                :value="selectedColor.opacity"
                :readonly="readonly"
                :control-class="classNames?.control"
                :control-style="styles?.control"
                :handle-class="classNames?.handle"
                :handle-style="styles?.handle"
                @update:value="updateOpacity"
            />
        </template>

        <div
            v-if="validSwatches.length"
            ref="swatchesRef"
            v-bind="
                getPartAttrs('swatches', {
                    class: 'rp-color-picker__swatches',
                    style: swatchesStyle,
                })
            "
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
                v-bind="getPartAttrs('swatch', { class: 'rp-color-picker__swatch' })"
                type="button"
                role="radio"
                :disabled="readonly"
                :tabindex="readonly ? -1 : getSwatchTabindex(index)"
                :aria-checked="isSwatchSelected(index)"
                :aria-label="`Select color ${swatch}`"
                :title="swatch"
                :data-selected="toPresenceAttribute(isSwatchSelected(index))"
                :data-readonly="toPresenceAttribute(readonly)"
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
import { computed } from 'vue';
import IconCheck from '~icons/lucide/check';
import { bem } from '@/utils/bem';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import ColorPickerSaturation from './color-picker-saturation.vue';
import ColorPickerSlider from './color-picker-slider.vue';
import type { ColorPickerPart, ColorPickerProps, ColorPickerValue } from './types';
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
const { getPartAttrs, getRootAttrs } = useStylesApi<ColorPickerPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-readonly': toPresenceAttribute(props.readonly),
    }),
);

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
