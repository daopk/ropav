<template>
    <div v-bind="rootAttrs">
        <label
            v-for="(option, index) in options"
            :key="option.value"
            v-bind="getControlAttrs(option)"
        >
            <input
                v-bind="getInputAttrs(option)"
                :id="getInputId(index)"
                :ref="createInputRef(option.value)"
                type="radio"
                :name="groupName"
                :form="control.form ?? inputAttrs?.form"
                :value="String(option.value)"
                :checked="isSelected(option)"
                :disabled="isOptionDisabled(option) || undefined"
                :required="control.required || undefined"
                :aria-describedby="control.ariaDescribedby"
                :aria-invalid="control.invalid || undefined"
                :aria-required="control.required || undefined"
                :data-state="isSelected(option) ? 'checked' : 'unchecked'"
                :data-disabled="toPresenceAttribute(isOptionDisabled(option))"
                :data-invalid="toPresenceAttribute(control.invalid)"
            />
            <span
                v-bind="
                    getPartAttrs('indicator', {
                        class: 'rp-segmented-control__indicator',
                    })
                "
                aria-hidden="true"
                :data-state="isSelected(option) ? 'checked' : 'unchecked'"
            />
            <span
                v-bind="
                    getPartAttrs('label', {
                        class: 'rp-segmented-control__label',
                    })
                "
            >
                <slot
                    name="option"
                    :option="option"
                    :selected="isSelected(option)"
                    :disabled="isOptionDisabled(option)"
                >
                    {{ option.label }}
                </slot>
            </span>
        </label>
    </div>
</template>

<script setup lang="ts" vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import type {
    SegmentedControlOption,
    SegmentedControlOptionSlotProps,
    SegmentedControlPart,
    SegmentedControlProps,
    SegmentedControlValue,
} from './types';
import { useSegmentedControl } from './useSegmentedControl';

defineOptions({ name: 'RpSegmentedControl', inheritAttrs: false });

const props = withDefaults(defineProps<SegmentedControlProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    options: () => [],
    autoContrast: true,
    size: 'md',
    radius: 'sm',
    orientation: 'horizontal',
    fullWidth: false,
    disabled: false,
    required: false,
    invalid: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: SegmentedControlValue];
}>();

defineSlots<{
    option?(props: SegmentedControlOptionSlotProps): unknown;
}>();

const {
    control,
    inputRefs,
    selectedValue,
    rootClass,
    rootStyle,
    groupName,
    createInputRef,
    isSelected,
    isOptionDisabled,
    selectOption,
    getInputId,
    focus,
} = useSegmentedControl(props, (value) => emit('update:modelValue', value));
const { getPartAttrs, getRootAttrs } = useStylesApi<SegmentedControlPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        id: control.id,
        class: rootClass.value,
        style: rootStyle.value,
        role: 'radiogroup',
        'data-value': selectedValue.value ?? undefined,
        'data-size': props.size,
        'data-orientation': props.orientation,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-orientation': props.orientation,
        'aria-disabled': control.disabled || undefined,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
    }),
);

function getControlAttrs(option: SegmentedControlOption) {
    const selected = isSelected(option);
    const disabled = isOptionDisabled(option);

    return {
        ...getPartAttrs('control', {
            class: [
                'rp-segmented-control__control',
                {
                    'rp-segmented-control__control--selected': selected,
                    'rp-segmented-control__control--disabled': disabled,
                },
            ],
        }),
        'data-state': selected ? 'checked' : 'unchecked',
        'data-disabled': toPresenceAttribute(disabled),
    };
}

function getInputAttrs(option: SegmentedControlOption): InputHTMLAttributes {
    const attributes = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attributes);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-segmented-control__input',
            compatibilityClass,
            compatibilityStyle,
        }),
        onChange: composeEventHandlers(() => selectOption(option), attributes.onChange),
    };
}

defineExpose({
    nativeElements: inputRefs,
    focus,
});
</script>

<style src="./segmented-control.scss" lang="scss" scoped></style>
