<template>
    <Popover
        :id="popoverId"
        :class="rootClass"
        :placement="placement"
        :open="open"
        :disabled="control.disabled || readonly"
        :aria-label="resolvedPickerAriaLabel"
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
                :readonly="readonly || undefined"
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
            </Input>
        </template>

        <template #content="slotProps">
            <ColorPicker
                :model-value="modelValue"
                :format="format"
                :size="size"
                :readonly="readonly"
                :swatches="swatches"
                :swatches-per-row="swatchesPerRow"
                :aria-label="resolvedPickerAriaLabel"
                @focusin="rememberClose(slotProps)"
                @keydown="onPickerKeydown($event, slotProps)"
                @update:model-value="onPickerUpdate"
            />
        </template>
    </Popover>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import ColorPicker from '../color-picker/color-picker.vue';
import { parseColorPickerValue } from '../color-picker/color-picker-utils';
import ColorSwatch from '../color-swatch/color-swatch.vue';
import Input from '../input/input.vue';
import Popover from '../popover/popover.vue';
import type { ColorPickerValue } from '../color-picker/types';
import type { PopoverContentSlotProps, PopoverSlotProps } from '../popover/types';
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
    placement: 'bottom-start',
    open: undefined,
    triggerAriaLabel: 'Choose color',
    validateColor: false,
    invalidColorMessage: 'Enter a valid color.',
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
        invalid: isInvalid.value,
        valid: control.valid && !isInvalid.value,
        readonly: props.readonly,
    }),
);

const parsedColor = computed(() => parseColorPickerValue(props.modelValue));
const previewColor = computed(() => (parsedColor.value ? props.modelValue : undefined));
const hasInvalidColor = computed(
    () => props.validateColor && props.modelValue.trim().length > 0 && !parsedColor.value,
);
const isInvalid = computed(() => control.invalid || hasInvalidColor.value);
const colorValidationMessage = computed(() =>
    hasInvalidColor.value ? props.invalidColorMessage : undefined,
);
const resolvedPickerAriaLabel = computed(() => props.pickerAriaLabel || props.triggerAriaLabel);
let closePicker: PopoverSlotProps['close'] | undefined;

function getInputTriggerAttrs(slotProps: unknown): InputHTMLAttributes {
    const popover = slotProps as PopoverSlotProps;
    const trigger = popover.triggerProps;
    const attrs = props.inputAttrs ?? {};

    if (!trigger['aria-haspopup']) return attrs;

    return {
        ...attrs,
        role: 'combobox',
        'aria-autocomplete': 'none',
        'aria-controls': trigger['aria-controls'],
        'aria-expanded': trigger['aria-expanded'],
        'aria-haspopup': trigger['aria-haspopup'],
        onFocusin(event) {
            rememberClose(popover);
            popover.open();
            attrs.onFocusin?.(event);
        },
        onClick(event) {
            rememberClose(popover);
            popover.open();
            attrs.onClick?.(event);
        },
        onKeydown(event) {
            onInputKeydown(event, popover);
            attrs.onKeydown?.(event);
        },
    };
}

function onInputKeydown(event: KeyboardEvent, popover: PopoverSlotProps) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        popover.open();
        return;
    }

    if (event.key === 'Escape') popover.triggerProps.onKeydown(event);
}

function rememberClose(slotProps: PopoverSlotProps | PopoverContentSlotProps) {
    closePicker = slotProps.close;
}

function onPickerKeydown(event: KeyboardEvent, popover: PopoverContentSlotProps) {
    if (event.key !== 'Escape') return;

    const pickerRoot = event.currentTarget;
    const focusTarget =
        pickerRoot instanceof Element
            ? pickerRoot
                  .closest('.rp-color-input')
                  ?.querySelector<HTMLInputElement>('.rp-input__native')
            : undefined;

    event.stopPropagation();
    focusTarget?.focus({ preventScroll: true });
    popover.close();
}

function onFocusOut(event: FocusEvent) {
    const root = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (root instanceof HTMLElement && nextTarget instanceof Node && root.contains(nextTarget)) {
        return;
    }

    closePicker?.();
}

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
</script>

<style src="./color-input.scss" lang="scss" scoped></style>
