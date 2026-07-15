import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { click, flush, mountDom, waitTransition } from '../../../tests/utils/vue';
import Toast from './toast.vue';
import type { ToastCloseReason, UseToastStateReturn } from './types';
import { useToastState } from './useToastState';

describe('useToastState', () => {
    it('manages uncontrolled visibility and close reasons', () => {
        const openChanges: boolean[] = [];
        const closeReasons: ToastCloseReason[] = [];
        const toast = useToastState({
            onOpenChange: (open) => openChanges.push(open),
            onClose: (reason) => closeReasons.push(reason),
        });

        expect(toast.isOpen.value).toBe(false);
        expect(toast.lastCloseReason.value).toBeNull();

        toast.open();
        expect(toast.isOpen.value).toBe(true);

        toast.close('timeout');
        expect(toast.isOpen.value).toBe(false);
        expect(toast.lastCloseReason.value).toBe('timeout');

        toast.open();
        expect(toast.lastCloseReason.value).toBeNull();

        toast.toggle();
        expect(toast.isOpen.value).toBe(false);
        expect(toast.lastCloseReason.value).toBe('dismiss');
        expect(openChanges).toEqual([true, false, true, false]);
        expect(closeReasons).toEqual(['timeout', 'dismiss']);
    });

    it('supports controlled visibility through reactive options', () => {
        const controlledOpen = ref(false);
        const toast = useToastState({
            open: controlledOpen,
            onOpenChange: (open) => {
                controlledOpen.value = open;
            },
        });

        toast.open();
        expect(controlledOpen.value).toBe(true);
        expect(toast.isOpen.value).toBe(true);

        toast.close();
        expect(controlledOpen.value).toBe(false);
        expect(toast.isOpen.value).toBe(false);
    });

    it('clears the close reason when controlled visibility is reopened externally', () => {
        const controlledOpen = ref(true);
        const openChanges: boolean[] = [];
        const toast = useToastState({
            open: controlledOpen,
            onOpenChange: (open) => {
                openChanges.push(open);
                controlledOpen.value = open;
            },
        });

        toast.close('timeout');
        expect(toast.isOpen.value).toBe(false);
        expect(toast.lastCloseReason.value).toBe('timeout');

        controlledOpen.value = true;
        expect(toast.isOpen.value).toBe(true);
        expect(toast.lastCloseReason.value).toBeNull();
        expect(openChanges).toEqual([false]);
    });

    it('preserves the latest controlled visibility when becoming uncontrolled', () => {
        const controlledOpen = ref<boolean | undefined>(true);
        const toast = useToastState({
            defaultOpen: false,
            open: controlledOpen,
        });

        controlledOpen.value = undefined;
        expect(toast.isOpen.value).toBe(true);

        toast.close();
        expect(toast.isOpen.value).toBe(false);

        controlledOpen.value = true;
        controlledOpen.value = false;
        controlledOpen.value = undefined;
        expect(toast.isOpen.value).toBe(false);
    });

    it('provides bindable props that stay in sync with Toast events', async () => {
        let controller: UseToastStateReturn | undefined;
        const container = mountDom(
            defineComponent({
                setup() {
                    controller = useToastState({ defaultOpen: true });

                    return () =>
                        h(
                            Toast,
                            {
                                duration: 0,
                                ...controller?.toastProps.value,
                            },
                            { default: () => 'Managed toast' },
                        );
                },
            }),
        );

        await flush();
        expect(controller?.isOpen.value).toBe(true);

        click(container.querySelector('.rp-toast__close') as HTMLButtonElement);
        await waitTransition();

        expect(controller?.isOpen.value).toBe(false);
        expect(controller?.lastCloseReason.value).toBe('dismiss');
        expect(container.querySelector('.rp-toast')).toBeNull();
    });
});
