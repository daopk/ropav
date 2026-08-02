import { describe, expect, it } from 'vitest';
import { defineComponent, h, shallowReactive } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import {
    useGroupedRadioChoiceTransaction,
    type GroupedRadioChoiceTransaction,
} from './useGroupedRadioChoiceTransaction';

interface Choice {
    disabled?: boolean;
    label: string;
    value: string;
}

interface GroupedRadioProps {
    choices: Choice[];
    defaultValue?: string | null;
    modelValue?: string | null;
    validationMessage?: string;
}

function mountGroupedRadioChoice(props: GroupedRadioProps, renderControls = true) {
    const reactiveProps = shallowReactive(props);
    const updates: Array<string | null> = [];
    let transaction!: GroupedRadioChoiceTransaction<string>;

    const container = mountDom(
        defineComponent({
            setup() {
                transaction = useGroupedRadioChoiceTransaction({
                    choices: () => reactiveProps.choices,
                    disabled: () => false,
                    validationMessage: () => reactiveProps.validationMessage,
                    value: {
                        modelValue: () => reactiveProps.modelValue,
                        defaultValue: () => reactiveProps.defaultValue,
                        onChange: (value) => updates.push(value),
                    },
                });

                return () =>
                    renderControls
                        ? h(
                              'form',
                              reactiveProps.choices.map((choice) =>
                                  h('input', {
                                      key: choice.value,
                                      ref: transaction.createInputRef(choice.value),
                                      disabled: choice.disabled,
                                      name: 'view',
                                      type: 'radio',
                                      value: choice.value,
                                      onChange: () => transaction.acceptValue(choice.value),
                                  }),
                              ),
                          )
                        : h('div');
            },
        }),
    );

    return {
        container,
        props: reactiveProps,
        transaction,
        updates,
    };
}

describe('useGroupedRadioChoiceTransaction', () => {
    it('keeps an automatic native default after choices load asynchronously', async () => {
        const mounted = mountGroupedRadioChoice({
            choices: [],
        });
        await flush();

        mounted.props.choices = [
            { label: 'List', value: 'list' },
            { label: 'Grid', value: 'grid' },
        ];
        await flush();

        const form = mounted.container.querySelector('form')!;
        const inputs = [...mounted.container.querySelectorAll('input')] as HTMLInputElement[];
        expect(mounted.transaction.value.value).toBe('list');
        expect(inputs.map((input) => input.defaultChecked)).toEqual([true, false]);

        inputs[1].click();
        await flush();

        expect(inputs.map((input) => input.defaultChecked)).toEqual([true, false]);

        form.reset();

        expect(inputs.map((input) => input.checked)).toEqual([true, false]);
        expect(new FormData(form).get('view')).toBe('list');
    });

    it('resets to empty when the explicit native default is removed', async () => {
        const mounted = mountGroupedRadioChoice({
            choices: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
                { label: 'Board', value: 'board' },
            ],
            defaultValue: 'grid',
        });
        await flush();

        const form = mounted.container.querySelector('form')!;
        const inputs = [...mounted.container.querySelectorAll('input')] as HTMLInputElement[];
        inputs[2].click();
        await flush();

        mounted.props.choices = [
            { label: 'List', value: 'list' },
            { label: 'Board', value: 'board' },
        ];
        await flush();

        form.reset();
        await Promise.resolve();
        await flush();

        expect(mounted.transaction.value.value).toBeNull();
        expect(new FormData(form).get('view')).toBeNull();
    });

    it('coordinates typed selection, form reset, and validation anchoring', async () => {
        const mounted = mountGroupedRadioChoice({
            choices: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
            ],
            defaultValue: 'list',
            validationMessage: 'Choose a view.',
        });
        await flush();

        const form = mounted.container.querySelector('form')!;
        const inputs = [...mounted.container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.map((input) => input.checked)).toEqual([true, false]);
        expect(inputs.map((input) => input.validationMessage)).toEqual(['Choose a view.', '']);

        inputs[1].click();
        await flush();

        expect(mounted.transaction.value.value).toBe('grid');
        expect(mounted.updates).toEqual(['grid']);

        form.reset();
        await Promise.resolve();
        await flush();

        expect(mounted.transaction.value.value).toBe('list');
        expect(inputs.map((input) => input.checked)).toEqual([true, false]);
    });

    it('preserves an explicit empty default across choice metadata changes', async () => {
        const mounted = mountGroupedRadioChoice({
            choices: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
            ],
            defaultValue: null,
        });
        await flush();

        mounted.props.choices = [
            { label: 'List view', value: 'list' },
            { label: 'Grid', value: 'grid' },
        ];
        await flush();

        expect(mounted.transaction.value.value).toBeNull();
        expect(mounted.updates).toEqual([]);
    });

    it('preserves the last controlled value when control is released', async () => {
        const mounted = mountGroupedRadioChoice({
            choices: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
            ],
            modelValue: null,
        });
        await flush();

        mounted.props.modelValue = undefined;
        await flush();

        expect(mounted.transaction.value.value).toBeNull();
        expect(mounted.updates).toEqual([]);
    });

    it('keeps a replacement input registered when stale cleanup runs', () => {
        const mounted = mountGroupedRadioChoice(
            {
                choices: [{ label: 'List', value: 'list' }],
            },
            false,
        );
        const firstInput = document.createElement('input');
        const replacementInput = document.createElement('input');
        const firstRef = mounted.transaction.createInputRef('list');
        const replacementRef = mounted.transaction.createInputRef('list');

        firstRef(firstInput);
        replacementRef(replacementInput);
        firstRef(null);

        expect(mounted.transaction.inputRefs.value).toEqual([replacementInput]);
    });
});
