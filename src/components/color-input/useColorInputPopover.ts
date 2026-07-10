import type { InputHTMLAttributes } from 'vue';
import type { PopoverContentSlotProps, PopoverSlotProps } from '../popover/types';
import type { ColorInputProps } from './types';

function onInputKeydown(event: KeyboardEvent, popover: PopoverSlotProps) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        popover.open();
        return;
    }

    if (event.key === 'Escape') popover.triggerProps.onKeydown(event);
}

function onPickerKeydown(event: KeyboardEvent, popover: PopoverContentSlotProps) {
    if (event.key !== 'Escape') return;

    const pickerRoot = event.currentTarget;
    const focusTarget =
        pickerRoot instanceof Element
            ? pickerRoot
                  .closest('.rp-color-input')
                  ?.querySelector<HTMLInputElement>('.rp-input__native')
            : undefined;

    event.stopPropagation();
    focusTarget?.focus({ preventScroll: true });
    popover.close();
}

export function useColorInputPopover(getInputAttrs: () => ColorInputProps['inputAttrs']) {
    let closePicker: PopoverSlotProps['close'] | undefined;

    function getInputTriggerAttrs(slotProps: unknown): InputHTMLAttributes {
        const popover = slotProps as PopoverSlotProps;
        const trigger = popover.triggerProps;
        const attrs = getInputAttrs() ?? {};

        if (!trigger['aria-haspopup']) return attrs;

        return {
            ...attrs,
            role: 'combobox',
            'aria-autocomplete': 'none',
            'aria-controls': trigger['aria-controls'],
            'aria-expanded': trigger['aria-expanded'],
            'aria-haspopup': trigger['aria-haspopup'],
            onFocusin(event) {
                rememberClose(popover);
                popover.open();
                attrs.onFocusin?.(event);
            },
            onClick(event) {
                rememberClose(popover);
                popover.open();
                attrs.onClick?.(event);
            },
            onKeydown(event) {
                onInputKeydown(event, popover);
                attrs.onKeydown?.(event);
            },
        };
    }

    function rememberClose(slotProps: PopoverSlotProps | PopoverContentSlotProps) {
        closePicker = slotProps.close;
    }

    function onFocusOut(event: FocusEvent) {
        const root = event.currentTarget;
        const nextTarget = event.relatedTarget;

        if (
            root instanceof HTMLElement &&
            nextTarget instanceof Node &&
            root.contains(nextTarget)
        ) {
            return;
        }

        closePicker?.();
    }

    return {
        getInputTriggerAttrs,
        rememberClose,
        onPickerKeydown,
        onFocusOut,
    };
}
