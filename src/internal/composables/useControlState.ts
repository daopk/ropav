import { computed } from 'vue';
import { mergeAriaIdRefs } from '@/utils/aria';

export interface ControlStateOptions {
    id?: string;
    form?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    describedby?: string;
    labelledby?: string;
}

export interface ControlState {
    id: string | undefined;
    form: string | undefined;
    disabled: boolean;
    required: boolean;
    invalid: boolean;
    valid: boolean;
    ariaDescribedby: string | undefined;
    ariaLabelledby: string | undefined;
}

export function useControlState(options: ControlStateOptions = {}): ControlState {
    const id = computed(() => options.id);
    const form = computed(() => options.form);
    const disabled = computed(() => options.disabled ?? false);
    const required = computed(() => options.required ?? false);
    const invalid = computed(() => options.invalid ?? false);
    const valid = computed(() => options.valid ?? false);

    const ariaDescribedby = computed(() => mergeAriaIdRefs(options.describedby));
    const ariaLabelledby = computed(() => mergeAriaIdRefs(options.labelledby));

    return {
        get id() {
            return id.value;
        },
        get form() {
            return form.value;
        },
        get disabled() {
            return disabled.value;
        },
        get required() {
            return required.value;
        },
        get invalid() {
            return invalid.value;
        },
        get valid() {
            return valid.value;
        },
        get ariaDescribedby() {
            return ariaDescribedby.value;
        },
        get ariaLabelledby() {
            return ariaLabelledby.value;
        },
    };
}
