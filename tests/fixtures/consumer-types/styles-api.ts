import {
    accordionItemParts,
    accordionParts,
    type AccordionItemPart,
    type AccordionPart,
    type AccordionTriggerProps,
} from 'ropav/accordion';
import { alertParts, type AlertPart } from 'ropav/alert';
import { aspectRatioParts, type AspectRatioPart } from 'ropav/aspect-ratio';
import { avatarParts, type AvatarPart } from 'ropav/avatar';
import { badgeParts, type BadgePart } from 'ropav/badge';
import { buttonParts, type ButtonPart, type ButtonProps } from 'ropav/button';
import { buttonGroupParts, type ButtonGroupPart } from 'ropav/button-group';
import { buttonLinkParts, type ButtonLinkPart } from 'ropav/button-link';
import { cardParts, type CardPart } from 'ropav/card';
import { checkboxParts, type CheckboxPart } from 'ropav/checkbox';
import { collapseParts, type CollapsePart } from 'ropav/collapse';
import { colorInputParts, type ColorInputPart } from 'ropav/color-input';
import { colorPickerParts, type ColorPickerPart } from 'ropav/color-picker';
import { colorSwatchParts, type ColorSwatchPart } from 'ropav/color-swatch';
import { dropdownMenuParts, type DropdownMenuPart } from 'ropav/dropdown-menu';
import { fieldParts, type FieldPart } from 'ropav/field';
import { focusTrapParts, type FocusTrapPart } from 'ropav/focus-trap';
import { iconButtonParts, type IconButtonPart } from 'ropav/icon-button';
import { inputParts, type InputPart } from 'ropav/input';
import { modalParts, type ModalPart } from 'ropav/modal';
import { numberInputParts, type NumberInputPart } from 'ropav/number-input';
import { overlayParts, type OverlayPart } from 'ropav/overlay';
import { popoverParts, type PopoverPart } from 'ropav/popover';
import { progressParts, type ProgressPart } from 'ropav/progress';
import { radioGroupParts, radioParts, type RadioGroupPart, type RadioPart } from 'ropav/radio';
import { scrollAreaParts, type ScrollAreaPart } from 'ropav/scroll-area';
import { selectParts, type SelectPart } from 'ropav/select';
import { rangeSliderParts, sliderParts, type RangeSliderPart, type SliderPart } from 'ropav/slider';
import { switchParts, type SwitchPart } from 'ropav/switch';
import {
    tabsContentParts,
    tabsListParts,
    tabsParts,
    tabsTriggerParts,
    type TabsContentPart,
    type TabsListPart,
    type TabsPart,
    type TabsTriggerPart,
} from 'ropav/tabs';
import { textareaParts, type TextareaPart } from 'ropav/textarea';
import {
    toastParts,
    toastViewportParts,
    type ToastPart,
    type ToastViewportPart,
} from 'ropav/toast';
import { tooltipParts, type TooltipPart } from 'ropav/tooltip';
import {
    buttonParts as rootButtonParts,
    modalParts as rootModalParts,
    type StylesApiClassNames,
    type StylesApiStyles,
} from 'ropav';

const parts = [
    accordionParts[0] satisfies AccordionPart,
    accordionItemParts[0] satisfies AccordionItemPart,
    alertParts[0] satisfies AlertPart,
    aspectRatioParts[0] satisfies AspectRatioPart,
    avatarParts[0] satisfies AvatarPart,
    badgeParts[0] satisfies BadgePart,
    buttonParts[0] satisfies ButtonPart,
    buttonGroupParts[0] satisfies ButtonGroupPart,
    buttonLinkParts[0] satisfies ButtonLinkPart,
    cardParts[0] satisfies CardPart,
    checkboxParts[0] satisfies CheckboxPart,
    collapseParts[0] satisfies CollapsePart,
    colorInputParts[0] satisfies ColorInputPart,
    colorPickerParts[0] satisfies ColorPickerPart,
    colorSwatchParts[0] satisfies ColorSwatchPart,
    dropdownMenuParts[0] satisfies DropdownMenuPart,
    fieldParts[0] satisfies FieldPart,
    focusTrapParts[0] satisfies FocusTrapPart,
    iconButtonParts[0] satisfies IconButtonPart,
    inputParts[0] satisfies InputPart,
    modalParts[0] satisfies ModalPart,
    numberInputParts[0] satisfies NumberInputPart,
    overlayParts[0] satisfies OverlayPart,
    popoverParts[0] satisfies PopoverPart,
    progressParts[0] satisfies ProgressPart,
    radioParts[0] satisfies RadioPart,
    radioGroupParts[0] satisfies RadioGroupPart,
    scrollAreaParts[0] satisfies ScrollAreaPart,
    selectParts[0] satisfies SelectPart,
    sliderParts[0] satisfies SliderPart,
    rangeSliderParts[0] satisfies RangeSliderPart,
    switchParts[0] satisfies SwitchPart,
    tabsParts[0] satisfies TabsPart,
    tabsListParts[0] satisfies TabsListPart,
    tabsTriggerParts[0] satisfies TabsTriggerPart,
    tabsContentParts[0] satisfies TabsContentPart,
    textareaParts[0] satisfies TextareaPart,
    toastParts[0] satisfies ToastPart,
    toastViewportParts[0] satisfies ToastViewportPart,
    tooltipParts[0] satisfies TooltipPart,
];

const classNames: StylesApiClassNames<ButtonPart> = {
    root: ['consumer', { active: true }],
    label: 'label',
};
const styles: StylesApiStyles<ButtonPart> = {
    root: [{ color: 'red' }, { margin: '1rem' }],
    label: { fontWeight: 600 },
};
const buttonProps: ButtonProps = { classNames, styles };
const accordionTriggerClass: AccordionTriggerProps['class'] = [
    'consumer-trigger',
    { active: true },
];

const invalidClassNames: StylesApiClassNames<ButtonPart> = {
    // @ts-expect-error internal wrappers are not public parts
    content: 'invalid',
};
const invalidStyles: StylesApiStyles<ButtonPart> = {
    // @ts-expect-error arbitrary part keys are rejected
    wrapper: { color: 'red' },
};

void [
    parts,
    rootButtonParts,
    rootModalParts,
    buttonProps,
    accordionTriggerClass,
    invalidClassNames,
    invalidStyles,
];
