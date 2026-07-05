import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { TextareaProps } from './types';

function isInteractiveElement(target: Element) {
    return Boolean(
        target.closest(
            [
                'button',
                'a[href]',
                'input',
                'select',
                'textarea:not(.rp-textarea__native)',
                '[contenteditable="true"]',
                '[tabindex]:not([tabindex="-1"])',
            ].join(','),
        ),
    );
}

export function useTextarea(props: Readonly<TextareaProps>, emitUpdate: (value: string) => void) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-textarea', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            readonly: props.readonly,
        }),
    );

    function onInput(e: Event) {
        emitUpdate((e.target as HTMLTextAreaElement).value);
    }

    function focusTextarea(e: MouseEvent) {
        if (control.disabled) return;

        const target = e.target;
        if (target instanceof Element && isInteractiveElement(target)) return;

        (e.currentTarget as HTMLElement)
            .querySelector<HTMLTextAreaElement>('.rp-textarea__native')
            ?.focus();
    }

    return {
        control,
        rootClass,
        onInput,
        focusTextarea,
    };
}
