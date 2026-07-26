import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import { useDatePickerValueState, type DatePickerValueStateProps } from './useDatePickerValueState';

function mountDatePickerValueState(overrides: Partial<DatePickerValueStateProps> = {}) {
    const props = reactive<DatePickerValueStateProps>({
        defaultValue: new Date(2026, 6, 10),
        locale: 'en-US',
        allowInput: true,
        clearable: true,
        invalidDateMessage: 'Enter a valid date.',
        ...overrides,
    });
    const onChange = vi.fn();
    let valueState!: ReturnType<typeof useDatePickerValueState>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                valueState = useDatePickerValueState({
                    props,
                    getInput: () => null,
                    onChange,
                });
                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        props,
        onChange,
        get valueState() {
            return valueState;
        },
    };
}

describe('useDatePickerValueState', () => {
    it('synchronizes authoritative value and formatting changes after invalid input', () => {
        const { props, valueState } = mountDatePickerValueState({
            modelValue: new Date(2026, 6, 10),
        });

        valueState.updateInput('not a date');
        expect(valueState.inputValue.value).toBe('not a date');
        expect(valueState.isInvalid.value).toBe(true);
        expect(valueState.validationMessage.value).toBe('Enter a valid date.');

        props.modelValue = new Date(2026, 6, 14);
        expect(valueState.inputValue.value).toBe('07/14/2026');
        expect(valueState.isInvalid.value).toBe(false);

        props.locale = 'en-GB';
        expect(valueState.inputValue.value).toBe('14/07/2026');

        valueState.updateInput('still invalid');
        props.formatDate = (value) => `day:${value.getDate()}`;
        expect(valueState.inputValue.value).toBe('day:14');
        expect(valueState.isInvalid.value).toBe(false);
    });

    it('canonicalizes equivalent input and clears invalid text with whitespace', () => {
        const selectedDate = new Date(2026, 6, 10);
        const { onChange, valueState } = mountDatePickerValueState({
            defaultValue: selectedDate,
            formatDate: (value) => `day:${value.getDate()}`,
            parseDate: (value) => (value === 'same' ? selectedDate : null),
        });

        valueState.updateInput('same');
        expect(valueState.inputValue.value).toBe('same');

        valueState.blurInput();
        expect(valueState.inputValue.value).toBe('day:10');

        valueState.updateInput('invalid');
        expect(valueState.isInvalid.value).toBe(true);

        valueState.updateInput('   ');
        expect(onChange).toHaveBeenLastCalledWith(null);
        expect(valueState.inputValue.value).toBe('');
        expect(valueState.isInvalid.value).toBe(false);
        expect(valueState.validationMessage.value).toBeUndefined();
    });
});
