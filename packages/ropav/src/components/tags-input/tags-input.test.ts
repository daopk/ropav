import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { click, flush, input, keydown, mountDom } from '../../../tests/utils/vue';
import TagsInput from './tags-input.vue';
import type { TagsInputProps } from './types';

function mountTagsInput(props: TagsInputProps = {}, listeners: Record<string, unknown> = {}) {
    return mountDom(
        defineComponent({
            render() {
                return h(TagsInput, {
                    ariaLabel: 'Technologies',
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

function getInput(container: Element) {
    return container.querySelector('.rp-tags-input__input') as HTMLInputElement;
}

function getTags(container: Element) {
    return [...container.querySelectorAll('.rp-tags-input__tag-label')].map((tag) =>
        tag.textContent?.trim(),
    );
}

describe('TagsInput', () => {
    it('commits values with Enter and configured split characters', async () => {
        const onUpdate = vi.fn();
        const container = mountTagsInput(
            { defaultValue: [], splitChars: [',', ';'] },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputElement = getInput(container);
        input(inputElement, 'Vue');
        keydown(inputElement, 'Enter');
        await flush();

        input(inputElement, 'Vapor;TypeScript,');
        await flush();

        expect(onUpdate.mock.calls.map(([value]) => value)).toEqual([
            ['Vue'],
            ['Vue', 'Vapor', 'TypeScript'],
        ]);
        expect(getTags(container)).toEqual(['Vue', 'Vapor', 'TypeScript']);
        expect(inputElement.value).toBe('');
    });

    it('applies duplicate, validation, and maxTags constraints', async () => {
        const container = mountTagsInput({
            defaultValue: ['Vue'],
            maxTags: 2,
            validate: (value) => value.length >= 3,
        });
        await flush();

        const inputElement = getInput(container);
        input(inputElement, 'Vue,x,Vapor,Svelte,');
        await flush();

        expect(getTags(container)).toEqual(['Vue', 'Vapor']);
    });

    it('removes the last tag with Backspace and supports remove and clear buttons', async () => {
        const onUpdate = vi.fn();
        const container = mountTagsInput(
            { defaultValue: ['Vue', 'Vapor'], clearable: true },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputElement = getInput(container);
        keydown(inputElement, 'Backspace');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith(['Vue']);

        click(container.querySelector('.rp-tags-input__tag-remove')!);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([]);

        input(inputElement, 'TypeScript');
        keydown(inputElement, 'Enter');
        await flush();
        click(container.querySelector('.rp-tags-input__clear')!);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([]);
    });

    it('commits pending input when focus leaves if acceptValueOnBlur is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            acceptValueOnBlur: true,
                        }),
                        h('button', { class: 'next' }, 'Next'),
                    ]);
                },
            }),
        );
        await flush();

        const inputElement = getInput(container);
        inputElement.focus();
        input(inputElement, 'Vue');
        (container.querySelector('.next') as HTMLButtonElement).focus();
        await flush();

        expect(getTags(container)).toEqual(['Vue']);
    });

    it('includes a blur-committed value in the same submit action', async () => {
        const submittedValues: string[][] = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', [
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            defaultValue: ['Vue'],
                            acceptValueOnBlur: true,
                        }),
                        h('button', { class: 'submit', type: 'submit' }, 'Submit'),
                    ]);
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const inputElement = getInput(container);
        const submitButton = container.querySelector('.submit') as HTMLButtonElement;
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            submittedValues.push(new FormData(form).getAll('technology') as string[]);
        });

        inputElement.focus();
        input(inputElement, 'Vapor');
        submitButton.focus();
        submitButton.click();

        expect(submittedValues).toEqual([['Vue', 'Vapor']]);
        await flush();
        expect(getTags(container)).toEqual(['Vue', 'Vapor']);
    });

    it('submits duplicate values and resets an uncontrolled value', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            defaultValue: ['Vue', 'Vue'],
                            allowDuplicates: true,
                        }),
                    );
                },
            }),
        );
        await flush();

        const inputElement = getInput(container);
        input(inputElement, 'Vapor');
        keydown(inputElement, 'Enter');
        await flush();

        const form = container.querySelector('form')!;
        expect(new FormData(form).getAll('technology')).toEqual(['Vue', 'Vue', 'Vapor']);

        form.reset();
        await Promise.resolve();
        await flush();

        expect(new FormData(form).getAll('technology')).toEqual(['Vue', 'Vue']);
        expect(getTags(container)).toEqual(['Vue', 'Vue']);
    });

    it('submits tags in their current order after removing and re-adding a default', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            defaultValue: ['Vue', 'React'],
                        }),
                    );
                },
            }),
        );
        await flush();

        click(container.querySelector('.rp-tags-input__tag-remove')!);
        await flush();
        input(getInput(container), 'Vue,');
        await flush();

        const form = container.querySelector('form')!;
        expect(getTags(container)).toEqual(['React', 'Vue']);
        expect(new FormData(form).getAll('technology')).toEqual(['React', 'Vue']);
    });

    it('clears pending input when its form resets', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            defaultValue: ['Vue'],
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const inputElement = getInput(container);
        input(inputElement, 'pending');
        form.reset();
        await Promise.resolve();
        await flush();

        expect(inputElement.value).toBe('');
        expect(getTags(container)).toEqual(['Vue']);
        expect(new FormData(form).getAll('technology')).toEqual(['Vue']);
    });

    it('does not commit split characters while an IME composition is active', async () => {
        const container = mountTagsInput({ splitChars: ['、'] });
        await flush();

        const inputElement = getInput(container);
        inputElement.value = '日本、';
        inputElement.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                data: '、',
                inputType: 'insertCompositionText',
                isComposing: true,
            }),
        );
        await flush();

        expect(inputElement.value).toBe('日本、');
        expect(getTags(container)).toEqual([]);

        inputElement.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                data: '、',
                inputType: 'insertText',
            }),
        );
        await flush();

        expect(inputElement.value).toBe('');
        expect(getTags(container)).toEqual(['日本']);
    });

    it('dispatches controlled native change events with the proposed values', async () => {
        const onUpdate = vi.fn();
        const nativeChanges: string[][] = [];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            modelValue: ['Vue'],
                            'onUpdate:modelValue': onUpdate,
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const nativeSelect = container.querySelector('select')!;
        nativeSelect.addEventListener('change', () => {
            nativeChanges.push(new FormData(form).getAll('technology') as string[]);
        });

        input(getInput(container), 'Vapor,');
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(['Vue', 'Vapor']);
        expect(nativeChanges).toEqual([['Vue', 'Vapor']]);
        expect(new FormData(form).getAll('technology')).toEqual(['Vue']);
    });

    it('excludes readonly values from native constraint validation', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'form',
                        h(TagsInput, {
                            ariaLabel: 'Technologies',
                            name: 'technology',
                            readonly: true,
                            required: true,
                            validationMessage: 'Add at least one technology',
                        }),
                    );
                },
            }),
        );
        await flush();

        const form = container.querySelector('form')!;
        const nativeSelect = container.querySelector('select') as HTMLSelectElement;
        expect(nativeSelect.required).toBe(false);
        expect(nativeSelect.validationMessage).toBe('');
        expect(form.checkValidity()).toBe(true);
    });

    it('keeps readonly values immutable and exposes accessible validation state', async () => {
        const onUpdate = vi.fn();
        const container = mountTagsInput(
            {
                defaultValue: ['Vue'],
                labelledby: 'technology-label',
                readonly: true,
                required: true,
            },
            { 'onUpdate:modelValue': onUpdate },
        );
        await flush();

        const inputElement = getInput(container);
        expect(inputElement.getAttribute('aria-label')).toBeNull();
        expect(inputElement.getAttribute('aria-labelledby')).toBe('technology-label');
        expect(inputElement.getAttribute('aria-required')).toBe('true');
        expect(inputElement.readOnly).toBe(true);
        expect(container.querySelector('.rp-tags-input__tag-remove')).toBeNull();

        input(inputElement, 'Vapor,');
        keydown(inputElement, 'Backspace');
        await flush();
        expect(onUpdate).not.toHaveBeenCalled();
        expect(getTags(container)).toEqual(['Vue']);
    });
});
