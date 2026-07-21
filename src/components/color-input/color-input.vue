<template>
    <Popover
        v-bind="rootAttrs"
        :id="popoverId"
        :class-names="popoverClassNames"
        :styles="popoverStyles"
        :placement="placement"
        :open="open"
        :keep-mounted="keepMounted"
        :disabled="popoverDisabled"
        :aria-label="pickerAriaLabel"
        :content-class="`rp-color-input__popover rp-color-input__popover--size-${size ?? 'md'}`"
        @update:open="onOpenUpdate"
    >
        <template #default="slotProps">
            <Input
                ref="inputComponentRef"
                :id="control.id"
                :name="name"
                :form="control.form"
                :model-value="controllable.value.value"
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
                :class-names="inputClassNames"
                :styles="inputStyles"
                :validation-message="effectiveValidationMessage"
                @update:model-value="onInputUpdate"
            >
                <template #left>
                    <slot name="left" :color="previewColor" :empty="!previewColor">
                        <ColorSwatch
                            v-if="previewColor"
                            :class-names="previewClassNames"
                            :styles="previewStyles"
                            :color="previewColor"
                            size="var(--_rp-color-input-preview-size)"
                            aria-hidden="true"
                        />
                        <span
                            v-else
                            v-bind="
                                getPartAttrs('preview', {
                                    class: [
                                        'rp-color-input__preview',
                                        'rp-color-input__preview--empty',
                                    ],
                                })
                            "
                            aria-hidden="true"
                        />
                    </slot>
                </template>
                <template v-if="showEyeDropper" #right>
                    <button
                        v-bind="
                            getPartAttrs('eyeDropper', { class: 'rp-color-input__eye-dropper' })
                        "
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
                :model-value="controllable.value.value"
                :format="format"
                :size="size"
                :readonly="readonly"
                :with-picker="!swatchesOnly"
                :swatches="swatches"
                :swatches-per-row="swatchesPerRow"
                :aria-label="pickerAriaLabel"
                :class-names="pickerClassNames"
                :styles="pickerStyles"
                @focusin="rememberClose(slotProps)"
                @keydown="onPickerKeydown($event, slotProps)"
                @update:model-value="onPickerUpdate"
            />
        </template>
    </Popover>
</template>

<script lang="ts" setup vapor>
import { computed, ref } from 'vue';
import IconCrosshair from '~icons/lucide/crosshair';
import { useControllableValue } from '@/composables/useControllableValue';
import { provideNestedFormControlOwner, useTextFormControl } from '@/internal/composables/useFormControl';
import { presence, useStylesApi } from '@/styles-api';
import ColorPicker from '../color-picker/color-picker.vue';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import Input from '../input/input.vue';
import Popover from '../popover/popover.vue';
import type { ColorPickerValue } from '../color-picker/types';
import type { ColorInputPart, ColorInputProps } from './types';
import { useColorInput } from './useColorInput';

defineOptions({ name: 'RpColorInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorInputProps>(), {
    modelValue: undefined,
    defaultValue: '',
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
    keepMounted: false,
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

const controllable = useControllableValue<ColorPickerValue>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const inputComponentRef = ref<{ nativeElement: HTMLInputElement | null } | null>(null);
provideNestedFormControlOwner();

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
} = useColorInput(
    props,
    {
        modelValue: (value) => controllable.setValue(value),
        open: (value) => emit('update:open', value),
    },
    () => controllable.value.value,
);
const effectiveValidationMessage = computed(() =>
    props.validationMessage !== undefined ? props.validationMessage : colorValidationMessage.value,
);

useTextFormControl(
    () => inputComponentRef.value?.nativeElement,
    controllable,
    () => effectiveValidationMessage.value,
);

const { getPartAttrs, getRootAttrs } = useStylesApi<ColorInputPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        'data-disabled': presence(control.disabled),
        'data-readonly': presence(props.readonly),
        'data-invalid': presence(isInvalid.value),
        onFocusout: onFocusOut,
    }),
);
const popoverClassNames = computed(() => ({
    root: rootClass.value,
    content: props.classNames?.content,
}));
const popoverStyles = computed(() => ({ content: props.styles?.content }));
const inputClassNames = computed(() => ({
    root: props.classNames?.control,
    input: props.classNames?.input,
}));
const inputStyles = computed(() => ({
    root: props.styles?.control,
    input: props.styles?.input,
}));
const previewClassNames = computed(() => ({
    root: ['rp-color-input__preview', props.classNames?.preview],
}));
const previewStyles = computed(() => ({ root: props.styles?.preview }));
const pickerClassNames = computed(() => ({
    root: props.classNames?.picker,
    control: props.classNames?.pickerControl,
    handle: props.classNames?.pickerHandle,
    swatches: props.classNames?.pickerSwatches,
    swatch: props.classNames?.pickerSwatch,
}));
const pickerStyles = computed(() => ({
    root: props.styles?.picker,
    control: props.styles?.pickerControl,
    handle: props.styles?.pickerHandle,
    swatches: props.styles?.pickerSwatches,
    swatch: props.styles?.pickerSwatch,
}));
</script>

<style src="./color-input.scss" lang="scss" scoped></style>
