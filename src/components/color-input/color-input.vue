<template>
    <Popover
        :id="popoverId"
        :class="rootClass"
        :placement="placement"
        :open="open"
        :disabled="popoverDisabled"
        :aria-label="pickerAriaLabel"
        @focusout="onFocusOut"
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
                :readonly="readonly || disallowInput || swatchesOnly || undefined"
                :required="control.required || undefined"
                :invalid="isInvalid || undefined"
                :valid="control.valid && !isInvalid ? true : undefined"
                :aria-label="ariaLabel"
                :describedby="describedby"
                :labelledby="labelledby"
                :input-attrs="getInputTriggerAttrs(slotProps)"
                :validation-message="colorValidationMessage"
                @update:model-value="onInputUpdate"
            >
                <template #left>
                    <slot name="left" :color="previewColor" :empty="!previewColor">
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
                    </slot>
                </template>
                <template v-if="showEyeDropper" #right>
                    <button
                        class="rp-color-input__eye-dropper"
                        type="button"
                        :disabled="control.disabled || readonly || isPickingColor"
                        :aria-label="eyeDropperAriaLabel"
                        :aria-busy="isPickingColor || undefined"
                        @click.stop="pickScreenColor(slotProps.close)"
                    >
                        <span class="rp-color-input__eye-dropper-icon" aria-hidden="true">
                            <slot name="eye-dropper-icon">
                                <IconCrosshair />
                            </slot>
                        </span>
                    </button>
                </template>
            </Input>
        </template>

        <template #content="slotProps">
            <ColorPicker
                :model-value="modelValue"
                :format="format"
                :size="size"
                :readonly="readonly"
                :with-picker="!swatchesOnly"
                :swatches="swatches"
                :swatches-per-row="swatchesPerRow"
                :aria-label="pickerAriaLabel"
                @focusin="rememberClose(slotProps)"
                @keydown="onPickerKeydown($event, slotProps)"
                @update:model-value="onPickerUpdate"
            />
        </template>
    </Popover>
</template>

<script lang="ts" setup vapor>
import IconCrosshair from '~icons/lucide/crosshair';
import ColorPicker from '../color-picker/color-picker.vue';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import Input from '../input/input.vue';
import Popover from '../popover/popover.vue';
import type { ColorPickerValue } from '../color-picker/types';
import type { ColorInputProps } from './types';
import { useColorInput } from './useColorInput';

defineOptions({ name: 'RpColorInput' });

const props = withDefaults(defineProps<ColorInputProps>(), {
    format: 'hex',
    placeholder: '',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    readonly: false,
    disallowInput: false,
    swatchesOnly: false,
    placement: 'bottom-start',
    open: undefined,
    pickerAriaLabel: 'Choose color',
    validateColor: false,
    invalidColorMessage: 'Enter a valid color.',
    withEyeDropper: true,
    eyeDropperAriaLabel: 'Pick color from screen',
});

const emit = defineEmits<{
    'update:modelValue': [value: ColorPickerValue];
    'update:open': [value: boolean];
}>();

const {
    control,
    rootClass,
    previewColor,
    isInvalid,
    colorValidationMessage,
    popoverDisabled,
    getInputTriggerAttrs,
    rememberClose,
    onPickerKeydown,
    onFocusOut,
    showEyeDropper,
    isPickingColor,
    pickScreenColor,
    onInputUpdate,
    onPickerUpdate,
    onOpenUpdate,
} = useColorInput(props, {
    modelValue: (value) => emit('update:modelValue', value),
    open: (value) => emit('update:open', value),
});
</script>

<style src="./color-input.scss" lang="scss" scoped></style>
