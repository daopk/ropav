<template>
    <label
        :class="rootClass"
        :style="rootStyle"
        :data-disabled="control.disabled || undefined"
        :data-state="modelValue ? 'checked' : 'unchecked'"
    >
        <input
            :id="control.id"
            :name="name"
            type="checkbox"
            class="rp-switch__native"
            role="switch"
            :checked="modelValue"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            :aria-checked="modelValue"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
            @change="onChange"
        />
        <span class="rp-switch__track">
            <span class="rp-switch__thumb" />
        </span>
        <span v-if="$slots.default" class="rp-switch__label">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { useSwitch } from './useSwitch';
import type { SwitchProps } from './types';

defineOptions({ name: 'RpSwitch' });

const props = withDefaults(defineProps<SwitchProps>(), {
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const { control, rootClass, rootStyle, onChange } = useSwitch(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./switch.scss" lang="scss" scoped></style>
