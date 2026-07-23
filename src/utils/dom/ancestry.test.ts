import { describe, expect, it } from 'vitest';
import { areNodeListsIdentical, getComposedAncestry, getComposedParent } from './ancestry';

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
});
