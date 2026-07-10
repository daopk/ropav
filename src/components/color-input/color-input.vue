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
                :invalid="control.invalid || undefined"
                :valid="control.valid || undefined"
                :aria-label="ariaLabel"
                :describedby="describedby"
                :labelledby="labelledby"
                :input-attrs="getInputTriggerAttrs(slotProps)"
                @click="slotProps.open"
                @focusin="onInputFocus($event, slotProps)"
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
import { computed, nextTick, type InputHTMLAttributes } from 'vue';
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
const resolvedPickerAriaLabel = computed(() => props.pickerAriaLabel || props.triggerAriaLabel);
let closePicker: PopoverSlotProps['close'] | undefined;
let inputElement: HTMLInputElement | undefined;
let suppressNextFocusOpen = false;

function onInputFocus(event: FocusEvent, slotProps: unknown) {
    const popover = slotProps as PopoverSlotProps;

    if (event.target instanceof HTMLInputElement) inputElement = event.target;
    rememberClose(popover);

    if (suppressNextFocusOpen) {
        suppressNextFocusOpen = false;
        return;
    }

    popover.open();
}

function getInputTriggerAttrs(slotProps: unknown): InputHTMLAttributes {
    const popover = slotProps as PopoverSlotProps;
    const trigger = popover.triggerProps;

    if (!trigger['aria-haspopup']) return {};

    return {
        role: 'combobox',
        'aria-autocomplete': 'none',
        'aria-controls': trigger['aria-controls'],
        'aria-expanded': trigger['aria-expanded'],
        'aria-haspopup': trigger['aria-haspopup'],
        onKeydown: (event) => onInputKeydown(event, popover),
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
        inputElement ??
        (pickerRoot instanceof Element
            ? pickerRoot
                  .closest('.rp-color-input')
                  ?.querySelector<HTMLInputElement>('.rp-input__native')
            : undefined);

    event.stopPropagation();
    suppressNextFocusOpen = true;
    popover.close();

    void nextTick(() => {
        if (!focusTarget) {
            suppressNextFocusOpen = false;
            return;
        }

        inputElement = focusTarget;
        focusTarget.focus({ preventScroll: true });
    });
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
