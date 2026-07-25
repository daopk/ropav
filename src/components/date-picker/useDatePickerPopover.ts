import { nextTick, type InputHTMLAttributes } from 'vue';
import { isNodeWithinElement } from '@/utils/dom/events';
import type { PopoverContentSlotProps, PopoverSlotProps } from '../popover/types';
import type { DatePickerProps } from './types';

interface DatePickerPopoverOptions {
    getInputAttrs: () => DatePickerProps['inputAttrs'];
    getInputValue: () => string;
    isInputEditable: () => boolean;
    onInputBlur: () => void;
    focusInput: () => void;
    focusCalendar: () => void;
}

export function useDatePickerPopover(options: DatePickerPopoverOptions) {
    let openPicker: PopoverSlotProps['open'] | undefined;
    let closePicker: PopoverSlotProps['close'] | undefined;
    let suppressFocusOpen = false;
    let pointerDownStartedFocused: boolean | undefined;

    function getInputTriggerAttrs(slotProps: unknown): InputHTMLAttributes {
        const popover = slotProps as PopoverSlotProps;
        const trigger = popover.triggerProps;
        const attrs = options.getInputAttrs() ?? {};

        if (!trigger['aria-haspopup']) return attrs;

        openPicker = popover.open;
        closePicker = popover.close;

        return {
            ...attrs,
            role: 'combobox',
            'aria-autocomplete': 'none',
            'aria-controls': trigger['aria-controls'],
            'aria-expanded': trigger['aria-expanded'],
            'aria-haspopup': trigger['aria-haspopup'],
            'aria-readonly': options.isInputEditable() ? attrs['aria-readonly'] : true,
            autocomplete: attrs.autocomplete ?? 'off',
            inputmode: options.isInputEditable() ? attrs.inputmode : 'none',
            onBeforeinput(event) {
                if (!options.isInputEditable()) event.preventDefault();
                attrs.onBeforeinput?.(event);
            },
            onInput(event) {
                if (!options.isInputEditable() && event.currentTarget instanceof HTMLInputElement) {
                    event.currentTarget.value = options.getInputValue();
                }
                attrs.onInput?.(event);
            },
            onPointerdown(event) {
                pointerDownStartedFocused =
                    event.currentTarget instanceof HTMLElement &&
                    event.currentTarget.ownerDocument.activeElement === event.currentTarget;
                attrs.onPointerdown?.(event);
            },
            onFocusin(event) {
                rememberClose(popover);
                if (!suppressFocusOpen) popover.open();
                attrs.onFocusin?.(event);
            },
            onClick(event) {
                rememberClose(popover);
                if (pointerDownStartedFocused !== false) popover.open();
                pointerDownStartedFocused = undefined;
                attrs.onClick?.(event);
            },
            onBlur(event) {
                pointerDownStartedFocused = undefined;
                options.onInputBlur();
                attrs.onBlur?.(event);
            },
            onKeydown(event) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    popover.open();
                    void nextTick(options.focusCalendar);
                } else if (event.key === 'Escape') {
                    trigger.onKeydown(event);
                }
                attrs.onKeydown?.(event);
            },
        };
    }

    function open() {
        openPicker?.();
    }

    function focusWithoutOpening(focus: () => void) {
        suppressFocusOpen = true;
        try {
            focus();
        } finally {
            suppressFocusOpen = false;
        }
    }

    function rememberClose(slotProps: PopoverSlotProps | PopoverContentSlotProps) {
        closePicker = slotProps.close;
    }

    function onCalendarKeydown(event: KeyboardEvent, popover: PopoverContentSlotProps) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        focusWithoutOpening(options.focusInput);
        popover.close();
    }

    function onFocusOut(event: FocusEvent) {
        if (isNodeWithinElement(event.relatedTarget, event.currentTarget)) return;
        closePicker?.();
    }

    return {
        getInputTriggerAttrs,
        open,
        focusWithoutOpening,
        rememberClose,
        onCalendarKeydown,
        onFocusOut,
    };
}
