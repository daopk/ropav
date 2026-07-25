import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

import { createFileList, selectFiles } from '../../../tests/utils/files';
import { flush, mountDom } from '../../../tests/utils/vue';
import FileInput from './file-input.vue';
import type { FileInputProps } from './types';

function mountFileInput(props: FileInputProps = {}, listeners: Record<string, unknown> = {}) {
    return mountDom(
        defineComponent({
            render() {
                return h(FileInput, {
                    ariaLabel: 'Attachments',
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

describe('FileInput', () => {
    it('emits selected files and renders their names', async () => {
        const onUpdate = vi.fn();
        const container = mountFileInput({ multiple: true }, { 'onUpdate:modelValue': onUpdate });
        const input = container.querySelector('input') as HTMLInputElement;
        const files = [
            new File(['first'], 'first.png', { type: 'image/png' }),
            new File(['second'], 'second.png', { type: 'image/png' }),
        ];

        selectFiles(input, files);
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(files);
        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'first.png, second.png',
        );
        expect(
            container.querySelector('.rp-file-input')?.classList.contains('rp-file-input--filled'),
        ).toBe(true);
    });

    it('keeps only one file when multiple is false', async () => {
        const onUpdate = vi.fn();
        const container = mountFileInput({}, { 'onUpdate:modelValue': onUpdate });
        const files = [new File(['first'], 'first.txt'), new File(['second'], 'second.txt')];

        selectFiles(container.querySelector('input') as HTMLInputElement, files);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith([files[0]]);
        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'first.txt',
        );
    });

    it('normalizes an external model to the multiple contract', async () => {
        const files = [new File(['first'], 'first.txt'), new File(['second'], 'second.txt')];
        const container = mountFileInput({ modelValue: files });
        await flush();

        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'first.txt',
        );
    });

    it('applies native file attributes, state, and ARIA props', async () => {
        const container = mountFileInput({
            id: 'attachments-control',
            name: 'attachments',
            form: 'profile-form',
            accept: 'image/*,.pdf',
            capture: 'environment',
            multiple: true,
            describedby: 'attachments-help attachments-error',
            labelledby: 'attachments-label',
            disabled: true,
            required: true,
            invalid: true,
            valid: true,
        });
        await flush();

        const root = container.querySelector('.rp-file-input')!;
        const input = container.querySelector('input') as HTMLInputElement;

        expect(input.type).toBe('file');
        expect(input.id).toBe('attachments-control');
        expect(input.name).toBe('attachments');
        expect(input.getAttribute('form')).toBe('profile-form');
        expect(input.accept).toBe('image/*,.pdf');
        expect(input.getAttribute('capture')).toBe('environment');
        expect(input.multiple).toBe(true);
        expect(input.disabled).toBe(true);
        expect(input.required).toBe(true);
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-labelledby')).toBe('attachments-label');
        expect(input.getAttribute('aria-describedby')).toBe('attachments-help attachments-error');
        expect(root.classList.contains('rp-file-input--disabled')).toBe(true);
        expect(root.classList.contains('rp-file-input--invalid')).toBe(true);
        expect(root.classList.contains('rp-file-input--valid')).toBe(false);
    });

    it('forwards native attributes and events without overriding owned props', async () => {
        const onBlur = vi.fn();
        const onChange = vi.fn();
        const container = mountFileInput({
            id: 'owned-id',
            accept: 'image/*',
            inputAttrs: {
                id: 'ignored-id',
                accept: '.txt',
                autocomplete: 'off',
                class: 'native-class',
                value: 'ignored-value',
                onBlur,
                onChange,
            },
        });
        const input = container.querySelector('input') as HTMLInputElement;

        input.dispatchEvent(new FocusEvent('blur'));
        selectFiles(input, [new File(['avatar'], 'avatar.png')]);
        await flush();

        expect(input.id).toBe('owned-id');
        expect(input.value).toBe('');
        expect(input.accept).toBe('image/*');
        expect(input.classList.contains('rp-file-input__native')).toBe(true);
        expect(input.classList.contains('native-class')).toBe(true);
        expect(input.autocomplete).toBe('off');
        expect(onBlur).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledOnce();
    });

    it('wires classNames and styles to every public semantic part', async () => {
        const container = mountFileInput({
            classNames: {
                root: 'custom-root',
                input: 'custom-input',
                trigger: 'custom-trigger',
                value: 'custom-value',
            },
            styles: {
                root: { maxWidth: '321px' },
                input: { cursor: 'crosshair' },
                trigger: { fontWeight: 700 },
                value: { letterSpacing: '2px' },
            },
        });
        await flush();

        const root = container.querySelector('.rp-file-input') as HTMLElement;
        const input = container.querySelector('.rp-file-input__native') as HTMLInputElement;
        const trigger = container.querySelector('.rp-file-input__trigger') as HTMLSpanElement;
        const value = container.querySelector('.rp-file-input__value') as HTMLSpanElement;

        expect(root.classList).toContain('custom-root');
        expect(root.style.maxWidth).toBe('321px');
        expect(input.classList).toContain('custom-input');
        expect(input.style.cursor).toBe('crosshair');
        expect(trigger.classList).toContain('custom-trigger');
        expect(trigger.style.fontWeight).toBe('700');
        expect(value.classList).toContain('custom-value');
        expect(value.style.letterSpacing).toBe('2px');
    });

    it('updates the display when a controlled model is cleared', async () => {
        const modelValue = ref<File[]>([]);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(FileInput, {
                        ariaLabel: 'Resume',
                        modelValue: modelValue.value,
                        'onUpdate:modelValue': (value: File[]) => {
                            modelValue.value = value;
                        },
                    });
                },
            }),
        );
        const input = container.querySelector('input') as HTMLInputElement;

        selectFiles(input, [new File(['resume'], 'resume.pdf')]);
        await flush();
        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'resume.pdf',
        );

        modelValue.value = [];
        await flush();

        expect(input.value).toBe('');
        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'No file selected',
        );
    });

    it('resets uncontrolled selection with its form', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('form', h(FileInput, { ariaLabel: 'Resume', name: 'resume' }));
                },
            }),
        );
        const input = container.querySelector('input') as HTMLInputElement;

        selectFiles(input, [new File(['resume'], 'resume.pdf')]);
        await flush();
        Object.defineProperty(input, 'files', {
            configurable: true,
            value: createFileList([]),
        });

        container.querySelector('form')?.reset();
        await Promise.resolve();
        await flush();

        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'No file selected',
        );
    });

    it('applies and clears a custom validation message', async () => {
        const props = reactive({ validationMessage: 'Attach a supported file.' });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(FileInput, { ariaLabel: 'Attachment', ...props });
                },
            }),
        );
        await flush();

        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.validationMessage).toBe('Attach a supported file.');
        expect(input.checkValidity()).toBe(false);

        props.validationMessage = '';
        await flush();

        expect(input.validationMessage).toBe('');
        expect(input.checkValidity()).toBe(true);
    });

    it('exposes the native element and input commands', async () => {
        const inputRef = ref<{
            nativeElement: HTMLInputElement | null;
            clear: () => void;
            focus: () => void;
        } | null>(null);
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(FileInput, {
                        ref: inputRef,
                        ariaLabel: 'Attachment',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );
        await flush();

        const input = container.querySelector('input') as HTMLInputElement;
        expect(inputRef.value?.nativeElement).toBe(input);

        inputRef.value?.focus();
        expect(document.activeElement).toBe(input);

        selectFiles(input, [new File(['avatar'], 'avatar.png')]);
        await nextTick();
        inputRef.value?.clear();
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith([]);
        expect(container.querySelector('.rp-file-input__value')?.textContent?.trim()).toBe(
            'No file selected',
        );
    });

    it('supports custom trigger and value slots', async () => {
        const file = new File(['avatar'], 'avatar.png');
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        FileInput,
                        { ariaLabel: 'Avatar', modelValue: [file] },
                        {
                            trigger: ({ files }: { files: File[] }) =>
                                h('span', { class: 'custom-trigger' }, `Pick (${files.length})`),
                            value: ({ fileNames }: { fileNames: string[] }) =>
                                h('span', { class: 'custom-value' }, fileNames.join(' / ')),
                        },
                    );
                },
            }),
        );
        await flush();

        expect(container.querySelector('.custom-trigger')?.textContent).toBe('Pick (1)');
        expect(container.querySelector('.custom-value')?.textContent).toBe('avatar.png');
    });
});
