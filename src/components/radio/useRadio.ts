import {
    computed,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    shallowRef,
    useId,
    type CSSProperties,
} from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/composables/useControlState';
import { useFormControl } from '@/composables/useFormControl';
import { getComponentColorValue, getComponentContrastColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type {
    RadioGroupContext,
    RadioGroupProps,
    RadioGroupRegistration,
    RadioProps,
} from './types';

function getRadioColorStyle(
    color: RadioProps['color'],
    autoContrast: RadioProps['autoContrast'],
    contrastColor: RadioProps['contrastColor'],
) {
    const colorValue = getComponentColorValue(color);
    if (color && !colorValue) return undefined;
    if (!colorValue && autoContrast === false && contrastColor === undefined) return undefined;

    const style: CSSProperties = {};
    if (colorValue) style['--_rp-radio-color'] = colorValue;
    if (autoContrast !== false || contrastColor !== undefined) {
        style['--_rp-radio-on-color'] = getComponentContrastColor(color ?? 'primary', {
            autoContrast,
            contrastColor,
        });
    }

    return style;
}

export function useRadio(props: Readonly<RadioProps>, emitChange: (event: Event) => void) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);
    const group = inject(radioGroupKey, null);
    const isChecked = computed(
        () => props.checked ?? (group ? group.modelValue === props.value : false),
    );
    const isDisabled = computed(() => Boolean(props.disabled || group?.disabled));
    const isRequired = computed(() => props.required ?? group?.required ?? false);
    const isInvalid = computed(() => props.invalid ?? group?.invalid ?? false);
    const name = computed(() => props.name ?? group?.name);
    const form = computed(() => props.form ?? group?.form);
    const variant = computed(() => props.variant ?? group?.variant);
    const color = computed(() => props.color ?? group?.color);
    const autoContrast = computed(() => props.autoContrast ?? group?.autoContrast);
    const contrastColor = computed(() => props.contrastColor ?? group?.contrastColor);
    const size = computed(() => props.size ?? group?.size);

    const rootClass = computed(() =>
        bem('rp-radio', {
            checked: isChecked.value,
            disabled: isDisabled.value,
            invalid: isInvalid.value,
            [variant.value ?? '']: Boolean(variant.value),
            [`size-${size.value}`]: Boolean(size.value),
        }),
    );

    const rootStyle = computed(() =>
        getRadioColorStyle(color.value, autoContrast.value, contrastColor.value),
    );

    function onSelect(event: Event) {
        if (isDisabled.value) return;
        group?.select(props.value);
        emitChange(event);
    }

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    let unregister: (() => void) | undefined;
    onMounted(() => {
        if (group && inputRef.value) {
            unregister = group.register({
                input: inputRef.value,
                value: () => props.value,
                disabled: () => isDisabled.value,
                checked: () => isChecked.value,
                validationMessage: () => props.validationMessage,
            });
        }
    });
    onBeforeUnmount(() => unregister?.());

    useFormControl({
        elements: () => (group ? [] : [inputRef.value]),
        isControlled: () => true,
        initializeDefault(element) {
            (element as HTMLInputElement).defaultChecked = isChecked.value;
        },
        validationMessage: () => props.validationMessage,
        readResetValue() {},
        syncControlledValue(elements) {
            (elements[0] as HTMLInputElement).checked = isChecked.value;
        },
    });

    return {
        inputRef,
        control,
        name,
        form,
        groupInputAttrs: computed(() => group?.inputAttrs),
        isChecked,
        isDisabled,
        isRequired,
        isInvalid,
        rootClass,
        rootStyle,
        onSelect,
        focus,
    };
}

export function useRadioGroup(
    props: Readonly<RadioGroupProps>,
    emitUpdate: (value: string | number | null) => void,
) {
    const control = useControlState(props);
    const registrations = shallowRef<RadioGroupRegistration[]>([]);
    const controllable = useControllableValue<string | number | null>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: emitUpdate,
    });

    const rootClass = computed(() =>
        bem('rp-radio-group', {
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const generatedName = useId();
    const groupName = computed(() => props.name ?? `${control.id ?? generatedName}-radio`);

    function register(registration: RadioGroupRegistration) {
        registrations.value = [...registrations.value, registration];
        return () => {
            registrations.value = registrations.value.filter((item) => item !== registration);
        };
    }

    useFormControl({
        elements: () => registrations.value.map((registration) => registration.input),
        isControlled: () => controllable.isControlled.value,
        initializeDefault(element) {
            const registration = registrations.value.find((item) => item.input === element);
            (element as HTMLInputElement).defaultChecked =
                registration?.value() === controllable.initialValue;
        },
        validationMessage(element) {
            const enabled = registrations.value.filter((registration) => !registration.disabled());
            const anchor = enabled.find((registration) => registration.checked()) ?? enabled[0];
            const registration = registrations.value.find((item) => item.input === element);
            return (
                registration?.validationMessage() ??
                (registration === anchor ? props.validationMessage : undefined)
            );
        },
        readResetValue(elements) {
            const checked = registrations.value.find(
                (registration) =>
                    elements.includes(registration.input) && registration.input.checked,
            );
            controllable.resetValue(checked?.value() ?? null);
        },
        syncControlledValue() {
            for (const registration of registrations.value) {
                registration.input.checked = registration.value() === controllable.value.value;
            }
        },
    });

    provide<RadioGroupContext>(radioGroupKey, {
        get modelValue() {
            return controllable.value.value;
        },
        get name() {
            return groupName.value;
        },
        get form() {
            return control.form;
        },
        get disabled() {
            return control.disabled;
        },
        get required() {
            return control.required;
        },
        get invalid() {
            return control.invalid;
        },
        get variant() {
            return props.variant;
        },
        get color() {
            return props.color;
        },
        get autoContrast() {
            return props.autoContrast;
        },
        get contrastColor() {
            return props.contrastColor;
        },
        get size() {
            return props.size;
        },
        get inputAttrs() {
            return props.inputAttrs;
        },
        select(value) {
            controllable.setValue(value);
        },
        register,
    });

    return {
        control,
        rootClass,
        value: controllable.value,
    };
}
