import { computed, useId, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import { isInteractiveElement } from '@/utils/dom/interactive';
import type { FieldControlProps, FieldProps } from './types';

export function useField(props: Readonly<FieldProps>) {
    const slots = useSlots();
    const generatedId = useId();

    const controlId = computed(() => props.id ?? `${generatedId}-control`);
    const labelId = computed(() => `${controlId.value}-label`);
    const descriptionId = computed(() => `${controlId.value}-description`);

    const isInvalid = computed(() => Boolean(props.invalid));

    const hasLabel = computed(() => Boolean(props.label || slots.label));
    const hasDescription = computed(() => Boolean(props.description || slots.description));
    const hasMessage = computed(() => Boolean(slots.message));

    const controlLabelledby = computed(() => (hasLabel.value ? labelId.value : undefined));
    const controlDescribedby = computed(() =>
        hasDescription.value ? descriptionId.value : undefined,
    );

    const rootClass = computed(() =>
        bem('rp-field', {
            disabled: props.disabled,
            required: props.required,
            invalid: isInvalid.value,
        }),
    );

    const controlProps = computed<FieldControlProps>(() => ({
        id: controlId.value,
        disabled: props.disabled || undefined,
        required: props.required || undefined,
        invalid: isInvalid.value || undefined,
        labelledby: controlLabelledby.value,
        describedby: controlDescribedby.value,
    }));

    function focusControl(e: MouseEvent) {
        if (props.disabled) return;

        if (isInteractiveElement(e.target)) return;

        const label = e.currentTarget;
        const control =
            label instanceof HTMLLabelElement
                ? (label.control ?? label.ownerDocument.getElementById(controlId.value))
                : undefined;

        if (control instanceof HTMLElement) control.focus();
    }

    return {
        controlId,
        labelId,
        descriptionId,
        isInvalid,
        hasLabel,
        hasDescription,
        hasMessage,
        controlLabelledby,
        controlDescribedby,
        rootClass,
        controlProps,
        focusControl,
    };
}
