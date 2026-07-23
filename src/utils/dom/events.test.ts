import { describe, expect, it } from 'vitest';
import {
    createCancelableCustomEvent,
    isEventWithinElement,
    isEventWithinTargets,
    isNodeWithinElement,
} from './events';

describe('DOM event utilities', () => {
    it('detects events from an element and its descendants', () => {
        const root = document.createElement('div');
        const child = document.createElement('button');
        const outside = document.createElement('button');
        root.append(child);
        document.body.append(root, outside);

        let inside = false;
        let outsideResult = true;
        child.addEventListener('click', (event) => {
            inside = isEventWithinElement(event, root);
        });
        outside.addEventListener('click', (event) => {
            outsideResult = isEventWithinElement(event, root);
        });

        child.click();
        outside.click();

        expect(inside).toBe(true);
        expect(outsideResult).toBe(false);
    });

    it('uses the originating document realm for event checks and custom events', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const frameDocument = frame.contentDocument!;
        const frameWindow = frame.contentWindow! as Window & typeof globalThis;
        const root = frameDocument.createElement('div');
        const child = frameDocument.createElement('button');
        root.append(child);
        frameDocument.body.append(root);

        let inside = false;
        let customEvent: CustomEvent<{ source: string }> | undefined;
        child.addEventListener('click', (event) => {
            inside = isEventWithinElement(event, root);
            customEvent = createCancelableCustomEvent('utility-test', { source: 'frame' }, event);
        });

        child.dispatchEvent(new frameWindow.MouseEvent('click', { bubbles: true, composed: true }));

        expect(inside).toBe(true);
        expect(isNodeWithinElement(child, root)).toBe(true);
        expect(isNodeWithinElement(root, child)).toBe(false);
        expect(customEvent).toBeInstanceOf(frameWindow.CustomEvent);
        expect(customEvent).toMatchObject({ cancelable: true, detail: { source: 'frame' } });
    });

    it('detects adopted descendants without relying on realm constructors', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const root = document.createElement('div');
        const child = document.adoptNode(frame.contentDocument!.createElement('button'));
        root.append(child);

        expect(isNodeWithinElement(child, root)).toBe(true);
    });

    it('detects events within element and selector target collections', () => {
        const root = document.createElement('div');
        const child = document.createElement('button');
        const outside = document.createElement('button');
        root.className = 'event-containment-target';
        root.append(child);
        document.body.append(root, outside);

        let elementTarget = false;
        let selectorTarget = false;
        let outsideResult = true;
        child.addEventListener('click', (event) => {
            elementTarget = isEventWithinTargets(event, [null, root]);
            selectorTarget = isEventWithinTargets(event, [undefined, '.event-containment-target']);
        });
        outside.addEventListener('click', (event) => {
            outsideResult = isEventWithinTargets(event, [root, '.event-containment-target']);
        });

        child.click();
        outside.click();

        expect(elementTarget).toBe(true);
        expect(selectorTarget).toBe(true);
        expect(outsideResult).toBe(false);
    });

    it('resolves selector targets from iframe and shadow event paths', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const frameDocument = frame.contentDocument!;
        const frameWindow = frame.contentWindow! as Window & typeof globalThis;
        const frameRoot = frameDocument.createElement('div');
        const frameChild = frameDocument.createElement('button');
        frameRoot.className = 'iframe-event-containment-target';
        frameRoot.append(frameChild);
        frameDocument.body.append(frameRoot);

        let iframeResult = false;
        frameChild.addEventListener('click', (event) => {
            Object.defineProperty(event, 'composedPath', { value: () => [] });
            iframeResult = isEventWithinTargets(event, ['.iframe-event-containment-target']);
        });
        frameChild.dispatchEvent(
            new frameWindow.MouseEvent('click', { bubbles: true, composed: true }),
        );

        const host = document.createElement('div');
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const shadowTarget = document.createElement('div');
        const shadowChild = document.createElement('button');
        shadowTarget.className = 'shadow-event-containment-target';
        shadowTarget.append(shadowChild);
        shadowRoot.append(shadowTarget);
        document.body.append(host);

        let shadowResult = false;
        shadowChild.addEventListener('click', (event) => {
            shadowResult = isEventWithinTargets(event, ['.shadow-event-containment-target']);
        });
        shadowChild.click();

        expect(iframeResult).toBe(true);
        expect(shadowResult).toBe(true);
    });
});
