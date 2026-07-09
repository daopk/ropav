<template>
    <Popover
        :id="popoverId"
        :class="rootClass"
        :placement="placement"
        :open="open"
        :disabled="control.disabled"
        :aria-label="resolvedPickerAriaLabel"
        @update:open="onOpenUpdate"
    >
        <template #default="slotProps">
            <Input
                :id="control.id"
                :name="name"
                :model-value="modelValue"
                type="text"
                :size="size"
                :radius="radius"
                :placeholder="placeholder"
                :disabled="control.disabled || undefined"
                :readonly="readonly || undefined"
                :required="control.required || undefined"
                :invalid="control.invalid || undefined"
                :valid="control.valid || undefined"
                :aria-label="ariaLabel"
                :describedby="describedby"
                :labelledby="labelledby"
                @update:model-value="onInputUpdate"
            >
                <template #left>
                    <ColorSwatch
                        v-if="previewColor"
                        class="rp-color-input__preview"
                        :color="previewColor"
                        size="var(--_rp-color-input-preview-size)"
                        aria-hidden="true"
                    />
                    <span
                        v-else
                        class="rp-color-input__preview rp-color-input__preview--empty"
                        aria-hidden="true"
                    />
                </template>

                <template #right>
                    <button
                        v-bind="getTriggerProps(slotProps)"
                        class="rp-color-input__trigger"
                        type="button"
                        :disabled="control.disabled || undefined"
                        :aria-label="resolvedTriggerAriaLabel"
                        :title="resolvedTriggerAriaLabel"
                        :data-state="slotProps.isOpen ? 'open' : 'closed'"
                    >
                        <IconPalette class="rp-color-input__trigger-icon" aria-hidden="true" />
                    </button>
                </template>
            </Input>
        </template>

        <template #content>
            <ColorPicker
                :model-value="modelValue"
                :format="format"
                :readonly="readonly"
                :swatches="swatches"
                :swatches-per-row="swatchesPerRow"
                :aria-label="resolvedPickerAriaLabel"
                @update:model-value="onPickerUpdate"
            />
        </template>
    </Popover>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconPalette from '~icons/lucide/palette';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import ColorPicker from '../color-picker/color-picker.vue';
import { parseColorPickerValue } from '../color-picker/color-picker-utils';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import Input from '../input/input.vue';
import Popover from '../popover/popover.vue';
import type { ColorPickerValue } from '../color-picker/types';
import type { PopoverSlotProps } from '../popover/types';
import type { ColorInputProps } from './types';

defineOptions({ name: 'RpColorInput' });

const props = withDefaults(defineProps<ColorInputProps>(), {
    format: 'hex',
    placeholder: '',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    readonly: false,
    placement: 'bottom',
    open: undefined,
    triggerAriaLabel: 'Choose color',
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerValue];
    'update:open': [value: boolean];
}>();

const control = useControlState(props);

const rootClass = computed(() =>
    bem('rp-color-input', {
        [`size-${props.size}`]: Boolean(props.size),
        [`radius-${props.radius}`]: Boolean(props.radius),
        disabled: control.disabled,
        invalid: control.invalid,
        valid: control.valid && !control.invalid,
        readonly: props.readonly,
    }),
);

const previewColor = computed(() =>
    parseColorPickerValue(props.modelValue) ? props.modelValue : undefined,
);
const resolvedTriggerAriaLabel = computed(() => props.triggerAriaLabel);
const resolvedPickerAriaLabel = computed(() => props.pickerAriaLabel || props.triggerAriaLabel);

function onInputUpdate(value: ColorPickerValue) {
    emit('update:modelValue', value);
}

function onPickerUpdate(value: ColorPickerValue) {
    if (control.disabled || props.readonly) return;
    emit('update:modelValue', value);
}

function onOpenUpdate(value: boolean) {
    emit('update:open', value);
}

function getTriggerProps(slotProps: unknown) {
    return (slotProps as PopoverSlotProps).triggerProps;
}
</script>

<style src="./color-input.scss" lang="scss" scoped></style>
