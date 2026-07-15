<template>
    <div v-bind="rootAttrs">
        <label
            v-if="hasLabel"
            :id="labelId"
            v-bind="getPartAttrs('label', { class: 'rp-field__label' })"
            :for="controlId"
            @mousedown="focusControl"
        >
            <slot name="label">{{ label }}</slot>
            <span
                v-if="required"
                v-bind="getPartAttrs('required', { class: 'rp-field__required' })"
                aria-hidden="true"
                >*</span
            >
        </label>

        <div v-bind="getPartAttrs('control', { class: 'rp-field__control' })">
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

        <p
            v-if="hasDescription"
            :id="descriptionId"
            v-bind="getPartAttrs('description', { class: 'rp-field__description' })"
        >
            <slot name="description">{{ description }}</slot>
        </p>

        <slot v-if="hasMessage" name="message" />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useField } from './useField';
import type { FieldPart, FieldProps } from './types';

defineOptions({ name: 'RpField', inheritAttrs: false });

const props = withDefaults(defineProps<FieldProps>(), {
    label: '',
    description: '',
    disabled: undefined,
    required: false,
    invalid: undefined,
});

const {
    controlId,
    labelId,
    descriptionId,
    isInvalid,
    hasLabel,
    hasDescription,
    hasMessage,
    controlLabelledby,
    controlDescribedby,
    rootClass,
    controlProps,
    focusControl,
} = useField(props);

const { getPartAttrs, getRootAttrs } = useStylesApi<FieldPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-disabled': presence(props.disabled),
        'data-invalid': presence(isInvalid.value),
    }),
);
</script>

<style src="./field.scss" lang="scss" scoped></style>
