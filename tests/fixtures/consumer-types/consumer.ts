import {
    DialogContent as RootDialogContent,
    DialogRoot as RootDialogRoot,
    DropdownMenuContent as RootDropdownMenuContent,
    DropdownMenuItem as RootDropdownMenuItem,
    DropdownMenuRoot as RootDropdownMenuRoot,
    DropdownMenuTrigger as RootDropdownMenuTrigger,
    FocusTrap as RootFocusTrap,
    OverlayLayerProvider as RootOverlayLayerProvider,
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
    type FloatingAutoUpdateOptions as RootFloatingAutoUpdateOptions,
    type FloatingFlipFallbackStrategy as RootFloatingFlipFallbackStrategy,
    type FloatingFlipOptions as RootFloatingFlipOptions,
    type FloatingStrategy as RootFloatingStrategy,
    type FloatingTarget as RootFloatingTarget,
    type OverlayLayerProviderProps as RootOverlayLayerProviderProps,
    type UseHoverDisclosureOptions as RootUseHoverDisclosureOptions,
    type UseHoverDisclosureReturn as RootUseHoverDisclosureReturn,
    type TeleportTarget as RootTeleportTarget,
    type UseFloatingPositionOptions as RootUseFloatingPositionOptions,
    type UseFloatingPositionReturn as RootUseFloatingPositionReturn,
    type UseControllableValueOptions as RootUseControllableValueOptions,
    type UseControllableValueReturn as RootUseControllableValueReturn,
    type UseOverlayZIndexOptions as RootUseOverlayZIndexOptions,
    useControllableValue as useRootControllableValue,
    useFloatingPosition as useRootFloatingPosition,
    useHoverDisclosure as useRootHoverDisclosure,
    useFocusTrap as useRootFocusTrap,
    useOverlayZIndex as useRootOverlayZIndex,
    useTeleportTarget as useRootTeleportTarget,
    useToast as useRootToast,
} from 'ropav';
import {
    type UseControllableValueOptions,
    type UseControllableValueReturn,
    useControllableValue,
} from 'ropav/composables';
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
    type DropdownMenuSubContentPrimitiveProps,
    type DropdownMenuVirtualAnchor,
} from 'ropav/dropdown-menu';
import {
    type FloatingAutoUpdateOptions,
    type FloatingCollisionPadding,
    type FloatingFlipFallbackStrategy,
    type FloatingFlipOptions,
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
    type ToastViewportProps,
    useToast,
} from 'ropav/toast';
import { h, ref, type ComputedRef } from 'vue';
import {
    OverlayLayerProvider,
    type OverlayLayerProviderProps,
    type UseOverlayZIndexOptions,
    useOverlayZIndex,
} from 'ropav/overlay';
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
    type RangeSliderThumbOptions,
    type RangeSliderTrackSlotProps,
    type RangeSliderTooltip,
    type RangeSliderValidationMessage,
    type SliderInputAttrs,
    type SliderProps,
    type SliderThumb,
    type SliderThumbMode,
    type SliderThumbOptions,
    type SliderTrackSlotProps,
    type SliderTooltipAnchor,
    type SliderTooltipSlotProps,
} from 'ropav/slider';
import { type SwitchProps } from 'ropav/switch';
import { type TextareaProps } from 'ropav/textarea';
import { vaporIconCompiler } from 'ropav/unplugin-icons';

type IsAny<T> = 0 extends 1 & T ? true : false;
type ToastColorIsTyped = IsAny<ToastProps['color']> extends false ? true : never;
type RootToastColorIsTyped = IsAny<RootToastProps['color']> extends false ? true : never;
type ToastUpdateIdIsExcluded = 'id' extends keyof ToastUpdateOptions ? never : true;
type RootToastUpdateIdIsExcluded = 'id' extends keyof RootToastUpdateOptions ? never : true;

const props: ToastProps = { color: 'blue.5' };
const iconCompiler = vaporIconCompiler();
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
const controlledValue = ref<string>();
const controllableValueOptions: UseControllableValueOptions<string> = {
    modelValue: () => controlledValue.value,
    defaultValue: () => 'initial',
    onChange(value) {
        controlledValue.value = value;
    },
};
const rootControllableValueOptions: RootUseControllableValueOptions<string> =
    controllableValueOptions;
const controllableValue: UseControllableValueReturn<string> =
    useControllableValue(controllableValueOptions);
