import {
    DropdownMenuContent as RootDropdownMenuContent,
    DropdownMenuItem as RootDropdownMenuItem,
    DropdownMenuRoot as RootDropdownMenuRoot,
    DropdownMenuTrigger as RootDropdownMenuTrigger,
    FocusTrap as RootFocusTrap,
    TeleportProvider as RootTeleportProvider,
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
    type DropdownMenuRootPrimitiveProps as RootDropdownMenuRootPrimitiveProps,
    type FloatingStrategy as RootFloatingStrategy,
    type FloatingTarget as RootFloatingTarget,
    type TeleportTarget as RootTeleportTarget,
    type UseFloatingPositionOptions as RootUseFloatingPositionOptions,
    type UseFloatingPositionReturn as RootUseFloatingPositionReturn,
    useFloatingPosition as useRootFloatingPosition,
    useFocusTrap as useRootFocusTrap,
    useTeleportTarget as useRootTeleportTarget,
    useToast as useRootToast,
} from 'ropav';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    type DropdownMenuCheckedState,
    type DropdownMenuContentPrimitiveProps,
    type DropdownMenuInteractOutsideTarget,
    type DropdownMenuProps,
    type DropdownMenuItem as DropdownMenuDataItem,
    type DropdownMenuRootPrimitiveProps,
    type DropdownMenuSelectEvent,
    type DropdownMenuVirtualAnchor,
} from 'ropav/dropdown-menu';
import {
    type FloatingCollisionPadding,
    type FloatingOffset,
    type FloatingPlacement,
    type FloatingReference,
    type FloatingStrategy,
    type FloatingTarget,
    type TeleportTarget,
    type UseFloatingPositionOptions,
    type UseFloatingPositionReturn,
    useFloatingPosition,
} from 'ropav/floating';
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
import { h, ref } from 'vue';
import {
    TeleportProvider,
    type TeleportProviderProps,
    useTeleportTarget,
} from 'ropav/teleport-provider';
import { type ModalProps } from 'ropav/modal';
import { type PopoverProps, type PopoverTarget } from 'ropav/popover';
import { type TooltipOffset, type TooltipProps, type TooltipTarget } from 'ropav/tooltip';
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
const dropdownRootProps: DropdownMenuRootPrimitiveProps = { defaultOpen: true, modal: false };
const rootDropdownRootProps: RootDropdownMenuRootPrimitiveProps = { modal: true };
const dropdownContentProps: DropdownMenuContentPrimitiveProps = {
    collisionPadding: 12,
    ignore: ['[data-dropdown-ignore]'],
    placement: 'right-start',
};
const dropdownDataItem: DropdownMenuDataItem = { label: 'Rename', value: 'rename' };
const dropdownChecked: DropdownMenuCheckedState = 'indeterminate';
const virtualAnchor: DropdownMenuVirtualAnchor = {
    getBoundingClientRect: () => new DOMRect(10, 20, 0, 0),
};
const floatingTarget: FloatingTarget = virtualAnchor;
const rootFloatingTarget: RootFloatingTarget = floatingTarget;
const popoverTarget: PopoverTarget = floatingTarget;
const tooltipTarget: TooltipTarget = floatingTarget;
const floatingStrategy: FloatingStrategy = 'fixed';
const rootFloatingStrategy: RootFloatingStrategy = floatingStrategy;
const floatingOffset: FloatingOffset = { mainAxis: 12, crossAxis: 4 };
const tooltipOffset: TooltipOffset = floatingOffset;
const collisionPadding: FloatingCollisionPadding = { top: 4, right: 8 };
const floatingReference = ref<FloatingReference | null>(virtualAnchor);
const floatingElement = ref<HTMLElement | null>(null);
const floatingOpen = ref(true);
const floatingPositionOptions: UseFloatingPositionOptions = {
    reference: floatingReference,
    floating: floatingElement,
    open: floatingOpen,
    placement: () => 'bottom-start',
    offset: floatingOffset,
    collisionPadding: () => collisionPadding,
};
const rootFloatingPositionOptions: RootUseFloatingPositionOptions = floatingPositionOptions;
const publicFloatingComposable: (options: UseFloatingPositionOptions) => UseFloatingPositionReturn =
    useFloatingPosition;
const rootFloatingComposable: (
    options: RootUseFloatingPositionOptions,
) => RootUseFloatingPositionReturn = useRootFloatingPosition;
const publicTeleportComposable: typeof useTeleportTarget = useTeleportTarget;
const rootTeleportComposable: typeof useTeleportTarget = useRootTeleportTarget;

function verifyFloatingReturn(result: UseFloatingPositionReturn) {
    const placement: FloatingPlacement = result.actualPlacement.value;
    // @ts-expect-error Public positioning state is readonly.
    result.isPositioned.value = false;
    return placement;
}

const teleportTarget: TeleportTarget = 'body';
const rootTeleportTarget: RootTeleportTarget = teleportTarget;
const teleportProviderProps: TeleportProviderProps = { teleportTo: teleportTarget };
const tooltipProps: TooltipProps = {
    target: tooltipTarget,
    strategy: floatingStrategy,
    offset: tooltipOffset,
    collisionPadding,
    teleportTo: teleportTarget,
};
const popoverProps: PopoverProps = { target: popoverTarget, arrow: true, shift: false };
const dropdownIgnoreTarget: DropdownMenuInteractOutsideTarget = ref<Element | null>(null);
const dropdownProps: DropdownMenuProps = {
    ignore: [dropdownIgnoreTarget],
    target: floatingTarget,
    strategy: 'fixed',
    flip: false,
};
const modalProps: ModalProps = { teleport: true, teleportTo: teleportTarget };
const teleportProviderVNode = h(TeleportProvider, teleportProviderProps);
const onDropdownSelect = (event: DropdownMenuSelectEvent) => event.preventDefault();
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
    RootDropdownMenuContent,
    RootDropdownMenuItem,
    RootDropdownMenuRoot,
    RootDropdownMenuTrigger,
    RootFocusTrap,
    RootTeleportProvider,
    RootToastProvider,
    RootToastViewport,
    rootToastColors,
    rootToastPositions,
    rootToastRadiuses,
    rootToastTypes,
    rootToastVariants,
    Toast,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
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
    dropdownRootProps,
    rootDropdownRootProps,
    dropdownContentProps,
    dropdownDataItem,
    dropdownChecked,
    virtualAnchor,
    floatingTarget,
    rootFloatingTarget,
    popoverTarget,
    tooltipTarget,
    floatingStrategy,
    rootFloatingStrategy,
    floatingOffset,
    tooltipOffset,
    collisionPadding,
    floatingReference,
    floatingElement,
    floatingOpen,
    floatingPositionOptions,
    rootFloatingPositionOptions,
    publicFloatingComposable,
    rootFloatingComposable,
    publicTeleportComposable,
    rootTeleportComposable,
    verifyFloatingReturn,
    teleportTarget,
    rootTeleportTarget,
    teleportProviderProps,
    tooltipProps,
    popoverProps,
    dropdownIgnoreTarget,
    dropdownProps,
    modalProps,
    TeleportProvider,
    teleportProviderVNode,
    onDropdownSelect,
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
