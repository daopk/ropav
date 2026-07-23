<template>
    <label v-bind="rootAttrs">
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            type="radio"
            :name="name"
            :form="form ?? nativeInputAttrs.form"
            :value="value"
            :checked="isChecked"
            :disabled="isDisabled || undefined"
            :required="isRequired || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="isInvalid || undefined"
            :aria-required="isRequired || undefined"
            :data-disabled="toPresenceAttribute(isDisabled)"
            :data-invalid="toPresenceAttribute(isInvalid)"
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
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
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
    form,
    groupInputAttrs,
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
        'data-disabled': toPresenceAttribute(isDisabled.value),
        'data-invalid': toPresenceAttribute(isInvalid.value),
        'data-state': isChecked.value ? 'checked' : 'unchecked',
    }),
);

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const groupAttrs = groupInputAttrs.value ?? {};
    const itemAttrs = props.inputAttrs ?? {};
    const {
        compatibilityClass: groupClass,
        compatibilityStyle: groupStyle,
        forwardedAttributes: groupForwardedAttributes,
    } = splitCompatibilityAttributes(groupAttrs);
    const {
        compatibilityClass: itemClass,
        compatibilityStyle: itemStyle,
        forwardedAttributes: itemForwardedAttributes,
    } = splitCompatibilityAttributes(itemAttrs);

    return {
        ...groupForwardedAttributes,
        ...itemForwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-radio__native',
            compatibilityClass: [groupClass, itemClass],
            compatibilityStyle: [groupStyle, itemStyle],
        }),
        onChange: composeEventHandlers(onSelect, groupAttrs.onChange, itemAttrs.onChange),
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./radio.scss" lang="scss" scoped></style>
