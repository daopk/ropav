import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import SegmentedControl from './segmented-control.vue';
import type { SegmentedControlOption, SegmentedControlProps } from './types';

const options: SegmentedControlOption[] = [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
    { label: 'Board', value: 'board' },
];

function mountSegmentedControl(
    props: SegmentedControlProps = {},
    listeners: Record<string, unknown> = {},
) {
    return mountDom(
        defineComponent({
            render() {
                return h(SegmentedControl, {
                    ariaLabel: 'View mode',
                    options,
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

describe('SegmentedControl', () => {
    it('selects the first enabled option by default and exposes group semantics', async () => {
        const container = mountSegmentedControl({
            id: 'view-mode',
            describedby: 'view-help',
            required: true,
        });
        await flush();

        const root = container.querySelector('.rp-segmented-control') as HTMLElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];

        expect(root.id).toBe('view-mode');
        expect(root.getAttribute('role')).toBe('radiogroup');
        expect(root.getAttribute('aria-label')).toBe('View mode');
        expect(root.getAttribute('aria-describedby')).toBe('view-help');
        expect(root.getAttribute('aria-orientation')).toBe('horizontal');
        expect(root.getAttribute('aria-required')).toBe('true');
        expect(root.getAttribute('data-value')).toBe('list');
        expect(inputs).toHaveLength(3);
        expect(inputs.map((input) => input.id)).toEqual([
            'view-mode-option-0',
            'view-mode-option-1',
            'view-mode-option-2',
        ]);
        expect(inputs.map((input) => input.name)).toEqual([
            'view-mode-segmented-control',
            'view-mode-segmented-control',
            'view-mode-segmented-control',
        ]);
        expect(inputs.map((input) => input.checked)).toEqual([true, false, false]);
        expect(inputs.every((input) => input.required)).toBe(true);
    });

    it('updates uncontrolled state and emits the typed selected value', async () => {
        const onUpdate = vi.fn();
        const onNativeChange = vi.fn();
        const container = mountSegmentedControl(
            {
                defaultValue: 'grid',
                inputAttrs: { onChange: onNativeChange },
            },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const root = container.querySelector('.rp-segmented-control') as HTMLElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        inputs[2].click();
        await flush();

        expect(inputs.map((input) => input.checked)).toEqual([false, false, true]);
        expect(root.getAttribute('data-value')).toBe('board');
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('board');
        expect(onNativeChange).toHaveBeenCalledOnce();
        expect(onNativeChange.mock.calls[0]?.[0].target).toBe(inputs[2]);
    });

    it('restores a controlled value when the consumer does not accept an update', async () => {
        const onUpdate = vi.fn();
        const container = mountSegmentedControl(
            { modelValue: 'list' },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        inputs[1].click();
        await flush();

        expect(onUpdate).toHaveBeenCalledWith('grid');
        expect(inputs.map((input) => input.checked)).toEqual([true, false, false]);
        expect(container.querySelector('.rp-segmented-control')?.getAttribute('data-value')).toBe(
            'list',
        );
    });

    it('keeps native selection synchronized when options are removed', async () => {
        const state = reactive({
            options: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
                { label: 'Board', value: 'board' },
            ],
        });
        const segmentedRef = ref<{
            nativeElements: Array<HTMLInputElement | null>;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(SegmentedControl, {
                            ref: segmentedRef,
                            defaultValue: 'list',
                            name: 'view',
                            options: state.options,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        state.options.splice(1, 1);
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(segmentedRef.value?.nativeElements).toEqual(inputs);

        inputs[1].click();
        await flush();

        expect(inputs.map((input) => input.checked)).toEqual([false, true]);
        expect(container.querySelector('[role="radiogroup"]')?.getAttribute('data-value')).toBe(
            'board',
        );
        expect(new FormData(form).get('view')).toBe('board');
    });

    it('supports numeric values, native form submission, and form reset', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        { id: 'settings-form' },
                        h(SegmentedControl, {
                            name: 'density',
                            defaultValue: 2,
                            options: [
                                { label: 'Compact', value: 1 },
                                { label: 'Comfortable', value: 2 },
                            ],
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(new FormData(form).get('density')).toBe('2');

        inputs[0].click();
        await flush();
        expect(onUpdate).toHaveBeenCalledWith(1);
        expect(new FormData(form).get('density')).toBe('1');

        form.reset();
        await Promise.resolve();
        await flush();
        expect(inputs.map((input) => input.checked)).toEqual([false, true]);
        expect(new FormData(form).get('density')).toBe('2');
    });

    it('resets asynchronous options to their automatic default', async () => {
        const state = reactive<{ options: SegmentedControlOption[] }>({ options: [] });
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(SegmentedControl, {
                            name: 'view',
                            options: state.options,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        state.options = [
            { label: 'List', value: 'list' },
            { label: 'Grid', value: 'grid' },
        ];
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.map((input) => input.checked)).toEqual([true, false]);
        expect(new FormData(form).get('view')).toBe('list');

        inputs[1].click();
        await flush();
        form.reset();
        await Promise.resolve();
        await flush();

        expect(inputs.map((input) => input.checked)).toEqual([true, false]);
        expect(container.querySelector('[role="radiogroup"]')?.getAttribute('data-value')).toBe(
            'list',
        );
        expect(new FormData(form).get('view')).toBe('list');
    });

    it('allows an empty required default and applies group validation to one native anchor', async () => {
        const container = mountSegmentedControl({
            defaultValue: null,
            required: true,
            validationMessage: 'Choose a view.',
        });
        await flush();

        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.every((input) => !input.checked)).toBe(true);
        expect(inputs[0].validationMessage).toBe('Choose a view.');
        expect(inputs[1].validationMessage).not.toBe('Choose a view.');
        expect(inputs[0].checkValidity()).toBe(false);
    });

    it('keeps custom validity on the selected enabled option', async () => {
        const state = reactive<{
            modelValue: string;
            options: SegmentedControlOption[];
        }>({
            modelValue: 'list',
            options: [
                { label: 'List', value: 'list' },
                { label: 'Grid', value: 'grid' },
            ],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(SegmentedControl, {
                            modelValue: state.modelValue,
                            name: 'view',
                            options: state.options,
                            validationMessage: 'Choose a supported view.',
                            'onUpdate:modelValue': (value) => {
                                state.modelValue = String(value);
                            },
                        }),
                    ]);
                },
            }),
        );
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.map((input) => input.validationMessage)).toEqual([
            'Choose a supported view.',
            '',
        ]);

        inputs[1].click();
        await flush();

        expect(inputs.map((input) => input.validationMessage)).toEqual([
            '',
            'Choose a supported view.',
        ]);

        state.options[0].disabled = true;
        await flush();

        expect(form.checkValidity()).toBe(false);
        expect(inputs[1].validationMessage).toBe('Choose a supported view.');
    });

    it('moves custom validity when its native anchor becomes disabled', async () => {
        const state = reactive({
            options: [
                { label: 'List', value: 'list', disabled: false },
                { label: 'Grid', value: 'grid', disabled: false },
            ],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(SegmentedControl, {
                            modelValue: null,
                            options: state.options,
                            validationMessage: 'Choose a supported view.',
                        }),
                    ]);
                },
            }),
        );
        await flush();

        state.options[0].disabled = true;
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.map((input) => input.validationMessage)).toEqual([
            '',
            'Choose a supported view.',
        ]);
        expect(form.checkValidity()).toBe(false);
    });

    it('combines group and option disabled states', async () => {
        const onUpdate = vi.fn();
        const container = mountSegmentedControl(
            {
                defaultValue: 'list',
                options: [
                    { label: 'List', value: 'list' },
                    { label: 'Grid', value: 'grid', disabled: true },
                ],
            },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const controls = [...container.querySelectorAll('label')];
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs[0].disabled).toBe(false);
        expect(inputs[1].disabled).toBe(true);
        expect(controls[1].hasAttribute('data-disabled')).toBe(true);

        inputs[1].click();
        await flush();
        expect(onUpdate).not.toHaveBeenCalled();

        const disabledContainer = mountSegmentedControl({
            disabled: true,
            modelValue: 'list',
        });
        await flush();
        expect(
            [...disabledContainer.querySelectorAll<HTMLInputElement>('input')].every(
                (input) => input.disabled,
            ),
        ).toBe(true);
        expect(
            disabledContainer.querySelector('.rp-segmented-control')?.hasAttribute('data-disabled'),
        ).toBe(true);
    });

    it('reconciles an uncontrolled selection when its option becomes disabled', async () => {
        const state = reactive({
            options: [
                { label: 'List', value: 'list', disabled: false },
                { label: 'Grid', value: 'grid', disabled: false },
            ],
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(SegmentedControl, {
                            defaultValue: 'list',
                            name: 'view',
                            options: state.options,
                            required: true,
                        }),
                    ]);
                },
            }),
        );
        await flush();

        state.options[0].disabled = true;
        await flush();

        const form = container.querySelector('form') as HTMLFormElement;
        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(inputs.map((input) => input.checked)).toEqual([false, true]);
        expect(container.querySelector('[role="radiogroup"]')?.getAttribute('data-value')).toBe(
            'grid',
        );
        expect(form.checkValidity()).toBe(true);
        expect(new FormData(form).get('view')).toBe('grid');

        form.reset();
        await Promise.resolve();
        await flush();

        expect(inputs.map((input) => input.checked)).toEqual([false, true]);
        expect(new FormData(form).get('view')).toBe('grid');
    });

    it('supports orientation semantics, the Styles API, and native input attributes', async () => {
        const container = mountSegmentedControl({
            invalid: true,
            orientation: 'vertical',
            classNames: {
                root: 'consumer-root',
                control: 'consumer-control',
                input: 'consumer-input',
                indicator: 'consumer-indicator',
                label: 'consumer-label',
            },
            styles: {
                root: { width: '320px' },
                label: { fontWeight: 700 },
            },
            inputAttrs: {
                autocomplete: 'off',
                class: 'legacy-input',
                type: 'checkbox',
            },
        });
        await flush();

        const root = container.querySelector('[role="radiogroup"]') as HTMLElement;
        const input = container.querySelector('input') as HTMLInputElement;
        const control = input.closest('label') as HTMLElement;
        const indicator = container.querySelector('.consumer-indicator') as HTMLElement;
        const label = container.querySelector('.consumer-label') as HTMLElement;

        expect(root.classList).toContain('consumer-root');
        expect(root.style.width).toBe('320px');
        expect(root.getAttribute('data-orientation')).toBe('vertical');
        expect(root.hasAttribute('data-invalid')).toBe(true);
        expect(root.getAttribute('aria-orientation')).toBe('vertical');
        expect(control.classList).toContain('consumer-control');
        expect(input.type).toBe('radio');
        expect(input.classList).toContain('consumer-input');
        expect(input.classList).toContain('legacy-input');
        expect(input.autocomplete).toBe('off');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(indicator.classList).toContain('consumer-indicator');
        expect(label.classList).toContain('consumer-label');
        expect(label.style.fontWeight).toBe('700');
    });

    it('renders custom option content and exposes focusable native inputs', async () => {
        const segmentedRef = ref<{
            nativeElements: Array<HTMLInputElement | null>;
            focus: (options?: FocusOptions) => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        SegmentedControl,
                        {
                            ref: segmentedRef,
                            defaultValue: 'grid',
                            options,
                        },
                        {
                            option: ({
                                option,
                                selected,
                            }: {
                                option: SegmentedControlOption;
                                selected: boolean;
                            }) => `${selected ? 'Selected' : 'Option'}: ${option.label}`,
                        },
                    );
                },
            }),
        );
        await flush();

        const inputs = [...container.querySelectorAll('input')] as HTMLInputElement[];
        expect(container.textContent).toContain('Selected: Grid');
        expect(segmentedRef.value?.nativeElements).toEqual(inputs);

        segmentedRef.value?.focus({ preventScroll: true });
        expect(document.activeElement).toBe(inputs[1]);
    });
});
