import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { TextareaProps } from './types';

export function useTextarea(props: Readonly<TextareaProps>, emitUpdate: (value: string) => void) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-textarea', {
            disabled: control.disabled,
            invalid: control.invalid,
            readonly: props.readonly,
        }),
    );

    function onInput(e: Event) {
        emitUpdate((e.target as HTMLTextAreaElement).value);
    }

    return {
        control,
        rootClass,
        onInput,
    };
}
