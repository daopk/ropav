import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { ColorPickerValue } from '../color-picker/types';
import type { ColorInputProps } from './types';
import { useColorInputEyeDropper } from './useColorInputEyeDropper';
import { useColorInputPopover } from './useColorInputPopover';
import { useColorInputValue } from './useColorInputValue';

interface UseColorInputEmitters {
    modelValue: (value: ColorPickerValue) => void;
    open: (value: boolean) => void;
}

export function useColorInput(props: Readonly<ColorInputProps>, emit: UseColorInputEmitters) {
    const control = useControlState(props);
    const value = useColorInputValue(props, () => control.invalid);
    const popover = useColorInputPopover(() => props.inputAttrs);
    const popoverDisabled = computed(
        () =>
            control.disabled ||
            Boolean(props.readonly) ||
            (Boolean(props.swatchesOnly) && !value.hasValidSwatches.value),
    );
    const eyeDropper = useColorInputEyeDropper({
        enabled: () => props.withEyeDropper !== false && !props.swatchesOnly,
        disabled: () => control.disabled || Boolean(props.readonly) || Boolean(props.swatchesOnly),
        format: () => props.format ?? 'hex',
        update: emit.modelValue,
    });

    const rootClass = computed(() =>
        bem('rp-color-input', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: value.isInvalid.value,
            valid: control.valid && !value.isInvalid.value,
            readonly: props.readonly,
        }),
    );

    function onInputUpdate(nextValue: ColorPickerValue) {
        if (control.disabled || props.readonly || props.disallowInput || props.swatchesOnly) return;
        emit.modelValue(nextValue);
    }

    function onPickerUpdate(nextValue: ColorPickerValue) {
        if (control.disabled || props.readonly) return;
        emit.modelValue(nextValue);
    }

    function onOpenUpdate(open: boolean) {
        emit.open(open);
    }

    return {
        control,
        rootClass,
        popoverDisabled,
        ...value,
        ...popover,
        ...eyeDropper,
        onInputUpdate,
        onPickerUpdate,
        onOpenUpdate,
    };
}
