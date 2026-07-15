import { nextTick, type InputHTMLAttributes } from 'vue';
import type { PopoverContentSlotProps, PopoverSlotProps } from '../popover/types';
import type { ColorInputProps } from './types';

function onInputKeydown(event: KeyboardEvent, popover: PopoverSlotProps) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        const trigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
        popover.open();
        void nextTick(() => focusPickerFromTrigger(trigger));
        return;
    }

    if (event.key === 'Escape') popover.triggerProps.onKeydown(event);
}

function focusPickerFromTrigger(trigger: HTMLElement | null) {
    const contentId = trigger?.getAttribute('aria-controls')?.split(/\s+/).find(Boolean);
    const picker = contentId
        ? trigger?.ownerDocument
              .getElementById(contentId)
              ?.querySelector<HTMLElement>('.rp-color-picker')
        : null;
    if (!picker) return;

    const hasColorArea = Boolean(picker.querySelector('.rp-color-picker__saturation'));
    const focusTarget = hasColorArea
        ? picker.querySelector<HTMLElement>(
              'input:not(:disabled), button:not(:disabled), [tabindex="0"]',
          )
        : (picker.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') ??
          picker.querySelector<HTMLElement>('[role="radio"][tabindex="0"]'));

    focusTarget?.focus({ preventScroll: true });
}

function onPickerKeydown(event: KeyboardEvent, popover: PopoverContentSlotProps) {
    if (event.key !== 'Escape') return;

    const pickerRoot = event.currentTarget;
    const content = pickerRoot instanceof Element ? pickerRoot.closest('[role="dialog"]') : null;
    const contentId = content?.id;
    const focusTarget = contentId
        ? [...content.ownerDocument.querySelectorAll<HTMLElement>('[aria-controls]')].find(
              (element) => element.getAttribute('aria-controls')?.split(/\s+/).includes(contentId),
          )
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
