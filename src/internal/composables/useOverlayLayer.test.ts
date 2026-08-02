import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { flush, mountDomWithApp } from '../../../tests/utils/vue';
import { useOverlayLayer } from './useOverlayLayer';

function dispatchPointerdown(target: Element) {
    const EventConstructor = target.ownerDocument.defaultView?.Event ?? Event;
    target.dispatchEvent(new EventConstructor('pointerdown', { bubbles: true, cancelable: true }));
}

function dispatchFocusin(target: Element) {
    const EventConstructor = target.ownerDocument.defaultView?.FocusEvent ?? FocusEvent;
    target.dispatchEvent(new EventConstructor('focusin', { bubbles: true, cancelable: true }));
}

function dispatchClick(target: Element) {
    const EventConstructor = target.ownerDocument.defaultView?.MouseEvent ?? MouseEvent;
    target.dispatchEvent(new EventConstructor('click', { bubbles: true, cancelable: true }));
}

function dispatchKeydown(target: Document, key: string) {
    const EventConstructor = target.defaultView?.KeyboardEvent ?? KeyboardEvent;
    target.dispatchEvent(new EventConstructor('keydown', { key, bubbles: true, cancelable: true }));
}

describe('useOverlayLayer interactions', () => {
    it('rebinds interaction listeners to the layer owner document and removes them on unmount', async () => {
        const firstElement = document.createElement('section');
        const frame = document.createElement('iframe');
        document.body.append(firstElement, frame);
        const frameDocument = frame.contentDocument!;
        const secondElement = frameDocument.createElement('section');
        frameDocument.body.append(secondElement);

        const element = ref<HTMLElement | null>(firstElement);
        const pointerDownOutside = vi.fn();
        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const layer = useOverlayLayer({ active: () => true, element });
                    layer.connectInteraction({ pointerDownOutside });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(firstElement);
        expect(pointerDownOutside).not.toHaveBeenCalled();
        dispatchPointerdown(document.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(1);

        element.value = secondElement;
        await flush();
        dispatchPointerdown(document.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(1);
        dispatchPointerdown(frameDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);

        unmount();
        dispatchPointerdown(frameDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);
    });

    it('refreshes interaction listeners when non-reactive inside elements move documents', async () => {
        const layerElement = document.createElement('section');
        const firstFrame = document.createElement('iframe');
        const secondFrame = document.createElement('iframe');
        document.body.append(layerElement, firstFrame, secondFrame);
        const firstDocument = firstFrame.contentDocument!;
        const secondDocument = secondFrame.contentDocument!;
        const firstInside = firstDocument.createElement('button');
        const secondInside = secondDocument.createElement('button');
        firstDocument.body.append(firstInside);
        secondDocument.body.append(secondInside);

        const inside = new Set<Element>([firstInside]);
        const pointerDownOutside = vi.fn();
        let refreshInteraction!: () => void;
        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const layer = useOverlayLayer({
                        active: () => true,
                        element: ref(layerElement),
                    });
                    const connection = layer.connectInteraction({
                        inside: () => [...inside],
                        pointerDownOutside,
                    });
                    refreshInteraction = connection.refresh;
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(firstInside);
        expect(pointerDownOutside).not.toHaveBeenCalled();
        dispatchPointerdown(firstDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();

        inside.clear();
        inside.add(secondInside);
        refreshInteraction();
        await flush();
        dispatchPointerdown(firstDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();
        dispatchPointerdown(secondInside);
        expect(pointerDownOutside).toHaveBeenCalledOnce();
        dispatchPointerdown(secondDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);

        unmount();
        dispatchPointerdown(secondDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);
    });

    it('tracks same-node adoption independently from disconnected inside elements', async () => {
        const layerElement = document.createElement('section');
        const insideFrame = document.createElement('iframe');
        const destinationFrame = document.createElement('iframe');
        document.body.append(layerElement, insideFrame, destinationFrame);
        const insideDocument = insideFrame.contentDocument!;
        const destinationDocument = destinationFrame.contentDocument!;
        const insideElement = insideDocument.createElement('button');
        insideDocument.body.append(insideElement);
        const pointerDownOutside = vi.fn();

        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const layer = useOverlayLayer({
                        active: () => true,
                        element: ref(layerElement),
                    });
                    layer.connectInteraction({
                        inside: () => [insideElement],
                        pointerDownOutside,
                    });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(insideDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();

        destinationDocument.body.append(insideElement);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        dispatchPointerdown(insideDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();
        dispatchPointerdown(insideElement);
        expect(pointerDownOutside).toHaveBeenCalledOnce();
        dispatchPointerdown(destinationDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);

        insideElement.remove();
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        dispatchPointerdown(destinationDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);

        destinationDocument.body.append(layerElement);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        await flush();

        dispatchPointerdown(document.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(2);
        dispatchPointerdown(destinationDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(3);

        unmount();
        dispatchPointerdown(destinationDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledTimes(3);
    });

    it('keeps activation order when an open layer changes owner document', async () => {
        const lowerElement = document.createElement('section');
        const hostInside = document.createElement('button');
        const frame = document.createElement('iframe');
        document.body.append(lowerElement, hostInside, frame);
        const frameDocument = frame.contentDocument!;
        const movedLowerElement = frameDocument.createElement('section');
        const upperElement = frameDocument.createElement('section');
        frameDocument.body.append(movedLowerElement, upperElement);

        const lowerElementRef = ref<HTMLElement | null>(lowerElement);
        const lowerPointerDownOutside = vi.fn();
        const upperPointerDownOutside = vi.fn();
        let readLowerZIndex!: () => number;
        let readUpperZIndex!: () => number;

        mountDomWithApp(
            defineComponent({
                setup() {
                    const lowerLayer = useOverlayLayer({
                        active: () => true,
                        element: lowerElementRef,
                    });
                    const upperLayer = useOverlayLayer({
                        active: () => true,
                        element: ref(upperElement),
                    });
                    readLowerZIndex = () => lowerLayer.zIndex.value;
                    readUpperZIndex = () => upperLayer.zIndex.value;
                    lowerLayer.connectInteraction({
                        inside: () => [hostInside],
                        pointerDownOutside: lowerPointerDownOutside,
                    });
                    upperLayer.connectInteraction({
                        inside: () => [hostInside],
                        pointerDownOutside: upperPointerDownOutside,
                    });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(document.body);
        expect(upperPointerDownOutside).toHaveBeenCalledOnce();
        expect(lowerPointerDownOutside).not.toHaveBeenCalled();

        lowerElementRef.value = movedLowerElement;
        await flush();

        dispatchPointerdown(document.body);
        expect(upperPointerDownOutside).toHaveBeenCalledTimes(2);
        expect(lowerPointerDownOutside).not.toHaveBeenCalled();
        expect(readLowerZIndex()).toBeLessThan(readUpperZIndex());
    });

    it('inherits interaction documents from a nested parent layer', async () => {
        const parentElement = document.createElement('section');
        const frame = document.createElement('iframe');
        document.body.append(parentElement, frame);
        const frameDocument = frame.contentDocument!;
        const childElement = frameDocument.createElement('section');
        const childInside = frameDocument.createElement('button');
        frameDocument.body.append(childElement, childInside);

        const childActive = ref(true);
        const parentPointerDownOutside = vi.fn();
        const childPointerDownOutside = vi.fn();

        const ChildLayer = defineComponent({
            setup() {
                const layer = useOverlayLayer({
                    active: childActive,
                    element: ref(childElement),
                });
                layer.connectInteraction({
                    inside: () => [childInside],
                    pointerDownOutside: childPointerDownOutside,
                });
                return () => h('div');
            },
        });

        mountDomWithApp(
            defineComponent({
                setup() {
                    const layer = useOverlayLayer({
                        active: () => true,
                        element: ref(parentElement),
                    });
                    layer.connectInteraction({
                        pointerDownOutside: parentPointerDownOutside,
                    });
                    return () => h(ChildLayer);
                },
            }),
        );
        await flush();

        dispatchPointerdown(document.body);
        expect(childPointerDownOutside).toHaveBeenCalledOnce();
        expect(parentPointerDownOutside).not.toHaveBeenCalled();

        childActive.value = false;
        await flush();
        dispatchPointerdown(document.body);
        expect(parentPointerDownOutside).toHaveBeenCalledOnce();
    });

    it('observes documents for branches that remain outside the layer', async () => {
        const contentFrame = document.createElement('iframe');
        const branchFrame = document.createElement('iframe');
        document.body.append(contentFrame, branchFrame);
        const contentDocument = contentFrame.contentDocument!;
        const branchDocument = branchFrame.contentDocument!;
        const layerElement = contentDocument.createElement('section');
        const outsideBranch = branchDocument.createElement('div');
        contentDocument.body.append(layerElement);
        branchDocument.body.append(outsideBranch);

        const pointerDownOutside = vi.fn();
        let removeBranch!: () => void;
        const { unmount } = mountDomWithApp(
            defineComponent({
                setup() {
                    const layer = useOverlayLayer({
                        active: () => true,
                        element: ref(layerElement),
                    });
                    removeBranch = layer.registerBranch(outsideBranch, {
                        focus: false,
                        inside: false,
                    });
                    layer.connectInteraction({ pointerDownOutside });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(outsideBranch);
        expect(pointerDownOutside).toHaveBeenCalledOnce();

        removeBranch();
        dispatchPointerdown(branchDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();

        unmount();
        dispatchPointerdown(contentDocument.body);
        expect(pointerDownOutside).toHaveBeenCalledOnce();
    });

    it('routes outside and Escape interactions only to the top layer', async () => {
        const lowerElement = document.createElement('section');
        const frame = document.createElement('iframe');
        const upperInside = document.createElement('button');
        document.body.append(lowerElement, frame, upperInside);
        const frameDocument = frame.contentDocument!;
        const upperElement = frameDocument.createElement('section');
        frameDocument.body.append(upperElement);

        const lowerActive = ref(true);
        const upperActive = ref(true);
        const lowerPointerDownOutside = vi.fn();
        const lowerEscapeKeyDown = vi.fn();
        const upperPointerDownOutside = vi.fn();
        const upperFocusOutside = vi.fn();
        const upperClickOutside = vi.fn();
        const upperEscapeKeyDown = vi.fn();

        mountDomWithApp(
            defineComponent({
                setup() {
                    const lowerLayer = useOverlayLayer({
                        active: lowerActive,
                        element: ref(lowerElement),
                    });
                    const upperLayer = useOverlayLayer({
                        active: upperActive,
                        element: ref(upperElement),
                    });
                    lowerLayer.connectInteraction({
                        pointerDownOutside: lowerPointerDownOutside,
                        escapeKeyDown: lowerEscapeKeyDown,
                    });
                    upperLayer.connectInteraction({
                        inside: () => [upperInside],
                        pointerDownOutside: upperPointerDownOutside,
                        focusOutside: upperFocusOutside,
                        clickOutside: upperClickOutside,
                        escapeKeyDown: upperEscapeKeyDown,
                    });
                    return () => h('div');
                },
            }),
        );
        await flush();

        dispatchPointerdown(upperElement);
        dispatchPointerdown(upperInside);
        dispatchFocusin(upperInside);
        dispatchClick(upperInside);
        expect(upperPointerDownOutside).not.toHaveBeenCalled();
        expect(upperFocusOutside).not.toHaveBeenCalled();
        expect(upperClickOutside).not.toHaveBeenCalled();

        dispatchPointerdown(document.body);
        dispatchFocusin(document.body);
        dispatchClick(document.body);
        dispatchKeydown(document, 'Enter');
        dispatchKeydown(document, 'Escape');
        expect(upperPointerDownOutside).toHaveBeenCalledOnce();
        expect(upperFocusOutside).toHaveBeenCalledOnce();
        expect(upperClickOutside).toHaveBeenCalledOnce();
        expect(upperEscapeKeyDown).toHaveBeenCalledOnce();
        expect(lowerPointerDownOutside).not.toHaveBeenCalled();
        expect(lowerEscapeKeyDown).not.toHaveBeenCalled();

        upperActive.value = false;
        await flush();
        dispatchPointerdown(document.body);
        dispatchKeydown(document, 'Escape');
        expect(lowerPointerDownOutside).toHaveBeenCalledOnce();
        expect(lowerEscapeKeyDown).toHaveBeenCalledOnce();
    });
});
