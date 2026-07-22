import { expect } from 'vitest';
import { waitForAssertion } from '../utils/vue';

import type { DropdownMenuItem } from '../../src/components/dropdown-menu/types';

export const items: DropdownMenuItem[] = [
    { label: 'Rename', value: 'rename', shortcut: 'R' },
    { label: 'Duplicate', value: 'duplicate', disabled: true },
    { label: 'Archive', value: 'archive' },
    { label: 'Delete', value: 'delete', destructive: true },
];

export const nestedItems: DropdownMenuItem[] = [
    { label: 'Rename', value: 'rename' },
    {
        label: 'Move to',
        value: 'move',
        children: [
            { label: 'Backlog', value: 'move-backlog' },
            { label: 'In progress', value: 'move-progress' },
        ],
    },
    { label: 'Delete', value: 'delete', destructive: true },
];

export async function waitForDropdownClose() {
    await waitForAssertion(() => {
        expect(document.querySelector('[role="menu"]')).toBeNull();
    });
}

export function createRect(left: number, top: number, right: number, bottom: number): DOMRect {
    return {
        bottom,
        height: bottom - top,
        left,
        right,
        top,
        width: right - left,
        x: left,
        y: top,
        toJSON: () => ({}),
    } as DOMRect;
}

export function mouseenter(el: Element, clientX: number, clientY: number) {
    el.dispatchEvent(
        new MouseEvent('mouseenter', {
            bubbles: false,
            cancelable: true,
            clientX,
            clientY,
        }),
    );
}

export function mousemove(el: Element, clientX: number, clientY: number) {
    el.dispatchEvent(
        new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
        }),
    );
}
