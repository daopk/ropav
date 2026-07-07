<template>
    <div :class="rootClass">
        <label v-if="hasLabel" :id="labelId" class="rp-field__label" :for="controlId">
            <slot name="label">{{ label }}</slot>
            <span v-if="required" class="rp-field__required" aria-hidden="true">*</span>
        </label>

        <div class="rp-field__control">
            <slot
                :id="controlId"
                :disabled="disabled || undefined"
                :required="required || undefined"
                :invalid="isInvalid || undefined"
                :labelledby="controlLabelledby"
                :describedby="controlDescribedby"
                :control-props="controlProps"
            />
        </div>

        <p v-if="hasDescription" :id="descriptionId" class="rp-field__description">
            <slot name="description">{{ description }}</slot>
        </p>

        <p
            v-if="hasMessage"
            :id="messageId"
            class="rp-field__message"
            :role="isInvalid ? 'alert' : undefined"
        >
            <slot name="message">{{ messageText }}</slot>
        </p>
    </div>
</template>

<script lang="ts" setup vapor>
import { useField } from './useField';
import type { FieldProps } from './types';

defineOptions({ name: 'RpField' });

const props = withDefaults(defineProps<FieldProps>(), {
    label: '',
    description: '',
    message: '',
    error: '',
    disabled: undefined,
    required: false,
    invalid: undefined,
});

const {
    controlId,
    labelId,
    descriptionId,
    messageId,
    isInvalid,
    messageText,
    hasLabel,
    hasDescription,
    hasMessage,
    controlLabelledby,
    controlDescribedby,
    rootClass,
    controlProps,
} = useField(props);
</script>

<style src="./field.scss" lang="scss" scoped></style>
