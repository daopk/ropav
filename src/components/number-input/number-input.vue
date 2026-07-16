<template>
    <Input
        ref="inputComponentRef"
        v-bind="attrs"
        :id="control.id"
        :name="name"
        :form="control.form"
        :model-value="modelInputValue"
        type="number"
        :size="size"
        :radius="radius"
        :placeholder="placeholder"
        :disabled="control.disabled || undefined"
        :readonly="readonly || undefined"
        :required="control.required || undefined"
        :invalid="control.invalid || undefined"
        :valid="control.valid && !control.invalid ? true : undefined"
        :aria-label="ariaLabel"
        :describedby="describedby"
        :labelledby="labelledby"
        :input-attrs="nativeInputAttrs"
        :class-names="inputClassNames"
        :styles="inputStyles"
        :validation-message="validationMessage"
        @update:model-value="onInputUpdate"
    >
        <template v-if="leftControls.length" #left>
            <span class="rp-number-input__controls rp-number-input__controls--left">
                <button
                    v-for="controlType in leftControls"
                    :key="controlType"
                    type="button"
                    tabindex="-1"
                    v-bind="getControlAttrs(controlType)"
                    :aria-label="getControlLabel(controlType)"
                    :disabled="isControlDisabled(controlType)"
                    @mousedown.prevent
                    @click.stop="onControlClick($event, controlType)"
                >
                    <span class="rp-number-input__control-icon" aria-hidden="true">
                        <slot v-if="controlType === 'increment'" name="increment-icon">
                            <IconPlus />
                        </slot>
                        <slot v-else name="decrement-icon"><IconMinus /></slot>
                    </span>
                </button>
            </span>
        </template>
        <template v-if="rightControls.length" #right>
            <span class="rp-number-input__controls rp-number-input__controls--right">
                <button
                    v-for="controlType in rightControls"
                    :key="controlType"
                    type="button"
                    tabindex="-1"
                    v-bind="getControlAttrs(controlType)"
                    :aria-label="getControlLabel(controlType)"
                    :disabled="isControlDisabled(controlType)"
                    @mousedown.prevent
                    @click.stop="onControlClick($event, controlType)"
                >
                    <span class="rp-number-input__control-icon" aria-hidden="true">
                        <slot v-if="controlType === 'increment'" name="increment-icon">
                            <IconPlus />
                        </slot>
                        <slot v-else name="decrement-icon"><IconMinus /></slot>
                    </span>
                </button>
            </span>
        </template>
    </Input>
</template>

<script lang="ts" setup vapor>
import { computed, provide, ref } from 'vue';
import IconMinus from '~icons/lucide/minus';
import IconPlus from '~icons/lucide/plus';
import { useControllableValue } from '@/composables/useControllableValue';
import { nestedFormControlOwnerKey, useFormControl } from '@/composables/useFormControl';
import { presence, useStylesApi } from '@/styles-api';
import Input from '../input/input.vue';
import type { NumberInputPart, NumberInputProps, NumberInputValue } from './types';
import {
    getModelInputValue,
    parseNumberInputValue,
    useNumberInput,
    type NumberInputControl,
} from './useNumberInput';

defineOptions({ name: 'RpNumberInput', inheritAttrs: false });

const props = withDefaults(defineProps<NumberInputProps>(), {
    modelValue: undefined,
    defaultValue: null,
    step: 1,
    placeholder: '',
    controls: true,
    controlsPosition: 'right',
    textAlign: 'left',
    clampOnBlur: true,
    disabled: undefined,
    readonly: false,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    incrementLabel: 'Increment value',
    decrementLabel: 'Decrement value',
});

const emit = defineEmits<{
    'update:modelValue': [value: NumberInputValue];
}>();

const controllable = useControllableValue<NumberInputValue>({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const inputComponentRef = ref<{ nativeElement: HTMLInputElement | null } | null>(null);
let nestedFormControlClaimed = false;
provide(nestedFormControlOwnerKey, () => {
    if (nestedFormControlClaimed) return false;
    nestedFormControlClaimed = true;
    return true;
});

const {
    control,
    rootClass,
    nativeInputAttrs,
    modelInputValue,
    leftControls,
    rightControls,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    onInputUpdate,
} = useNumberInput(
    props,
    (value) => controllable.setValue(value),
    () => controllable.value.value,
);

useFormControl({
    elements: () => [inputComponentRef.value?.nativeElement],
    isControlled: () => controllable.isControlled.value,
    initializeDefault(element) {
        (element as HTMLInputElement).defaultValue = getModelInputValue(controllable.initialValue);
    },
    validationMessage: () => props.validationMessage,
    readResetValue(elements) {
        controllable.resetValue(parseNumberInputValue((elements[0] as HTMLInputElement).value));
    },
    syncControlledValue(elements) {
        (elements[0] as HTMLInputElement).value = getModelInputValue(controllable.value.value);
    },
});

const { attrs, getPartAttrs } = useStylesApi<NumberInputPart>(props, 'root');
const inputClassNames = computed(() => ({
    root: [rootClass.value, props.classNames?.root],
    input: props.classNames?.input,
}));
const inputStyles = computed(() => ({
    root: props.styles?.root,
    input: props.styles?.input,
}));

function getControlAttrs(controlType: NumberInputControl) {
    return {
        ...getPartAttrs('control', {
            class: ['rp-number-input__control', `rp-number-input__control--${controlType}`],
        }),
        'data-control': controlType,
        'data-disabled': presence(isControlDisabled(controlType)),
    };
}

function focusNativeInput(event: MouseEvent) {
    const target = event.currentTarget;
    if (!(target instanceof Element)) return;

    target.closest('.rp-number-input')?.querySelector<HTMLInputElement>('input')?.focus();
}

function getControlLabel(controlType: NumberInputControl) {
    return controlType === 'increment' ? props.incrementLabel : props.decrementLabel;
}

function isControlDisabled(controlType: NumberInputControl) {
    return controlType === 'increment' ? !canIncrement.value : !canDecrement.value;
}

function onControlClick(event: MouseEvent, controlType: NumberInputControl) {
    const didUpdate = controlType === 'increment' ? increment() : decrement();
    if (didUpdate) focusNativeInput(event);
}
</script>

<style src="./number-input.scss" lang="scss" scoped></style>
