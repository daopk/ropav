import { computed, ref } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { isInteractiveElement } from '@/utils/dom/interactive';
import type { InputProps } from './types';

const NATIVE_INPUT_SELECTOR = '.rp-input__native';

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

        if (isInteractiveElement(e.target, NATIVE_INPUT_SELECTOR)) return;

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
