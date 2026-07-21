import { computed, ref } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import type { InputProps } from './types';

const NATIVE_INPUT_SELECTOR = '.rp-input__native';
const INTERACTIVE_SELECTOR = [
    'button',
    'a[href]',
    `input:not(${NATIVE_INPUT_SELECTOR})`,
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function isInteractiveElement(target: Element) {
    return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

export function useInput(props: Readonly<InputProps>, emitUpdate: (value: string) => void) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-input', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            readonly: props.readonly,
        }),
    );

    function onInput(e: Event) {
        emitUpdate((e.target as HTMLInputElement).value);
    }

    function focusInput(e: MouseEvent) {
        if (control.disabled) return;

        const target = e.target;
        if (target instanceof Element && isInteractiveElement(target)) return;

        inputRef.value?.focus();
    }

    return {
        inputRef,
        control,
        rootClass,
        onInput,
        focusInput,
    };
}
