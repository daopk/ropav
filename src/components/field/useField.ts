import { computed, useId, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import type { FieldControlProps, FieldProps } from './types';

export function useField(props: Readonly<FieldProps>) {
    const slots = useSlots();
    const generatedId = useId();

    const controlId = computed(() => props.id ?? `${generatedId}-control`);
    const labelId = computed(() => `${controlId.value}-label`);
    const descriptionId = computed(() => `${controlId.value}-description`);
    const messageId = computed(() => `${controlId.value}-message`);

    const isInvalid = computed(() => Boolean(props.invalid || props.error));
    const messageText = computed(() => props.error || props.message);

    const hasLabel = computed(() => Boolean(props.label || slots.label));
    const hasDescription = computed(() => Boolean(props.description || slots.description));
    const hasMessage = computed(() => Boolean(messageText.value || slots.message));

    const controlLabelledby = computed(() => (hasLabel.value ? labelId.value : undefined));
    const controlDescribedby = computed(
        () =>
            [
                hasDescription.value ? descriptionId.value : undefined,
                hasMessage.value ? messageId.value : undefined,
            ]
                .filter(Boolean)
                .join(' ') || undefined,
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

    return {
        controlId,
        labelId,
        descriptionId,
        messageId,
        isInvalid,
        messageText,
        hasLabel,
        hasDescription,
        hasMessage,
        controlLabelledby,
        controlDescribedby,
        rootClass,
        controlProps,
    };
}
