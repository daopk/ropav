import {
    DialogContent as RootDialogContent,
    DialogRoot as RootDialogRoot,
    DropdownMenuContent as RootDropdownMenuContent,
    DropdownMenuItem as RootDropdownMenuItem,
    DropdownMenuRoot as RootDropdownMenuRoot,
    DropdownMenuTrigger as RootDropdownMenuTrigger,
    FocusTrap as RootFocusTrap,
    TeleportProvider as RootTeleportProvider,
    Toast as RootToast,
    ToastProvider as RootToastProvider,
    ToastViewport as RootToastViewport,
    createToastStore as createRootToastStore,
    toastColors as rootToastColors,
    toastPositions as rootToastPositions,
    toastRadiuses as rootToastRadiuses,
    toastTypes as rootToastTypes,
    toastVariants as rootToastVariants,
    type ToastColor as RootToastColor,
    type ToastProps as RootToastProps,
    type ToastProviderProps as RootToastProviderProps,
    type ToastStore as RootToastStore,
    type ToastStoreOptions as RootToastStoreOptions,
    type ToastUpdateOptions as RootToastUpdateOptions,
    type DialogCloseReason as RootDialogCloseReason,
    type DialogRootProps as RootDialogRootProps,
    type DropdownMenuRootPrimitiveProps as RootDropdownMenuRootPrimitiveProps,
    type FloatingStrategy as RootFloatingStrategy,
    type FloatingTarget as RootFloatingTarget,
    type UseHoverDisclosureOptions as RootUseHoverDisclosureOptions,
    type UseHoverDisclosureReturn as RootUseHoverDisclosureReturn,
    type TeleportTarget as RootTeleportTarget,
    type UseFloatingPositionOptions as RootUseFloatingPositionOptions,
    type UseFloatingPositionReturn as RootUseFloatingPositionReturn,
    useFloatingPosition as useRootFloatingPosition,
    useHoverDisclosure as useRootHoverDisclosure,
    useFocusTrap as useRootFocusTrap,
    useTeleportTarget as useRootTeleportTarget,
    useToast as useRootToast,
} from 'ropav';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
    type DialogCloseReason,
    type DialogContentProps,
    type DialogFocusTrapOptions,
    type DialogInteractOutsideEvent,
    type DialogPortalProps,
    type DialogRootProps,
} from 'ropav/dialog';
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
    type HoverDisclosureOpenChangeReason,
    type TeleportTarget,
    type UseHoverDisclosureOptions,
    type UseHoverDisclosureReturn,
    type UseFloatingPositionOptions,
    type UseFloatingPositionReturn,
    useFloatingPosition,
    useHoverDisclosure,
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
    createToastStore,
    toastColors,
    toastPositions,
    toastRadiuses,
    toastTypes,
    toastVariants,
    type ToastColor,
    type ToastOptions,
    type ToastProps,
    type ToastProviderProps,
    type ToastStore,
    type ToastStoreOptions,
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
import { type ColorInputProps } from 'ropav/color-input';
import { type InputProps } from 'ropav/input';
import { type NumberInputProps } from 'ropav/number-input';
import {
    Radio,
    type RadioGroupOrientation,
    type RadioGroupProps,
    type RadioProps,
} from 'ropav/radio';
import { type SelectProps } from 'ropav/select';
import {
    type RangeSliderInputAttrs,
    type RangeSliderProps,
    type RangeSliderValidationMessage,
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
const toastStoreOptions: ToastStoreOptions = { duration: 0, max: 5 };
const toastStore: ToastStore = createToastStore(toastStoreOptions);
const toastProviderProps: ToastProviderProps = { store: toastStore };
const rootToastStoreOptions: RootToastStoreOptions = toastStoreOptions;
const rootToastStore: RootToastStore = createRootToastStore(rootToastStoreOptions);
const rootToastProviderProps: RootToastProviderProps = { store: rootToastStore };
const focusTrapOptions: FocusTrapOptions = { returnFocusOnDeactivate: true };
const useFocusTrapOptions: UseFocusTrapOptions = { immediate: true };
const dropdownRootProps: DropdownMenuRootPrimitiveProps = { defaultOpen: true, modal: false };
const rootDropdownRootProps: RootDropdownMenuRootPrimitiveProps = { modal: true };
const dialogRootProps: DialogRootProps = { defaultOpen: true, modal: false };
const rootDialogRootProps: RootDialogRootProps = { modal: true };
const dialogPortalProps: DialogPortalProps = { teleportTo: 'body' };
const dialogFocusTrapOptions: DialogFocusTrapOptions = {
    tabbableOptions: { displayCheck: 'none' },
};
const dialogContentProps: DialogContentProps = {
    ariaLabel: 'Settings',
    initialFocus: '.save',
    focusTrapOptions: dialogFocusTrapOptions,
};
const dialogCloseReason: DialogCloseReason = 'outside';
const rootDialogCloseReason: RootDialogCloseReason = dialogCloseReason;
const onDialogOutside = (event: DialogInteractOutsideEvent) => event.preventDefault();
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
    restartKey: () => floatingOpen.value,
};
const rootFloatingPositionOptions: RootUseFloatingPositionOptions = floatingPositionOptions;
const publicFloatingComposable: (options: UseFloatingPositionOptions) => UseFloatingPositionReturn =
    useFloatingPosition;
