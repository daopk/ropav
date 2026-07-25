import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { createFileList } from '../../../tests/utils/files';
import { flush, mountDom } from '../../../tests/utils/vue';
import { useDropzone } from './useDropzone';
import type { DropzoneProps } from './types';

function createDragEvent(type: 'dragenter' | 'drop', files: File[], protectedMode = false) {
    const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', {
        configurable: true,
        value: {
            files: createFileList(protectedMode ? [] : files),
            items: files.map((file) => ({
                kind: 'file',
                type: file.type,
                getAsFile: () => (protectedMode ? null : file),
            })),
            types: ['Files'],
            dropEffect: 'none',
        } as unknown as DataTransfer,
    });
    return event;
}

function mountUseDropzone(props: DropzoneProps, callbacks: Parameters<typeof useDropzone>[1]) {
    let dropzone!: ReturnType<typeof useDropzone>;
    const container = mountDom(
        defineComponent({
            setup() {
                dropzone = useDropzone(props, callbacks);
                return () => h('input', { ref: dropzone.inputRef, type: 'file' });
            },
        }),
    );

    return { container, dropzone };
}

describe('useDropzone', () => {
    it('reports drag status and the resulting rejections through its interface', async () => {
        const accepted = new File(['image'], 'avatar.png', { type: 'image/png' });
        const rejected = new File(['text'], 'notes.txt', { type: 'text/plain' });
        const { dropzone } = mountUseDropzone(
            { accept: 'image/*', multiple: true },
            { onUpdate: vi.fn(), onDrop: vi.fn(), onReject: vi.fn() },
        );
        await flush();

        const rejectedEnter = createDragEvent('dragenter', [rejected], true);
        dropzone.onDragenter(rejectedEnter);

        expect(rejectedEnter.defaultPrevented).toBe(true);
        expect(dropzone.status.value).toBe('reject');

        dropzone.onDragleave();
        expect(dropzone.status.value).toBe('idle');

        dropzone.onDragenter(createDragEvent('dragenter', [accepted], true));
        expect(dropzone.status.value).toBe('accept');

        const dropEvent = createDragEvent('drop', [accepted, rejected]);
        dropzone.onDrop(dropEvent);

        expect(dropEvent.defaultPrevented).toBe(true);
        expect(dropzone.status.value).toBe('idle');
        expect(dropzone.files.value).toEqual([accepted]);
        expect(dropzone.rejections.value).toHaveLength(1);
        expect(dropzone.rejections.value[0]?.file).toBe(rejected);
        expect(dropzone.rejections.value[0]?.errors[0]?.code).toBe('file-invalid-type');
    });

    it('owns open, clear, and focus through its returned commands', async () => {
        const onUpdate = vi.fn();
        const accepted = new File(['image'], 'avatar.png', { type: 'image/png' });
        const rejected = new File(['text'], 'notes.txt', { type: 'text/plain' });
        const { container, dropzone } = mountUseDropzone(
            { accept: 'image/*', multiple: true },
            { onUpdate, onDrop: vi.fn(), onReject: vi.fn() },
        );
        await flush();

        const input = container.querySelector('input') as HTMLInputElement;
        let clickCount = 0;
        input.addEventListener('click', (event) => {
            event.preventDefault();
            clickCount += 1;
        });

        dropzone.focus();
        expect(document.activeElement).toBe(input);

        dropzone.open();
        expect(clickCount).toBe(1);

        dropzone.onDrop(createDragEvent('drop', [accepted, rejected]));
        expect(dropzone.files.value).toEqual([accepted]);
        expect(dropzone.rejections.value).toHaveLength(1);

        dropzone.clear();
        expect(dropzone.files.value).toEqual([]);
        expect(dropzone.rejections.value).toEqual([]);
        expect(onUpdate).toHaveBeenNthCalledWith(1, [accepted]);
        expect(onUpdate).toHaveBeenNthCalledWith(2, []);
    });
});
