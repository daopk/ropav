import { afterEach, describe, expect, it } from 'vitest';
import { getFocusNavigationTarget, setFocusNavigationTabStop } from './focusNavigation';

const options = {
    itemSelector: 'button',
    collectionSelector: '.collection',
    orientation: 'vertical',
} as const;

function keyboardTarget(key: string, target: EventTarget) {
    return { key, target };
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('focus navigation', () => {
    it('skips disabled items, wraps, and supports Home and End', () => {
        const collection = document.createElement('div');
        collection.className = 'collection';
        collection.innerHTML = `
            <button id="first"><span>First</span></button>
            <button id="disabled" disabled>Disabled</button>
            <button id="last">Last</button>
            <div class="collection">
                <button id="nested">Nested</button>
            </div>
        `;
        document.body.append(collection);

        const first = collection.querySelector<HTMLButtonElement>('#first')!;
        const firstLabel = first.querySelector('span')!;
        const disabled = collection.querySelector<HTMLButtonElement>('#disabled')!;
        const last = collection.querySelector<HTMLButtonElement>('#last')!;
        const nested = collection.querySelector<HTMLButtonElement>('#nested')!;

        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', firstLabel), collection, options),
        ).toBe(last);
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', last), collection, options),
        ).toBe(first);
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowUp', first), collection, options),
        ).toBe(last);
        expect(getFocusNavigationTarget(keyboardTarget('Home', last), collection, options)).toBe(
            first,
        );
        expect(getFocusNavigationTarget(keyboardTarget('End', first), collection, options)).toBe(
            last,
        );
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowRight', first), collection, options),
        ).toBeUndefined();
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', disabled), collection, options),
        ).toBeUndefined();
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', nested), collection, options),
        ).toBeUndefined();
    });

    it('reverses horizontal arrow navigation in right-to-left collections', () => {
        const collection = document.createElement('div');
        collection.className = 'collection';
        collection.style.direction = 'rtl';
        collection.innerHTML = `
            <button id="first">First</button>
            <button id="middle">Middle</button>
            <button id="last">Last</button>
        `;
        document.body.append(collection);

        const first = collection.querySelector<HTMLButtonElement>('#first')!;
        const middle = collection.querySelector<HTMLButtonElement>('#middle')!;
        const last = collection.querySelector<HTMLButtonElement>('#last')!;
        const horizontalOptions = { ...options, orientation: 'horizontal' } as const;

        expect(
            getFocusNavigationTarget(
                keyboardTarget('ArrowRight', middle),
                collection,
                horizontalOptions,
            ),
        ).toBe(first);
        expect(
            getFocusNavigationTarget(
                keyboardTarget('ArrowLeft', middle),
                collection,
                horizontalOptions,
            ),
        ).toBe(last);
    });

    it('keeps hidden and inert items out of navigation and the roving tab stop', () => {
        const collection = document.createElement('div');
        collection.className = 'collection';
        collection.innerHTML = `
            <button id="first">First</button>
            <button id="hidden" hidden>Hidden</button>
            <span hidden><button id="hidden-child">Hidden child</button></span>
            <button id="inert" inert>Inert</button>
            <span inert><button id="inert-child">Inert child</button></span>
            <button id="last">Last</button>
        `;
        document.body.append(collection);

        const buttons = [...collection.querySelectorAll('button')] as HTMLButtonElement[];
        const [first, hidden, , , , last] = buttons;

        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', first!), collection, options),
        ).toBe(last);
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowUp', last!), collection, options),
        ).toBe(first);
        expect(
            getFocusNavigationTarget(keyboardTarget('ArrowDown', hidden!), collection, options),
        ).toBeUndefined();

        expect(setFocusNavigationTabStop(collection, hidden!, options)).toBe(first);
        expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);

        expect(setFocusNavigationTabStop(collection, last!, options)).toBe(last);
        expect(buttons.map((button) => button.tabIndex)).toEqual([-1, -1, -1, -1, -1, 0]);
    });
});
