<template>
    <label
        :class="rootClass"
        :style="rootStyle"
        :data-disabled="isDisabled || undefined"
        :data-state="isChecked ? 'checked' : 'unchecked'"
    >
        <input
            type="radio"
            class="rp-radio__native"
            :name="group.name"
            :value="value"
            :checked="isChecked"
            :disabled="isDisabled || undefined"
            :required="group.required || undefined"
            @change="onSelect"
        />
        <span class="rp-radio__dot" />
        <span v-if="$slots.default" class="rp-radio__label">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { useRadio } from './useRadio';
import type { RadioProps } from './types';

defineOptions({ name: 'RpRadio' });

const props = withDefaults(defineProps<RadioProps>(), {
    variant: undefined,
    color: undefined,
    autoContrast: undefined,
    size: undefined,
    disabled: false,
});

const { group, isChecked, isDisabled, rootClass, rootStyle, onSelect } = useRadio(props);
</script>

<style src="./radio.scss" lang="scss" scoped></style>
