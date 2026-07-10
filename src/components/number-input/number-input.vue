<template>
    <Input
        :class="rootClass"
        :id="control.id"
        :name="name"
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
        :validation-message="validationMessage"
        @update:model-value="onInputUpdate"
    >
        <template v-if="controls" #right>
            <span class="rp-number-input__controls">
                <button
                    type="button"
                    tabindex="-1"
                    class="rp-number-input__control rp-number-input__control--increment"
                    :aria-label="incrementLabel"
                    :disabled="!canIncrement"
                    @mousedown.prevent
                    @click.stop="onIncrement"
                >
                    <span class="rp-number-input__control-icon" aria-hidden="true">
                        <slot name="increment-icon"><IconChevronUp /></slot>
                    </span>
                </button>
                <button
                    type="button"
                    tabindex="-1"
                    class="rp-number-input__control rp-number-input__control--decrement"
                    :aria-label="decrementLabel"
                    :disabled="!canDecrement"
                    @mousedown.prevent
                    @click.stop="onDecrement"
                >
                    <span class="rp-number-input__control-icon" aria-hidden="true">
                        <slot name="decrement-icon"><IconChevronDown /></slot>
                    </span>
                </button>
            </span>
        </template>
    </Input>
</template>

<script lang="ts" setup vapor>
import IconChevronDown from '~icons/lucide/chevron-down';
import IconChevronUp from '~icons/lucide/chevron-up';
import Input from '../input/input.vue';
import type { NumberInputProps, NumberInputValue } from './types';
import { useNumberInput } from './useNumberInput';

defineOptions({ name: 'RpNumberInput' });

const props = withDefaults(defineProps<NumberInputProps>(), {
    step: 1,
    placeholder: '',
    controls: true,
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

const {
    control,
    rootClass,
    nativeInputAttrs,
    modelInputValue,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    onInputUpdate,
} = useNumberInput(props, (value) => emit('update:modelValue', value));

function focusNativeInput(event: MouseEvent) {
    const target = event.currentTarget;
    if (!(target instanceof Element)) return;

    target.closest('.rp-number-input')?.querySelector<HTMLInputElement>('input')?.focus();
}

function onIncrement(event: MouseEvent) {
    if (increment()) focusNativeInput(event);
}

function onDecrement(event: MouseEvent) {
    if (decrement()) focusNativeInput(event);
}
</script>

<style src="./number-input.scss" lang="scss" scoped></style>
