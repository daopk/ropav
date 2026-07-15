import {
    FocusTrap as RootFocusTrap,
    Toast as RootToast,
    ToastProvider as RootToastProvider,
    ToastViewport as RootToastViewport,
    toastColors as rootToastColors,
    toastPositions as rootToastPositions,
    toastRadiuses as rootToastRadiuses,
    toastTypes as rootToastTypes,
    toastVariants as rootToastVariants,
    type ToastColor as RootToastColor,
    type ToastProps as RootToastProps,
    type ToastUpdateOptions as RootToastUpdateOptions,
    useFocusTrap as useRootFocusTrap,
    useToast as useRootToast,
} from 'ropav';
import {
    FocusTrap,
    type FocusTrapOptions,
    type UseFocusTrapOptions,
    useFocusTrap,
} from 'ropav/focus-trap';
import {
    Toast,
    ToastProvider,
    ToastViewport,
    toastColors,
    toastPositions,
    toastRadiuses,
    toastTypes,
    toastVariants,
    type ToastColor,
    type ToastOptions,
    type ToastProps,
    type ToastUpdateOptions,
    useToast,
} from 'ropav/toast';
import { h } from 'vue';
import { type CheckboxProps } from 'ropav/checkbox';
import { Radio, type RadioGroupOrientation, type RadioProps } from 'ropav/radio';
import {
    type RangeSliderInputAttrs,
    type RangeSliderProps,
    type SliderInputAttrs,
    type SliderProps,
} from 'ropav/slider';
import { type SwitchProps } from 'ropav/switch';
import { type TextareaProps } from 'ropav/textarea';

type IsAny<T> = 0 extends 1 & T ? true : false;
type ToastColorIsTyped = IsAny<ToastProps['color']> extends false ? true : never;
type RootToastColorIsTyped = IsAny<RootToastProps['color']> extends false ? true : never;
type ToastUpdateIdIsExcluded = 'id' extends keyof ToastUpdateOptions ? never : true;
type RootToastUpdateIdIsExcluded = 'id' extends keyof RootToastUpdateOptions ? never : true;

const props: ToastProps = { color: 'blue.5' };
const color: ToastColor | undefined = props.color;
const toastColorIsTyped: ToastColorIsTyped = true;
const rootProps: RootToastProps = { color: 'cyan.5' };
const rootColor: RootToastColor | undefined = rootProps.color;
const rootToastColorIsTyped: RootToastColorIsTyped = true;
const toastUpdateIdIsExcluded: ToastUpdateIdIsExcluded = true;
const rootToastUpdateIdIsExcluded: RootToastUpdateIdIsExcluded = true;
const options: ToastOptions = { title: 'Saved', type: 'success' };
const focusTrapOptions: FocusTrapOptions = { returnFocusOnDeactivate: true };
const useFocusTrapOptions: UseFocusTrapOptions = { immediate: true };
const sliderInputAttrs: SliderInputAttrs = { form: 'slider-form', onChange: () => undefined };
const rangeSliderInputAttrs: RangeSliderInputAttrs = [
    { title: 'Lower input' },
    { title: 'Upper input' },
];
const sliderProps: SliderProps = { inputAttrs: sliderInputAttrs, modelValue: 50 };
const rangeSliderProps: RangeSliderProps = {
    inputAttrs: rangeSliderInputAttrs,
    modelValue: [25, 75],
};
const switchProps: SwitchProps = { inputAttrs: { autocomplete: 'off' }, modelValue: false };
const checkboxProps: CheckboxProps = { inputAttrs: { form: 'terms-form' }, modelValue: false };
const textareaProps: TextareaProps = {
    inputAttrs: { autocomplete: 'off', maxlength: 500 },
    modelValue: '',
};
const radioOrientation: RadioGroupOrientation = 'horizontal';
const radioProps: RadioProps = {
    ariaLabel: 'Standalone radio',
    checked: false,
    inputAttrs: { form: 'radio-form' },
    name: 'standalone',
    required: true,
    value: 'option',
};
const radioVNode = h(Radio, {
    ...radioProps,
    onChange(event) {
        void event.target;
    },
});

void [
    RootToast,
    RootFocusTrap,
    RootToastProvider,
    RootToastViewport,
    rootToastColors,
    rootToastPositions,
    rootToastRadiuses,
    rootToastTypes,
    rootToastVariants,
    Toast,
    ToastProvider,
    ToastViewport,
    toastColors,
    toastPositions,
    toastRadiuses,
    toastTypes,
    toastVariants,
    color,
    toastColorIsTyped,
    rootColor,
    rootToastColorIsTyped,
    toastUpdateIdIsExcluded,
    rootToastUpdateIdIsExcluded,
    options,
    FocusTrap,
    focusTrapOptions,
    useFocusTrapOptions,
    useFocusTrap,
    useRootFocusTrap,
    useRootToast,
    useToast,
    sliderInputAttrs,
    rangeSliderInputAttrs,
    sliderProps,
    rangeSliderProps,
    switchProps,
    checkboxProps,
    textareaProps,
    radioOrientation,
    radioProps,
    radioVNode,
];
