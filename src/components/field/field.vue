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
import { computed, useId, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import type { FieldControlProps, FieldProps } from './types';

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

const slots = useSlots();
const generatedId = useId();

const controlId = computed(() => props.id ?? `${generatedId}-control`);
const labelId = computed(() => `${controlId.value}-label`);
const descriptionId = computed(() => `${controlId.value}-description`);
const messageId = computed(() => `${controlId.value}-message`);

const isInvalid = computed(() => Boolean(props.invalid || props.error));
const messageText = computed(() => props.error || props.message);

const hasLabel = computed(() => Boolean(props.label || slots.label));
const hasDescription = computed(() => Boolean(props.description || slots.description));
const hasMessage = computed(() => Boolean(messageText.value || slots.message));

const controlLabelledby = computed(() => (hasLabel.value ? labelId.value : undefined));
const controlDescribedby = computed(
    () =>
        [
            hasDescription.value ? descriptionId.value : undefined,
            hasMessage.value ? messageId.value : undefined,
        ]
            .filter(Boolean)
            .join(' ') || undefined,
);

const rootClass = computed(() =>
    bem('rp-field', {
        disabled: props.disabled,
        required: props.required,
        invalid: isInvalid.value,
    }),
);

const controlProps = computed<FieldControlProps>(() => ({
    id: controlId.value,
    disabled: props.disabled || undefined,
    required: props.required || undefined,
    invalid: isInvalid.value || undefined,
    labelledby: controlLabelledby.value,
    describedby: controlDescribedby.value,
}));
</script>

<style src="./field.scss" lang="scss" scoped></style>
