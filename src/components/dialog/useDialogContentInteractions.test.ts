import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref, shallowRef } from 'vue';
import { flush, mountDomWithApp } from '../../../tests/utils/vue';
import type { DialogRootContext } from './dialogContext';
import { useDialogContentInteractions } from './useDialogContentInteractions';

function createRootContext() {
    const open = ref(true);
    const contentRef = ref<HTMLElement | null>(null);
    const contentId = ref('test-dialog');
    const close = vi.fn();

    const root = {
        isOpen: computed(() => open.value),
        modal: computed(() => false),
        closeOnEscape: computed(() => true),
        closeOnOutsideClick: computed(() => true),
        contentRef,
        contentId,
        layer: {
            focusBranches: shallowRef<readonly HTMLElement[]>([]),
            isTopLayer: () => true,
            isInside: () => false,
        },
        close,
        setContent(element: HTMLElement | null, id: string) {
            contentRef.value = element;
            contentId.value = id;
        },
    } as unknown as DialogRootContext;

    return { root, close };
}

function dispatchPointerdown(target: HTMLElement) {
    const EventConstructor = target.ownerDocument.defaultView?.Event ?? Event;
    target.dispatchEvent(new EventConstructor('pointerdown', { bubbles: true, cancelable: true }));
}

describe('useDialogContentInteractions', () => {
    it('rebinds document listeners with the content owner and removes them on unmount', async () => {
        const firstContent = document.createElement('section');
        const frame = document.createElement('iframe');
        document.body.append(firstContent, frame);
        const frameDocument = frame.contentDocument!;
        const secondContent = frameDocument.createElement('section');
        frameDocument.body.append(secondContent);

        const { root, close } = createRootContext();
        let setElement!: ReturnType<typeof useDialogContentInteractions>['setElement'];
        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    ({ setElement } = useDialogContentInteractions(
                        root,
                        { focusTrapOptions: {} },
                        {
                            escapeKeyDown: vi.fn(),
                            pointerDownOutside: vi.fn(),
                            interactOutside: vi.fn(),
                        },
                    ));
                    return () => h('div');
                },
            }),
        );

        setElement(firstContent);
        await flush();
        dispatchPointerdown(document.body);
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenLastCalledWith('outside');

        setElement(secondContent);
        await flush();
        dispatchPointerdown(document.body);
        expect(close).toHaveBeenCalledTimes(1);

        dispatchPointerdown(frameDocument.body);
        expect(close).toHaveBeenCalledTimes(2);
        expect(close).toHaveBeenLastCalledWith('outside');

        unmount();
        dispatchPointerdown(frameDocument.body);
        expect(close).toHaveBeenCalledTimes(2);
    });
});
