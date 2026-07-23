import { describe, expect, it, vi } from 'vitest';
import {
    areNodeListsIdentical,
    getComposedAncestry,
    getComposedParent,
    observeComposedAncestry,
} from './ancestry';

describe('DOM ancestry utilities', () => {
    it('reads regular parent relationships and compares node lists by identity', () => {
        const parent = document.createElement('div');
        const child = document.createElement('button');
        parent.append(child);

        expect(getComposedParent(child)).toBe(parent);
        expect(getComposedAncestry(child)).toEqual([parent]);
        expect(areNodeListsIdentical([parent, child], [parent, child])).toBe(true);
        expect(areNodeListsIdentical([parent, child], [child, parent])).toBe(false);
        expect(areNodeListsIdentical([parent], [parent, child])).toBe(false);
    });

    it('follows assigned slots and shadow roots through the composed tree', () => {
        const host = document.createElement('div');
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const slot = document.createElement('slot');
        slot.name = 'content';
        shadowRoot.append(slot);

        const child = document.createElement('span');
        child.slot = 'content';
        host.append(child);

        expect(child.assignedSlot).toBe(slot);
        expect(getComposedParent(child)).toBe(slot);
        expect(getComposedParent(shadowRoot)).toBe(host);
        expect(getComposedAncestry(child)).toEqual([slot, shadowRoot, host]);
    });

    it('follows adopted elements after their owner document changes', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const parent = document.createElement('div');
        const child = document.adoptNode(frame.contentDocument!.createElement('span'));
        parent.append(child);

        expect(getComposedParent(child)).toBe(parent);
        expect(getComposedAncestry(child)).toEqual([parent]);
    });

    it('continues through a same-origin iframe host into the parent document', () => {
        const host = document.createElement('div');
        const frame = document.createElement('iframe');
        host.append(frame);
        document.body.append(host);
        const child = frame.contentDocument!.createElement('button');
        frame.contentDocument!.body.append(child);

        const ancestry = getComposedAncestry(child);
        expect(ancestry.indexOf(frame)).toBeGreaterThan(ancestry.indexOf(frame.contentDocument!));
        expect(ancestry.indexOf(host)).toBeGreaterThan(ancestry.indexOf(frame));

        host.remove();
    });

    it('tracks reconnection after a node remains detached across animation frames', async () => {
        const firstHost = document.createElement('div');
        const nextHost = document.createElement('div');
        const child = document.createElement('button');
        firstHost.append(child);
        document.body.append(firstHost, nextHost);

        const onChange = vi.fn();
        const stop = observeComposedAncestry(() => [child], onChange, {
            deferWhileDisconnected: true,
        });

        child.remove();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        expect(onChange).not.toHaveBeenCalled();

        nextHost.append(child);
        await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

        stop();
        firstHost.append(child);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(onChange).toHaveBeenCalledTimes(1);

        firstHost.remove();
        nextHost.remove();
    });

    it('observes new slot assignments within an existing open shadow root', async () => {
        const host = document.createElement('div');
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const slot = document.createElement('slot');
        slot.name = 'other';
        shadowRoot.append(slot);

        const child = document.createElement('span');
        child.slot = 'content';
        host.append(child);
        document.body.append(host);
        expect(child.assignedSlot).toBeNull();

        const onChange = vi.fn();
        const stop = observeComposedAncestry(() => [child], onChange);

        slot.name = 'content';
        expect(child.assignedSlot).toBe(slot);
        await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

        stop();
        slot.name = 'other';
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(onChange).toHaveBeenCalledTimes(1);

        host.remove();
    });
});
