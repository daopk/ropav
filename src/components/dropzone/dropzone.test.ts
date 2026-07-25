import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';

import { createFileList, makeInputFilesMutable, selectFiles } from '../../../tests/utils/files';
import { flush, mountDom } from '../../../tests/utils/vue';
import Dropzone from './dropzone.vue';
import type { DropzoneProps, DropzoneSelection } from './types';

function createDataTransfer(files: File[]) {
    return {
        files: createFileList(files),
        items: files.map((file) => ({
            kind: 'file',
            type: file.type,
            getAsFile: () => file,
        })),
        types: ['Files'],
        dropEffect: 'none',
    } as unknown as DataTransfer;
}

function dispatchDrag(element: Element, type: string, files: File[]) {
    const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', {
        configurable: true,
        value: createDataTransfer(files),
    });
    element.dispatchEvent(event);
    return event;
}

function mountDropzone(props: DropzoneProps = {}, listeners: Record<string, unknown> = {}) {
    return mountDom(
        defineComponent({
            render() {
                return h(Dropzone, {
                    ariaLabel: 'Upload attachments',
                    ...props,
                    ...listeners,
                });
            },
        }),
    );
}

describe('Dropzone', () => {
    it('accepts native picker selections and updates its model', async () => {
        const onUpdate = vi.fn();
        const onDrop = vi.fn();
        const container = mountDropzone(
            { accept: 'image/*', multiple: true },
            { 'onUpdate:modelValue': onUpdate, onDrop },
        );
        const files = [
            new File(['first'], 'first.png', { type: 'image/png' }),
            new File(['second'], 'second.png', { type: 'image/png' }),
        ];

        selectFiles(container.querySelector('input') as HTMLInputElement, files);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(files);
        expect(onDrop).toHaveBeenCalledWith({
            acceptedFiles: files,
            rejections: [],
        } satisfies DropzoneSelection);
        expect(container.querySelector('.rp-dropzone')?.getAttribute('data-filled')).toBe('');
    });

    it('restores the existing native selection when the picker selection is rejected', async () => {
        const initial = new File(['initial'], 'initial.png', { type: 'image/png' });
        const rejected = new File(['rejected'], 'rejected.txt', { type: 'text/plain' });
        const onUpdate = vi.fn();
        const onReject = vi.fn();
        const container = mountDropzone(
            { accept: 'image/*', modelValue: [initial], multiple: true },
            { 'onUpdate:modelValue': onUpdate, onReject },
        );
        const input = container.querySelector('input') as HTMLInputElement;
        const mutableFiles = makeInputFilesMutable(input, [initial]);
        await flush();

        expect(Array.from(input.files ?? [])).toEqual([initial]);

        mutableFiles.replace([rejected]);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await flush();

        expect(Array.from(input.files ?? [])).toEqual([initial]);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(onReject).toHaveBeenCalledOnce();
    });

    it('shows drag acceptance and rejects invalid dropped files', async () => {
        const onUpdate = vi.fn();
        const onDrop = vi.fn();
        const onReject = vi.fn();
        const container = mountDropzone(
            { accept: 'image/*', maxSize: 5, multiple: true },
            { 'onUpdate:modelValue': onUpdate, onDrop, onReject },
        );
        const root = container.querySelector('.rp-dropzone')!;
        const accepted = new File(['ok'], 'avatar.png', { type: 'image/png' });
        const invalidType = new File(['text'], 'notes.txt', { type: 'text/plain' });
        const tooLarge = new File(['too large'], 'cover.png', { type: 'image/png' });

        const enterEvent = dispatchDrag(root, 'dragenter', [accepted]);
        await flush();

        expect(enterEvent.defaultPrevented).toBe(true);
        expect(root.getAttribute('data-state')).toBe('accept');
        expect(root.getAttribute('data-dragging')).toBe('');

        dispatchDrag(root, 'dragleave', [accepted]);
        await flush();
        expect(root.getAttribute('data-state')).toBe('idle');

        dispatchDrag(root, 'dragenter', [invalidType]);
        await flush();
        expect(root.getAttribute('data-state')).toBe('reject');

        const dropEvent = dispatchDrag(root, 'drop', [accepted, invalidType, tooLarge]);
        await flush();

        expect(dropEvent.defaultPrevented).toBe(true);
        expect(root.getAttribute('data-state')).toBe('idle');
        expect(onUpdate).toHaveBeenCalledWith([accepted]);
        expect(onDrop).toHaveBeenCalledOnce();
        expect(onDrop.mock.calls[0]?.[0].acceptedFiles).toEqual([accepted]);
        expect(
            onDrop.mock.calls[0]?.[0].rejections.map(
                ({ errors }: { errors: Array<{ code: string }> }) => errors[0]?.code,
            ),
        ).toEqual(['file-invalid-type', 'file-too-large']);
        expect(onReject).toHaveBeenCalledWith(onDrop.mock.calls[0]?.[0].rejections);
    });

    it('rejects incompatible MIME types while the drag data store is protected', async () => {
        const container = mountDropzone({ accept: 'image/*' });
        const root = container.querySelector('.rp-dropzone')!;
        const event = new Event('dragenter', {
            bubbles: true,
            cancelable: true,
        }) as DragEvent;
        Object.defineProperty(event, 'dataTransfer', {
            configurable: true,
            value: {
                files: createFileList([]),
                items: [
                    {
                        kind: 'file',
                        type: 'text/plain',
                        getAsFile: () => null,
                    },
                ],
                types: ['Files'],
                dropEffect: 'none',
            } as unknown as DataTransfer,
        });

        root.dispatchEvent(event);
        await flush();

        expect(root.getAttribute('data-state')).toBe('reject');
    });

    it('enforces maxFiles and the single-file contract', async () => {
        const onDrop = vi.fn();
        const container = mountDropzone({ multiple: false, maxFiles: 4 }, { onDrop });
        const files = [new File(['one'], 'one.txt'), new File(['two'], 'two.txt')];

        dispatchDrag(container.querySelector('.rp-dropzone')!, 'drop', files);
        await flush();

        const selection = onDrop.mock.calls[0]?.[0] as DropzoneSelection;
        expect(selection.acceptedFiles).toEqual([files[0]]);
        expect(selection.rejections[0]?.file).toBe(files[1]);
        expect(selection.rejections[0]?.errors[0]?.code).toBe('too-many-files');
    });

    it('keeps the native input keyboard accessible beside interactive slot content', async () => {
        const onNestedClick = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Dropzone,
                        { ariaLabel: 'Upload' },
                        {
                            default: () =>
                                h(
                                    'button',
                                    { type: 'button', onClick: onNestedClick },
                                    'Nested action',
                                ),
                        },
                    );
                },
            }),
        );
        const input = container.querySelector('input') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click');

        input.focus();
        (container.querySelector('button') as HTMLButtonElement).click();
        await flush();

        expect(document.activeElement).toBe(input);
        expect(input.tabIndex).toBe(0);
        expect(onNestedClick).toHaveBeenCalledOnce();
        expect(clickSpy).not.toHaveBeenCalled();
    });

    it('does not activate or accept drops while disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDropzone({ disabled: true }, { 'onUpdate:modelValue': onUpdate });
        const root = container.querySelector('.rp-dropzone') as HTMLElement;
        const input = container.querySelector('input') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click');

        root.click();
        dispatchDrag(root, 'drop', [new File(['file'], 'file.txt')]);
        await flush();

        expect(clickSpy).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
        expect(root.hasAttribute('role')).toBe(false);
        expect(input.disabled).toBe(true);
    });

    it('forwards form, ARIA, styles, and native input attributes', async () => {
        const onBlur = vi.fn();
        const container = mountDropzone({
            id: 'attachments-control',
            name: 'attachments',
            form: 'profile-form',
            accept: 'image/*,.pdf',
            capture: 'environment',
            maxFiles: 3,
            describedby: 'attachments-help',
            labelledby: 'attachments-label',
            required: true,
            invalid: true,
            classNames: { content: 'custom-content' },
            styles: { label: { letterSpacing: '1px' } },
            inputAttrs: {
                id: 'ignored-id',
                accept: '.txt',
                autocomplete: 'off',
                class: 'native-class',
                onBlur,
            },
        });
        const input = container.querySelector('input') as HTMLInputElement;

        input.dispatchEvent(new FocusEvent('blur'));
        await flush();

        expect(input.id).toBe('attachments-control');
        expect(input.name).toBe('attachments');
        expect(input.getAttribute('form')).toBe('profile-form');
        expect(input.accept).toBe('image/*,.pdf');
        expect(input.getAttribute('capture')).toBe('environment');
        expect(input.required).toBe(true);
        expect(input.autocomplete).toBe('off');
        expect(input.classList.contains('native-class')).toBe(true);
        expect(input.getAttribute('aria-labelledby')).toBe('attachments-label');
        expect(input.getAttribute('aria-describedby')).toBe('attachments-help');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(container.querySelector('.custom-content')).toBeTruthy();
        expect(
            (container.querySelector('.rp-dropzone__label') as HTMLElement).style.letterSpacing,
        ).toBe('1px');
        expect(onBlur).toHaveBeenCalledOnce();
    });

    it('associates its fallback description with the native input', () => {
        const container = mountDropzone({
            describedby: 'external-help',
            description: 'PDF files up to 5 MB.',
        });
        const input = container.querySelector('input') as HTMLInputElement;
        const description = container.querySelector(
            '.rp-dropzone__description',
        ) as HTMLParagraphElement;
        const describedby = input.getAttribute('aria-describedby')?.split(/\s+/);

        expect(description.id).not.toBe('');
        expect(describedby).toEqual(expect.arrayContaining(['external-help', description.id]));
    });

    it('exposes selection state and commands to the default slot', async () => {
        const modelValue = ref<File[]>([new File(['report'], 'report.pdf')]);
        const exposed = ref<{
            nativeElement: HTMLInputElement | null;
            rootElement: HTMLElement | null;
            open: () => void;
            clear: () => void;
            focus: () => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Dropzone,
                        {
                            ref: exposed,
                            ariaLabel: 'Upload',
                            modelValue: modelValue.value,
                            'onUpdate:modelValue': (files: File[]) => {
                                modelValue.value = files;
                            },
                        },
                        {
                            default: ({ files, status }: { files: File[]; status: string }) =>
                                h('span', { class: 'slot-state' }, `${files.length}:${status}`),
                        },
                    );
                },
            }),
        );
        await flush();

        expect(container.querySelector('.slot-state')?.textContent).toBe('1:idle');
        expect(exposed.value?.nativeElement).toBe(container.querySelector('input'));
        expect(exposed.value?.rootElement).toBe(container.querySelector('.rp-dropzone'));

        const clickSpy = vi.spyOn(exposed.value!.nativeElement!, 'click');
        exposed.value?.open();
        expect(clickSpy).toHaveBeenCalledOnce();

        exposed.value?.focus();
        expect(document.activeElement).toBe(exposed.value?.nativeElement);

        exposed.value?.clear();
        await flush();
        expect(container.querySelector('.slot-state')?.textContent).toBe('0:idle');
    });

    it('applies and clears a custom validation message', async () => {
        const props = reactive({ validationMessage: 'Attach a supported file.' });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Dropzone, { ariaLabel: 'Attachment', ...props });
                },
            }),
        );
        await flush();

        const input = container.querySelector('input') as HTMLInputElement;
        expect(input.validationMessage).toBe('Attach a supported file.');

        props.validationMessage = '';
        await flush();
        expect(input.validationMessage).toBe('');
    });
});
