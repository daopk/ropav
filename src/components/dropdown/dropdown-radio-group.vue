<template>
    <div class="rp-dropdown__radio-group" role="group">
        <slot />
    </div>
</template>

<script lang="ts" setup vapor>
import { provide } from 'vue';
import { dropdownRadioGroupKey } from './types';
import type { DropdownRadioGroupProps, DropdownRadioContext } from './types';

defineOptions({ name: 'RpDropdownRadioGroup' });

const props = withDefaults(defineProps<DropdownRadioGroupProps>(), {
    modelValue: '',
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

provide<DropdownRadioContext>(dropdownRadioGroupKey, {
    get modelValue() { return props.modelValue ?? ''; },
    select(value: string) {
        emit('update:modelValue', value);
    },
});
</script>

<style lang="scss" scoped>
.rp-dropdown__radio-group {
    display: contents;
}
</style>
