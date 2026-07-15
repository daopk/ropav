<template>
    <label v-bind="rootAttrs">
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            type="radio"
            :name="name"
            :value="value"
            :checked="isChecked"
            :disabled="isDisabled || undefined"
            :required="isRequired || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="isInvalid || undefined"
            :aria-required="isRequired || undefined"
            :data-disabled="presence(isDisabled)"
            :data-invalid="presence(isInvalid)"
            :data-state="isChecked ? 'checked' : 'unchecked'"
        />
        <span v-bind="getPartAttrs('indicator', { class: 'rp-radio__dot' })" />
        <span v-if="$slots.default" v-bind="getPartAttrs('label', { class: 'rp-radio__label' })">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useRadio } from './useRadio';
import type { RadioPart, RadioProps } from './types';

defineOptions({ name: 'RpRadio', inheritAttrs: false });

const props = withDefaults(defineProps<RadioProps>(), {
    variant: undefined,
    color: undefined,
    autoContrast: undefined,
    size: undefined,
    checked: undefined,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    change: [event: Event];
}>();

const {
    inputRef,
    control,
    name,
    isChecked,
    isDisabled,
    isRequired,
    isInvalid,
    rootClass,
    rootStyle,
    onSelect,
    focus,
} = useRadio(props, (event) => emit('change', event));

const { getPartAttrs, getRootAttrs } = useStylesApi<RadioPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        'data-disabled': presence(isDisabled.value),
        'data-invalid': presence(isInvalid.value),
        'data-state': isChecked.value ? 'checked' : 'unchecked',
    }),
);

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        onChange: compatibilityOnChange,
        ...attrs
    } = props.inputAttrs ?? {};

    return {
        ...attrs,
        ...getPartAttrs('input', {
            class: 'rp-radio__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        onChange(event) {
            onSelect(event);
            compatibilityOnChange?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./radio.scss" lang="scss" scoped></style>
