import { describe, expect, it } from 'vitest';
import { createCancelableCustomEvent, isEventWithinElement } from './events';

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
        expect(customEvent).toBeInstanceOf(frameWindow.CustomEvent);
        expect(customEvent).toMatchObject({ cancelable: true, detail: { source: 'frame' } });
    });
});
