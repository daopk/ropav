import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref, type ComputedRef } from 'vue';
import { flush, mountDom, mountDomWithApp } from '../../../tests/utils/vue';
import DialogContent from '../dialog/dialog-content.vue';
import DialogOverlay from '../dialog/dialog-overlay.vue';
import DialogRoot from '../dialog/dialog-root.vue';
import DropdownMenu from '../dropdown-menu/dropdown-menu.vue';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRoot,
} from '../dropdown-menu/dropdown-menu-primitives';
import type { DropdownMenuSlotProps } from '../dropdown-menu/types';
import Modal from '../modal/modal.vue';
import Popover from '../popover/popover.vue';
import type { PopoverSlotProps } from '../popover/types';
import ToastProvider from '../toast/toast-provider.vue';
import ToastViewport from '../toast/toast-viewport.vue';
import Tooltip from '../tooltip/tooltip.vue';
import OverlayLayerProvider from './overlay-layer-provider.vue';
import { useOverlayZIndex } from './useOverlayZIndex';

describe('OverlayLayerProvider', () => {
    it('resolves local, nearest-provider, offset, and reactive values', async () => {
        const outerBase = ref(2000);
        const innerBase = ref(3000);
        const localBase = ref<number>();
        let inherited!: ComputedRef<number>;
        let nested!: ComputedRef<number>;

        const OuterProbe = defineComponent({
            setup() {
                inherited = useOverlayZIndex();
                return () => null;
            },
        });
        const InnerProbe = defineComponent({
            setup() {
                nested = useOverlayZIndex({
                    baseZIndex: localBase,
                    offset: 2,
                    aboveParent: false,
                });
                return () => null;
            },
        });

        mountDom(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: outerBase.value },
                        {
                            default: () => [
                                h(OuterProbe),
                                h(
                                    OverlayLayerProvider,
                                    { baseZIndex: innerBase.value },
                                    { default: () => h(InnerProbe) },
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        expect(inherited.value).toBe(2000);
        expect(nested.value).toBe(3002);

        outerBase.value = 2100;
        innerBase.value = 3100;
        await flush();
        expect(inherited.value).toBe(2100);
        expect(nested.value).toBe(3102);

        localBase.value = 4000;
        await flush();
        expect(nested.value).toBe(4002);
    });

    it('places custom portal values above a parent layer unless opted out', () => {
        let aboveParent!: ComputedRef<number>;
        let floorOnly!: ComputedRef<number>;

        const Probe = defineComponent({
            setup() {
                aboveParent = useOverlayZIndex({ baseZIndex: 4000 });
                floorOnly = useOverlayZIndex({ baseZIndex: 4000, aboveParent: false });
                return () => null;
            },
        });

        mountDom(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5000 },
                        {
                            default: () => h(DialogRoot, null, { default: () => h(Probe) }),
                        },
                    );
                },
            }),
        );

        expect(aboveParent.value).toBe(5001);
        expect(floorOnly.value).toBe(4000);
    });

    it('reindexes an open dialog when provider or local base changes', async () => {
        const providerBase = ref(5000);
        const localBase = ref<number>();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: providerBase.value },
                        {
                            default: () =>
                                h(
                                    DialogRoot,
                                    {
                                        defaultOpen: true,
                                        modal: false,
                                        baseZIndex: localBase.value,
                                    },
                                    {
                                        default: () => [
                                            h(DialogOverlay, { class: 'provider-overlay' }),
                                            h(DialogContent, {
                                                ariaLabel: 'Provider dialog',
                                                class: 'provider-dialog',
                                            }),
                                        ],
                                    },
                                ),
                        },
                    );
                },
            }),
        );

        await flush();
        const overlay = container.querySelector('.provider-overlay') as HTMLElement;
        const dialog = container.querySelector('.provider-dialog') as HTMLElement;
        expect(dialog.style.zIndex).toBe('5000');
        expect(overlay.style.zIndex).toBe('4999');

        providerBase.value = 5200;
        await flush();
        expect(dialog.style.zIndex).toBe('5200');
        expect(overlay.style.zIndex).toBe('5199');

        localBase.value = 6100;
        await flush();
        expect(dialog.style.zIndex).toBe('6100');
        expect(overlay.style.zIndex).toBe('6099');
    });

    it('applies the provider floor to Popover and both DropdownMenu APIs', async () => {
        const popover = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5000 },
                        {
                            default: () =>
                                h(
                                    Popover,
                                    { id: 'provider-popover', open: true, teleport: false },
                                    {
                                        default: ({ triggerProps }: PopoverSlotProps) =>
                                            h('button', triggerProps, 'Open'),
                                        content: () => 'Popover content',
                                    },
                                ),
                        },
                    );
                },
            }),
        );
        await flush();
        expect(
            (popover.container.querySelector('#provider-popover') as HTMLElement).style.zIndex,
        ).toBe('5000');
        popover.unmount();

        const menu = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5100 },
                        {
                            default: () =>
                                h(
                                    DropdownMenu,
                                    {
                                        id: 'provider-menu',
                                        items: [{ label: 'Rename', value: 'rename' }],
                                        open: true,
                                        teleport: false,
                                    },
                                    {
                                        default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                            h('button', triggerProps, 'Actions'),
                                    },
                                ),
                        },
                    );
                },
            }),
        );
        await flush();
        expect((menu.container.querySelector('#provider-menu') as HTMLElement).style.zIndex).toBe(
            '5100',
        );
        menu.unmount();

        const primitive = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5200 },
                        {
                            default: () =>
                                h(
                                    DropdownMenuRoot,
                                    { defaultOpen: true, modal: false },
                                    {
                                        default: () =>
                                            h(
                                                DropdownMenuContent,
                                                {
                                                    id: 'provider-primitive-menu',
                                                    avoidCollisions: false,
                                                },
                                                () => h(DropdownMenuItem, null, () => 'Rename'),
                                            ),
                                    },
                                ),
                        },
                    );
                },
            }),
        );
        await flush();
        expect(
            (primitive.container.querySelector('#provider-primitive-menu') as HTMLElement).style
                .zIndex,
        ).toBe('5200');
        primitive.unmount();
    });

    it('keeps a nested Tooltip above its managed parent without joining the layer stack', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5000 },
                        {
                            default: () =>
                                h(
                                    DialogRoot,
                                    { defaultOpen: true, modal: false },
                                    {
                                        default: () =>
                                            h(
                                                DialogContent,
                                                {
                                                    ariaLabel: 'Tooltip dialog',
                                                    class: 'tooltip-dialog',
                                                },
                                                () =>
                                                    h(
                                                        Tooltip,
                                                        {
                                                            content: 'Nested help',
                                                            open: true,
                                                            teleport: false,
                                                        },
                                                        { default: () => h('button', 'Help') },
                                                    ),
                                            ),
                                    },
                                ),
                        },
                    );
                },
            }),
        );

        await flush();
        const dialog = container.querySelector('.tooltip-dialog') as HTMLElement;
        const tooltip = container.querySelector('.rp-tooltip__content') as HTMLElement;
        expect(dialog.style.zIndex).toBe('5000');
        expect(tooltip.style.zIndex).toBe('5001');
    });

    it('applies the Toast offset and forwards a Modal instance override', async () => {
        const toastBase = ref(5000);
        const toast = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: toastBase.value },
                        {
                            default: () =>
                                h(ToastProvider, null, {
                                    default: () => h(ToastViewport, { teleport: false }),
                                }),
                        },
                    );
                },
            }),
        );
        await flush();
        const viewport = toast.container.querySelector('.rp-toast-viewport') as HTMLElement;
        expect(viewport.style.zIndex).toBe('5001');
        toastBase.value = 5500;
        await flush();
        expect(viewport.style.zIndex).toBe('5501');
        toast.unmount();

        const modal = mountDomWithApp(
            defineComponent({
                render() {
                    return h(
                        OverlayLayerProvider,
                        { baseZIndex: 5000 },
                        {
                            default: () =>
                                h(
                                    Modal,
                                    {
                                        open: true,
                                        ariaLabel: 'Override modal',
                                        baseZIndex: 7000,
                                        teleport: false,
                                        modal: false,
                                    },
                                    { default: () => 'Modal content' },
                                ),
                        },
                    );
                },
            }),
        );
        await flush();
        expect((modal.container.querySelector('.rp-modal') as HTMLElement).style.zIndex).toBe(
            '7000',
        );
        modal.unmount();
    });
});
