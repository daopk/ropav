import { computed, useId, useSlots } from 'vue';
import { bem } from '@/utils/bem';
import type { FieldControlProps, FieldProps } from './types';

const INTERACTIVE_LABEL_SELECTOR = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function isInteractiveLabelTarget(target: Element) {
    return Boolean(target.closest(INTERACTIVE_LABEL_SELECTOR));
}

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

    function focusControl(e: MouseEvent) {
        if (props.disabled) return;

        const target = e.target;
        if (target instanceof Element && isInteractiveLabelTarget(target)) return;

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
        focusControl,
    };
}
