<template>
    <label
        :class="rootClass"
        :style="rootStyle"
        :data-disabled="isDisabled || undefined"
        :data-invalid="isInvalid || undefined"
        :data-state="isChecked ? 'checked' : 'unchecked'"
    >
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            type="radio"
            class="rp-radio__native"
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
        />
        <span class="rp-radio__dot" />
        <span v-if="$slots.default" class="rp-radio__label">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useRadio } from './useRadio';
import type { RadioProps } from './types';

defineOptions({ name: 'RpRadio' });

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

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};

    return {
        ...attrs,
        onChange(event) {
            onSelect(event);
            attrs.onChange?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./radio.scss" lang="scss" scoped></style>
