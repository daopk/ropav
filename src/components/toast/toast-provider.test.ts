import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { click, flush, mountDom, waitTransition } from '../../../tests/utils/vue';
import TeleportProvider from '../teleport-provider/teleport-provider.vue';
import ToastProvider from './toast-provider.vue';
import { createToastStore } from './toast-store';
import ToastViewport from './toast-viewport.vue';
import type { UseToastReturn } from './types';
import { useToast } from './useToast';

const updateOptionsExcludeId: 'id' extends keyof Parameters<UseToastReturn['update']>[1]
    ? never
    : true = true;
void updateOptionsExcludeId;

function mountToastSystem(
    providerProps: Record<string, unknown> = {},
    options: { viewport?: boolean } = {},
) {
    let api: UseToastReturn | undefined;

    const Controls = defineComponent({
        setup() {
            api = useToast();
            return () => h('button', { id: 'toast-trigger' }, 'Show toast');
        },
    });

    const container = mountDom(
        defineComponent({
            render() {
                return h(ToastProvider, providerProps, {
                    default: () => [
                        h(Controls),
                        options.viewport === false ? null : h(ToastViewport, { teleport: false }),
                    ],
                });
            },
        }),
    );

    if (!api) throw new Error('Toast API was not provided');
    return { api, container };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('ToastProvider', () => {
    it('requires a provider for useToast and ToastViewport', () => {
        const Consumer = defineComponent({
            setup() {
                useToast();
                return () => null;
            },
        });

        expect(() => mountDom(Consumer)).toThrow(
            '[Ropav] useToast() must be used inside <ToastProvider>.',
        );
        expect(() => mountDom(ToastViewport)).toThrow(
            '[Ropav] <ToastViewport> must be used inside <ToastProvider>.',
        );
    });

    it('creates typed global toasts and renders the newest toast first', async () => {
        const { api, container } = mountToastSystem({ duration: 0 });

        const successId = api.success('Changes saved', {
            description: 'Your preferences are up to date.',
            variant: 'surface',
        });
        const errorId = api.error({ title: 'Save failed', duration: 0 });
        await flush();

        const toasts = [...container.querySelectorAll<HTMLElement>('.rp-toast')];
        const viewport = container.querySelector('.rp-toast-viewport') as HTMLElement;
        expect(toasts).toHaveLength(2);
        expect(viewport.style.zIndex).toBe('1001');
        expect(
            toasts.map((toast) => toast.querySelector('.rp-toast__title')?.textContent?.trim()),
        ).toEqual(['Save failed', 'Changes saved']);
        expect(toasts[0].getAttribute('role')).toBe('alert');
        expect(toasts[0].style.getPropertyValue('--_rp-toast-icon-fg')).toBe(
            'var(--rp-color-red-light-color)',
        );
        expect(toasts[1].style.getPropertyValue('--_rp-toast-icon-fg')).toBe(
            'var(--rp-color-green-light-color)',
        );
        expect(api.toasts.value.map((toast) => toast.id)).toEqual([successId, errorId]);
    });

    it('uses the shared teleport provider for the viewport', async () => {
        const portal = document.createElement('div');
        document.body.append(portal);
        let api: UseToastReturn | undefined;
        const Controls = defineComponent({
            setup() {
                api = useToast();
                return () => null;
            },
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        TeleportProvider,
                        { teleportTo: portal },
                        {
                            default: () =>
                                h(
                                    ToastProvider,
                                    { duration: 0 },
                                    {
                                        default: () => [h(Controls), h(ToastViewport)],
                                    },
                                ),
                        },
                    );
                },
            }),
        );

        api?.show('Provided viewport');
        await flush();

        expect(container.querySelector('.rp-toast-viewport')).toBeNull();
        expect(portal.querySelector('.rp-toast__title')?.textContent).toContain(
            'Provided viewport',
        );
    });

    it('updates and dismisses a toast through the global API', async () => {
        const onClose = vi.fn();
        const { api, container } = mountToastSystem({ duration: 0 });
        const id = api.show('Uploading', { onClose });
        await flush();

        api.update(id, { title: 'Upload complete', color: 'green' });
        await flush();

        const toast = container.querySelector('.rp-toast') as HTMLElement;
        expect(toast.querySelector('.rp-toast__title')?.textContent?.trim()).toBe(
            'Upload complete',
        );
        expect(toast.style.getPropertyValue('--_rp-toast-icon-fg')).toBe(
            'var(--rp-color-green-light-color)',
        );

        api.dismiss(id);
        await waitTransition();

        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith('dismiss');
        expect(container.querySelector('.rp-toast')).toBeNull();
        expect(api.toasts.value).toHaveLength(0);
    });

    it('re-resolves type defaults without overriding provider or caller values', () => {
        const defaults = mountToastSystem({ duration: 0 });
        const defaultId = defaults.api.error('Failed');

        expect(defaults.api.toasts.value[0].props).toMatchObject({
            color: 'red',
            role: 'alert',
        });

        defaults.api.update(defaultId, { type: 'info' });
        expect(defaults.api.toasts.value[0].props.color).toBe('blue');
        expect(defaults.api.toasts.value[0].props.role).toBeUndefined();

        defaults.api.update(defaultId, { color: 'green', role: 'none' });
        defaults.api.update(defaultId, { type: 'warning' });
        expect(defaults.api.toasts.value[0].props).toMatchObject({
            color: 'green',
            role: 'none',
        });

        const provider = mountToastSystem({ color: 'green', duration: 0, role: 'status' });
        const providerId = provider.api.error('Failed');
        expect(provider.api.toasts.value[0].props).toMatchObject({
            color: 'green',
            role: 'status',
        });

        provider.api.update(providerId, { type: 'info' });
        expect(provider.api.toasts.value[0].props).toMatchObject({
            color: 'green',
            role: 'status',
        });
    });

    it('enforces the provider maximum and overflows the oldest toast', async () => {
        const onOldestClose = vi.fn();
        const { api, container } = mountToastSystem({ duration: 0, max: 2 });

        api.show('First', { onClose: onOldestClose });
        api.show('Second');
        api.show('Third');
        await flush();

        const titles = [...container.querySelectorAll('.rp-toast__title')].map((title) =>
            title.textContent?.trim(),
        );
        expect(titles).toEqual(['Third', 'Second']);
        expect(onOldestClose).toHaveBeenCalledWith('overflow');
        expect(api.toasts.value).toHaveLength(2);
    });

    it('commits overflow before callbacks run so re-entrant creation is safe', () => {
        const { api } = mountToastSystem({ duration: 0, max: 1 });
        const onClose = vi.fn(() => api.show('Created from callback'));

        api.show('First', { onClose });
        expect(() => api.show('Second')).not.toThrow();

        expect(onClose).toHaveBeenCalledOnce();
        expect(api.toasts.value).toHaveLength(1);
        expect(api.toasts.value[0].props.title).toBe('Created from callback');
    });

    it('removes a toast dismissed in the same tick, even before it renders', async () => {
        const onClose = vi.fn();
        const { api, container } = mountToastSystem({ duration: 0 });

        const id = api.show('Transient', { onClose });
        api.dismiss(id);
        await flush();

        expect(onClose).toHaveBeenCalledOnce();
        expect(api.toasts.value).toHaveLength(0);
        expect(container.querySelector('.rp-toast')).toBeNull();
    });

    it('does not retain dismissed state when no viewport is mounted', () => {
        const onClose = vi.fn();
        const { api } = mountToastSystem({ duration: 0 }, { viewport: false });

        const id = api.show('Headless', { onClose });
        api.dismiss(id, 'timeout');
        api.dismiss(id, 'dismiss');

        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith('timeout');
        expect(api.toasts.value).toHaveLength(0);
    });

    it('animates programmatic dismissal without allowing a duplicate timeout', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        const { api, container } = mountToastSystem();
        const id = api.show('Leaving', { duration: 1000, onClose });
        await flush();

        vi.advanceTimersByTime(900);
        api.dismiss(id);

        expect(api.toasts.value).toHaveLength(0);
        expect(onClose).toHaveBeenCalledOnce();
        expect(container.querySelector('.rp-toast')).not.toBeNull();

        await flush();
        expect(
            container
                .querySelector('.rp-toast-viewport')
                ?.classList.contains('rp-toast-viewport--empty'),
        ).toBe(true);
        expect(container.querySelector('.rp-toast-viewport-item-leave-active')).not.toBeNull();

        vi.advanceTimersByTime(1100);
        await flush();

        expect(onClose).toHaveBeenCalledOnce();
        expect(container.querySelector('.rp-toast')).toBeNull();
    });

    it('replaces a duplicate custom id with a fresh timer and callback lifecycle', async () => {
        vi.useFakeTimers();
        const displacedClose = vi.fn();
        const replacementClose = vi.fn();
        const { api } = mountToastSystem();

        const id = api.show('First', {
            id: 'upload',
            duration: 1000,
            onClose: displacedClose,
        });
        await flush();
        const firstInstanceId = api.toasts.value[0].instanceId;
        vi.advanceTimersByTime(900);

        expect(
            api.show('Replacement', {
                id: 'upload',
                duration: 1000,
                onClose: replacementClose,
            }),
        ).toBe(id);
        await flush();

        expect(displacedClose).toHaveBeenCalledOnce();
        expect(displacedClose).toHaveBeenCalledWith('replace');
        expect(api.toasts.value[0].instanceId).not.toBe(firstInstanceId);
        expect(api.toasts.value[0].props.title).toBe('Replacement');

        vi.advanceTimersByTime(999);
        await flush();
        expect(replacementClose).not.toHaveBeenCalled();
        expect(api.toasts.value).toHaveLength(1);

        vi.advanceTimersByTime(1);
        await flush();
        expect(replacementClose).toHaveBeenCalledOnce();
        expect(replacementClose).toHaveBeenCalledWith('timeout');
        expect(api.toasts.value).toHaveLength(0);
    });

    it('closes a managed toast from its dismiss button', async () => {
        const onClose = vi.fn();
        const { api, container } = mountToastSystem({ duration: 0 });
        api.info('Connected', { onClose });
        await flush();

        click(container.querySelector('.rp-toast__close') as HTMLButtonElement);
        await waitTransition();

        expect(onClose).toHaveBeenCalledWith('dismiss');
        expect(api.toasts.value).toHaveLength(0);
    });

    it('renders a pre-mount external store and starts its timer only after mount', async () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        const store = createToastStore({ color: 'green', duration: 1000 });
        const id = store.show('Before mount', { onClose });

        store.update(id, { description: 'Updated before mount' });
        vi.advanceTimersByTime(5000);

        expect(onClose).not.toHaveBeenCalled();
        expect(store.toasts.value).toHaveLength(1);

        const { api, container } = mountToastSystem({
            color: 'red',
            duration: 1,
            store,
        });
        await flush();

        expect(api.toasts).toBe(store.toasts);
        expect(container.querySelector('.rp-toast__title')?.textContent).toContain('Before mount');
        expect(container.querySelector('.rp-toast__description')?.textContent).toContain(
            'Updated before mount',
        );
        expect(store.toasts.value[0].props).toMatchObject({ color: 'green', duration: 1000 });

        vi.advanceTimersByTime(999);
        await flush();
        expect(onClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        await flush();
        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith('timeout');
        expect(store.toasts.value).toHaveLength(0);
    });

    it('retains external store state while its provider is unmounted', async () => {
        const store = createToastStore({ duration: 0 });
        const providerMounted = ref(true);
        const container = mountDom(
            defineComponent({
                render() {
                    return providerMounted.value
                        ? h(
                              ToastProvider,
                              { store },
                              { default: () => h(ToastViewport, { teleport: false }) },
                          )
                        : null;
                },
            }),
        );

        store.show('Persistent');
        await flush();
        expect(container.querySelector('.rp-toast__title')?.textContent).toContain('Persistent');

        providerMounted.value = false;
        await flush();
        expect(container.querySelector('.rp-toast')).toBeNull();
        expect(store.toasts.value).toHaveLength(1);

        providerMounted.value = true;
        await flush();
        expect(container.querySelector('.rp-toast__title')?.textContent).toContain('Persistent');
    });

    it('keeps a provider-scoped store in sync with reactive max props', async () => {
        const max = ref(3);
        const onFirstClose = vi.fn();
        const onSecondClose = vi.fn();
        let api: UseToastReturn | undefined;

        const Consumer = defineComponent({
            setup() {
                api = useToast();
                return () => null;
            },
        });

        mountDom(
            defineComponent({
                render() {
                    return h(
                        ToastProvider,
                        { duration: 0, max: max.value },
                        { default: () => h(Consumer) },
                    );
                },
            }),
        );

        api?.show('First', { onClose: onFirstClose });
        api?.show('Second', { onClose: onSecondClose });
        api?.show('Third');
        max.value = 1;
        await flush();

        expect(api?.toasts.value.map((toast) => toast.props.title)).toEqual(['Third']);
        expect(onFirstClose).toHaveBeenCalledWith('overflow');
        expect(onSecondClose).toHaveBeenCalledWith('overflow');
    });
});
