import { computed, useId } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { useGroupedRadioChoiceTransaction } from '@/internal/composables/useGroupedRadioChoiceTransaction';
import { bem } from '@/utils/bem';
import { getComponentCheckedColorStyle } from '@/utils/componentColors';
import type { SegmentedControlOption, SegmentedControlProps, SegmentedControlValue } from './types';

export function useSegmentedControl(
    props: Readonly<SegmentedControlProps>,
    emitUpdate: (value: SegmentedControlValue) => void,
) {
    const control = useControlState(props);
    const generatedId = useId();
    const baseId = computed(() => props.id ?? generatedId);
    const groupName = computed(() => props.name ?? `${baseId.value}-segmented-control`);
    const transaction = useGroupedRadioChoiceTransaction<SegmentedControlValue>({
        choices: () => props.options,
        disabled: () => control.disabled,
        validationMessage: () => props.validationMessage,
        value: {
            modelValue: () => props.modelValue,
            defaultValue: () => props.defaultValue,
            onChange(value) {
                if (value !== null) emitUpdate(value);
            },
        },
    });
    const inputRefs = transaction.inputRefs;
    const selectedValue = transaction.value;

    const rootClass = computed(() =>
        bem('rp-segmented-control', {
            [`size-${props.size ?? 'md'}`]: true,
            [`radius-${props.radius ?? 'sm'}`]: true,
            [props.orientation ?? 'horizontal']: true,
            'full-width': props.fullWidth,
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );
    const rootStyle = computed(() =>
        getComponentCheckedColorStyle({
            color: props.color,
            autoContrast: props.autoContrast,
            contrastColor: props.contrastColor,
            colorProperty: '--_rp-segmented-control-color',
            checkedColorProperty: '--_rp-segmented-control-on-color',
        }),
    );

    function isSelected(option: SegmentedControlOption) {
        return option.value === selectedValue.value;
    }

    function isOptionDisabled(option: SegmentedControlOption) {
        return control.disabled || Boolean(option.disabled);
    }

    function selectOption(option: SegmentedControlOption) {
        if (isOptionDisabled(option)) return;
        transaction.acceptValue(option.value);
    }

    function getInputId(index: number) {
        return `${baseId.value}-option-${index}`;
    }

    function focus(options?: FocusOptions) {
        const selectedInput = inputRefs.value.find((input) => input?.checked && !input.disabled);
        const firstEnabledInput = inputRefs.value.find((input) => input && !input.disabled);
        (selectedInput ?? firstEnabledInput)?.focus(options);
    }

    return {
        control,
        inputRefs,
        selectedValue,
        rootClass,
        rootStyle,
        groupName,
        createInputRef: transaction.createInputRef,
        isSelected,
        isOptionDisabled,
        selectOption,
        getInputId,
        focus,
    };
}
