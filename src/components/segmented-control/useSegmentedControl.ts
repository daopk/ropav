import { computed, nextTick, shallowRef, useId, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { getComponentCheckedColorStyle } from '@/utils/componentColors';
import type { SegmentedControlOption, SegmentedControlProps, SegmentedControlValue } from './types';

function getFirstEnabledValue(options: readonly SegmentedControlOption[] | undefined) {
    return options?.find((option) => !option.disabled)?.value ?? null;
}

function findInputOption(
    inputRefs: readonly (HTMLInputElement | null)[],
    options: readonly SegmentedControlOption[] | undefined,
    input: HTMLInputElement,
) {
    const index = inputRefs.indexOf(input);
    return index < 0 ? undefined : options?.[index];
}

export function useSegmentedControl(
    props: Readonly<SegmentedControlProps>,
    emitUpdate: (value: SegmentedControlValue) => void,
) {
    const inputsByValue = shallowRef(new Map<SegmentedControlValue, HTMLInputElement>());
    const inputRefs = computed(
        () => props.options?.map((option) => inputsByValue.value.get(option.value) ?? null) ?? [],
    );
    const control = useControlState(props);
    const generatedId = useId();
    const baseId = computed(() => props.id ?? generatedId);
    const groupName = computed(() => props.name ?? `${baseId.value}-segmented-control`);
    const hasExplicitEmptyDefault = props.defaultValue === null;
    const controllable = useControllableValue<SegmentedControlValue | null>({
        modelValue: () => props.modelValue,
        defaultValue: () =>
            props.defaultValue === undefined
                ? getFirstEnabledValue(props.options)
                : props.defaultValue,
        onChange(value) {
            if (value !== null) emitUpdate(value);
        },
    });
    const selectedValue = controllable.value;

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

    function createInputRef(value: SegmentedControlValue) {
        let mountedInput: HTMLInputElement | null = null;

        return (element: unknown) => {
            const input = element instanceof HTMLInputElement ? element : null;

            if (input) {
                mountedInput = input;
                const existingInput = inputsByValue.value.get(value);
                const hasOtherRegistration = [...inputsByValue.value].some(
                    ([registeredValue, registeredInput]) =>
                        registeredValue !== value && registeredInput === input,
                );
                if (existingInput === input && !hasOtherRegistration) return;

                const nextInputs = new Map(inputsByValue.value);
                for (const [registeredValue, registeredInput] of nextInputs) {
                    if (registeredInput === input) nextInputs.delete(registeredValue);
                }
                nextInputs.set(value, input);
                inputsByValue.value = nextInputs;
                return;
            }

            const removedInput = mountedInput;
            mountedInput = null;
            if (!removedInput || inputsByValue.value.get(value) !== removedInput) return;

            const nextInputs = new Map(inputsByValue.value);
            nextInputs.delete(value);
            inputsByValue.value = nextInputs;
        };
    }

    function syncNativeValue() {
        for (const [index, input] of inputRefs.value.entries()) {
            if (input) input.checked = props.options?.[index]?.value === selectedValue.value;
        }
    }

    function selectOption(option: SegmentedControlOption) {
        if (isOptionDisabled(option)) return;
        controllable.setValue(option.value);

        void nextTick(() => {
            syncNativeValue();
        });
    }

    function getInputId(index: number) {
        return `${baseId.value}-option-${index}`;
    }

    function focus(options?: FocusOptions) {
        const selectedInput = inputRefs.value.find((input) => input?.checked && !input.disabled);
        const firstEnabledInput = inputRefs.value.find((input) => input && !input.disabled);
        (selectedInput ?? firstEnabledInput)?.focus(options);
    }

    function getValidationAnchor() {
        let firstEnabledInput: HTMLInputElement | undefined;

        for (const [index, option] of (props.options ?? []).entries()) {
            const input = inputRefs.value[index];
            if (!input || isOptionDisabled(option)) continue;
            firstEnabledInput ??= input;
            if (isSelected(option)) return input;
        }

        return firstEnabledInput;
    }

    function getNativeResetValue() {
        if (hasExplicitEmptyDefault) return null;

        const initialOption = props.options?.find(
            (option) => option.value === controllable.initialValue && !option.disabled,
        );
        if (initialOption) return initialOption.value;

        const fallbackValue = getFirstEnabledValue(props.options);
        return selectedValue.value === fallbackValue ? fallbackValue : controllable.initialValue;
    }

    function syncNativeDefault() {
        const resetValue = getNativeResetValue();

        for (const [index, input] of inputRefs.value.entries()) {
            if (input) input.defaultChecked = props.options?.[index]?.value === resetValue;
        }
    }

    watch(
        () => props.options,
        (options) => {
            if (!controllable.isControlled.value) {
                const preservesEmptyDefault =
                    selectedValue.value === null && hasExplicitEmptyDefault;
                const hasEnabledSelection = options?.some(
                    (option) => option.value === selectedValue.value && !option.disabled,
                );

                if (!preservesEmptyDefault && !hasEnabledSelection) {
                    controllable.resetValue(getFirstEnabledValue(options));
                }
            }

            void nextTick(syncNativeDefault);
        },
        { deep: true },
    );

    useFormControl({
        elements: () => inputRefs.value,
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            const option = findInputOption(
                inputRefs.value,
                props.options,
                element as HTMLInputElement,
            );
            (element as HTMLInputElement).defaultChecked = option?.value === getNativeResetValue();
        },
        validationMessage(element) {
            return element === getValidationAnchor() ? props.validationMessage : undefined;
        },
        readResetValue(elements) {
            const checked = elements.find((element) => (element as HTMLInputElement).checked) as
                | HTMLInputElement
                | undefined;
            const option = checked
                ? findInputOption(inputRefs.value, props.options, checked)
                : undefined;
            controllable.resetValue(option?.value ?? null);
        },
        syncControlledValue: syncNativeValue,
    });

    return {
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
    };
}