const rootControllableValue: RootUseControllableValueReturn<string> = useRootControllableValue(
    rootControllableValueOptions,
);
// @ts-expect-error Public controllable state is readonly.
controllableValue.value.value = 'mutated';
const focusTrapOptions: FocusTrapOptions = { returnFocusOnDeactivate: true };
const useFocusTrapOptions: UseFocusTrapOptions = { immediate: true };
const dropdownRootProps: DropdownMenuRootPrimitiveProps = {
    defaultOpen: true,
    baseZIndex: 2000,
    modal: false,
};
const rootDropdownRootProps: RootDropdownMenuRootPrimitiveProps = {
    baseZIndex: 2000,
    modal: true,
};
const dialogRootProps: DialogRootProps = { defaultOpen: true, baseZIndex: 2000, modal: false };
const rootDialogRootProps: RootDialogRootProps = { baseZIndex: 2000, modal: true };
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
    flipOptions: { fallbackStrategy: 'initialPlacement' },
    autoUpdateOptions: { animationFrame: true },
    ignore: ['[data-dropdown-ignore]'],
    placement: 'right-start',
};
const dropdownSubContentProps: DropdownMenuSubContentPrimitiveProps = {
    flipOptions: { fallbackStrategy: 'initialPlacement' },
    autoUpdateOptions: { animationFrame: true },
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
const floatingFlipFallbackStrategy: FloatingFlipFallbackStrategy = 'initialPlacement';
const floatingFlipOptions: FloatingFlipOptions = {
    fallbackStrategy: floatingFlipFallbackStrategy,
};
const floatingAutoUpdateOptions: FloatingAutoUpdateOptions = { animationFrame: true };
const rootFloatingFlipFallbackStrategy: RootFloatingFlipFallbackStrategy =
    floatingFlipFallbackStrategy;
const rootFloatingFlipOptions: RootFloatingFlipOptions = {
    fallbackStrategy: rootFloatingFlipFallbackStrategy,
};
const rootFloatingAutoUpdateOptions: RootFloatingAutoUpdateOptions = floatingAutoUpdateOptions;
const floatingReference = ref<FloatingReference | null>(virtualAnchor);
const floatingElement = ref<HTMLElement | null>(null);
const floatingOpen = ref(true);
const floatingPositionOptions: UseFloatingPositionOptions = {
    reference: floatingReference,
    floating: floatingElement,
    open: floatingOpen,
    placement: () => 'bottom-start',
    offset: floatingOffset,
    flipOptions: () => floatingFlipOptions,
    collisionPadding: () => collisionPadding,
    autoUpdateOptions: () => floatingAutoUpdateOptions,
    restartKey: () => floatingOpen.value,
};
const rootFloatingPositionOptions: RootUseFloatingPositionOptions = {
    ...floatingPositionOptions,
    flipOptions: rootFloatingFlipOptions,
    autoUpdateOptions: rootFloatingAutoUpdateOptions,
};
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
const overlayLayerProviderProps: OverlayLayerProviderProps = { baseZIndex: 5000 };
const rootOverlayLayerProviderProps: RootOverlayLayerProviderProps = overlayLayerProviderProps;
const overlayLayerProviderVNode = h(OverlayLayerProvider, overlayLayerProviderProps);
const rootOverlayLayerProviderVNode = h(RootOverlayLayerProvider, rootOverlayLayerProviderProps);
const overlayZIndexOptions: UseOverlayZIndexOptions = {
    baseZIndex: ref<number | undefined>(),
    defaultBaseZIndex: 1000,
    offset: () => 1,
    aboveParent: true,
};
const rootOverlayZIndexOptions: RootUseOverlayZIndexOptions = overlayZIndexOptions;
const publicOverlayZIndexComposable: (options?: UseOverlayZIndexOptions) => ComputedRef<number> =
    useOverlayZIndex;
const rootOverlayZIndexComposable: (options?: RootUseOverlayZIndexOptions) => ComputedRef<number> =
    useRootOverlayZIndex;
const tooltipProps: TooltipProps = {
    baseZIndex: 2000,
    target: tooltipTarget,
    strategy: floatingStrategy,
    offset: tooltipOffset,
    flipOptions: floatingFlipOptions,
    collisionPadding,
    autoUpdateOptions: floatingAutoUpdateOptions,
    teleportTo: teleportTarget,
};
const popoverProps: PopoverProps = {
    baseZIndex: 2000,
    target: popoverTarget,
    arrow: true,
    shift: false,
    flipOptions: floatingFlipOptions,
    autoUpdateOptions: floatingAutoUpdateOptions,
};
const dropdownIgnoreTarget: DropdownMenuInteractOutsideTarget = ref<Element | null>(null);
const dropdownProps: DropdownMenuProps = {
    baseZIndex: 2000,
    ignore: [dropdownIgnoreTarget],
    target: floatingTarget,
    strategy: 'fixed',
    flip: false,
    flipOptions: floatingFlipOptions,
    autoUpdateOptions: floatingAutoUpdateOptions,
};
const modalProps: ModalProps = {
    baseZIndex: 2000,
    teleport: true,
    teleportTo: teleportTarget,
};
const toastViewportProps: ToastViewportProps = { baseZIndex: 2000 };
const teleportProviderVNode = h(TeleportProvider, teleportProviderProps);
const onDropdownSelect = (event: DropdownMenuSelectEvent) => event.preventDefault();
const sliderInputAttrs: SliderInputAttrs = { form: 'slider-form', onChange: () => undefined };
const rangeSliderInputAttrs: RangeSliderInputAttrs = [
    { title: 'Lower input' },
    { title: 'Upper input' },
];
const rangeValidationMessage: RangeSliderValidationMessage = ['Choose a lower value.', undefined];
const sliderProps: SliderProps = {
    ariaLabel: 'Volume',
    defaultValue: 50,
    form: 'slider-form',
    inputAttrs: sliderInputAttrs,
    invalid: true,
    required: true,
    thumb: 'interaction',
    tooltip: { anchor: 'pointer' },
    validationMessage: 'Choose a value.',
};
const sliderThumb: SliderThumb = false;
const sliderThumbMode: SliderThumbMode = 'interaction';
const sliderThumbOptions: SliderThumbOptions = {
    border: 2,
    padding: 4,
    size: 24,
    visibility: sliderThumbMode,
};
const rangeSliderThumbOptions: RangeSliderThumbOptions = { size: 24 };
const sliderTrackSlotProps: SliderTrackSlotProps = {
    value: 42,
    formattedValue: '42%',
    percent: 42,
    min: 0,
    max: 100,
    orientation: 'horizontal',
    getPercent: (value) => value,
};
const sliderTooltipAnchor: SliderTooltipAnchor = 'pointer';
const sliderTooltipSlotProps: SliderTooltipSlotProps = {
    anchor: sliderTooltipAnchor,
    formattedValue: '00:42',
    percent: 42,
    value: 42,
};
const rangeSliderTooltip: RangeSliderTooltip = { mode: 'always' };
const rangeSliderTrackSlotProps: RangeSliderTrackSlotProps = {
    value: [25, 75],
    formattedValue: ['25%', '75%'],
    percent: [25, 75],
    min: 0,
    max: 100,
    orientation: 'horizontal',
    getPercent: (value) => value,
};
const rangeSliderProps: RangeSliderProps = {
    defaultValue: [25, 75],
    form: 'slider-form',
    inputAttrs: rangeSliderInputAttrs,
    thumb: rangeSliderThumbOptions,
    validationMessage: rangeValidationMessage,
    tooltip: rangeSliderTooltip,
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
    labelledby: 'profile-choice-label',
    options: [{ label: 'One', value: 1 }],
    required: true,
};
const unnamedSliderProps: SliderProps = {};
const unnamedSelectProps: SelectProps = {};
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
    iconCompiler,
    RootDialogContent,
    RootDialogRoot,
    RootToast,
    RootDropdownMenuContent,
    RootDropdownMenuItem,
    RootDropdownMenuRoot,
    RootDropdownMenuTrigger,
    RootFocusTrap,
    RootOverlayLayerProvider,
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
    OverlayLayerProvider,
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
    controlledValue,
    controllableValueOptions,
    rootControllableValueOptions,
    controllableValue,
    rootControllableValue,
    overlayLayerProviderProps,
    rootOverlayLayerProviderProps,
    overlayLayerProviderVNode,
    rootOverlayLayerProviderVNode,
    overlayZIndexOptions,
    rootOverlayZIndexOptions,
    publicOverlayZIndexComposable,
    rootOverlayZIndexComposable,
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
    dropdownSubContentProps,
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
    toastViewportProps,
    TeleportProvider,
    teleportProviderVNode,
    onDropdownSelect,
    sliderInputAttrs,
    rangeSliderInputAttrs,
    sliderProps,
    sliderThumb,
    sliderThumbMode,
    sliderThumbOptions,
    rangeSliderThumbOptions,
    sliderTrackSlotProps,
    sliderTooltipAnchor,
    sliderTooltipSlotProps,
    rangeSliderTooltip,
    rangeSliderTrackSlotProps,
    rangeSliderProps,
    rangeValidationMessage,
    switchProps,
    checkboxProps,
    textareaProps,
    inputProps,
    numberInputProps,
    colorInputProps,
    selectProps,
    unnamedSliderProps,
    unnamedSelectProps,
    radioGroupProps,
    radioOrientation,
    radioProps,
    radioVNode,
];