const rootFloatingComposable: (
    options: RootUseFloatingPositionOptions,
) => RootUseFloatingPositionReturn = useRootFloatingPosition;
const hoverDisclosureOptions: UseHoverDisclosureOptions = {
    interactionTarget: floatingReference,
    openDelay: 600,
    closeDelay: 150,
    touchBehavior: 'toggle',
    onOpenChange(_open, details) {
        const reason: HoverDisclosureOpenChangeReason = details.reason;
        void reason;
    },
};
const rootHoverDisclosureOptions: RootUseHoverDisclosureOptions = hoverDisclosureOptions;
const publicHoverDisclosureComposable: (
    options?: Readonly<UseHoverDisclosureOptions>,
) => UseHoverDisclosureReturn = useHoverDisclosure;
const rootHoverDisclosureComposable: (
    options?: Readonly<RootUseHoverDisclosureOptions>,
) => RootUseHoverDisclosureReturn = useRootHoverDisclosure;
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
const rangeValidationMessage: RangeSliderValidationMessage = ['Choose a lower value.', undefined];
const sliderProps: SliderProps = {
    defaultValue: 50,
    form: 'slider-form',
    inputAttrs: sliderInputAttrs,
    invalid: true,
    required: true,
    validationMessage: 'Choose a value.',
};
const rangeSliderProps: RangeSliderProps = {
    defaultValue: [25, 75],
    form: 'slider-form',
    inputAttrs: rangeSliderInputAttrs,
    validationMessage: rangeValidationMessage,
};
const switchProps: SwitchProps = {
    defaultValue: false,
    form: 'settings-form',
    inputAttrs: { autocomplete: 'off' },
    value: 'enabled',
};
const checkboxProps: CheckboxProps = {
    defaultValue: false,
    form: 'terms-form',
    inputAttrs: { form: 'legacy-form' },
    value: 'accepted',
};
const textareaProps: TextareaProps = {
    defaultValue: '',
    form: 'notes-form',
    inputAttrs: { autocomplete: 'off', maxlength: 500 },
    validationMessage: 'Enter notes.',
};
const inputProps: InputProps = { defaultValue: '', form: 'profile-form' };
const numberInputProps: NumberInputProps = { defaultValue: null, form: 'profile-form' };
const colorInputProps: ColorInputProps = {
    defaultValue: '#4992d1',
    form: 'profile-form',
    validationMessage: 'Choose a color.',
};
const selectProps: SelectProps = {
    defaultValue: null,
    form: 'profile-form',
    inputAttrs: { autocomplete: 'off' },
    options: [{ label: 'One', value: 1 }],
    required: true,
};
const radioGroupProps: RadioGroupProps = {
    defaultValue: null,
    form: 'profile-form',
    inputAttrs: { autocomplete: 'off' },
    validationMessage: 'Choose one.',
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
    RootDialogContent,
    RootDialogRoot,
    RootToast,
    RootDropdownMenuContent,
    RootDropdownMenuItem,
    RootDropdownMenuRoot,
    RootDropdownMenuTrigger,
    RootFocusTrap,
    RootTeleportProvider,
    RootToastProvider,
    RootToastViewport,
    createRootToastStore,
    rootToastColors,
    rootToastPositions,
    rootToastRadiuses,
    rootToastTypes,
    rootToastVariants,
    Toast,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    ToastProvider,
    ToastViewport,
    createToastStore,
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
    toastStore,
    toastStoreOptions,
    toastProviderProps,
    rootToastStore,
    rootToastStoreOptions,
    rootToastProviderProps,
    FocusTrap,
    focusTrapOptions,
    useFocusTrapOptions,
    useFocusTrap,
    useRootFocusTrap,
    useRootToast,
    useToast,
    dropdownRootProps,
    rootDropdownRootProps,
    dialogRootProps,
    rootDialogRootProps,
    dialogPortalProps,
    dialogFocusTrapOptions,
    dialogContentProps,
    dialogCloseReason,
    rootDialogCloseReason,
    onDialogOutside,
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
    hoverDisclosureOptions,
    rootHoverDisclosureOptions,
    publicHoverDisclosureComposable,
    rootHoverDisclosureComposable,
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
    rangeValidationMessage,
    switchProps,
    checkboxProps,
    textareaProps,
    inputProps,
    numberInputProps,
    colorInputProps,
    selectProps,
    radioGroupProps,
    radioOrientation,
    radioProps,
    radioVNode,
];
