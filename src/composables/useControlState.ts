import { computed } from 'vue';

export interface ControlStateOptions {
    id?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    describedby?: string;
    labelledby?: string;
}

export interface ControlState {
    id: string | undefined;
    disabled: boolean;
    required: boolean;
    invalid: boolean;
    ariaDescribedby: string | undefined;
    ariaLabelledby: string | undefined;
}

function mergeIds(...values: Array<string | undefined>): string | undefined {
    const ids = values
        .flatMap((value) => value?.split(/\s+/) ?? [])
        .filter(Boolean);
    return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined;
}

export function useControlState(options: ControlStateOptions = {}): ControlState {
    const id = computed(() => options.id);
    const disabled = computed(() => options.disabled ?? false);
    const required = computed(() => options.required ?? false);
    const invalid = computed(() => options.invalid ?? false);

    const ariaDescribedby = computed(() => mergeIds(options.describedby));
    const ariaLabelledby = computed(() => mergeIds(options.labelledby));

    return {
        get id() { return id.value; },
        get disabled() { return disabled.value; },
        get required() { return required.value; },
        get invalid() { return invalid.value; },
        get ariaDescribedby() { return ariaDescribedby.value; },
        get ariaLabelledby() { return ariaLabelledby.value; },
    };
}
