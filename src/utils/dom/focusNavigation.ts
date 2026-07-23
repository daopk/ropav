import { getEnabledIndexes, getNextEnabledIndex } from '../collectionNavigation';
import { isElement } from './query';

export type FocusNavigationOrientation = 'horizontal' | 'vertical';

export interface FocusNavigationOptions {
    itemSelector: string;
    collectionSelector: string;
    orientation: FocusNavigationOrientation;
}

function isDisabled(element: Element) {
    return element.matches(':disabled');
}

function getDirection(key: string, orientation: FocusNavigationOrientation): 1 | -1 | undefined {
    if (orientation === 'vertical') {
        if (key === 'ArrowDown') return 1;
        if (key === 'ArrowUp') return -1;
        return undefined;
    }

    if (key === 'ArrowRight') return 1;
    if (key === 'ArrowLeft') return -1;
    return undefined;
}

function getScopedItems<ElementType extends HTMLElement>(
    collection: HTMLElement,
    options: FocusNavigationOptions,
) {
    return Array.from(collection.querySelectorAll<ElementType>(options.itemSelector)).filter(
        (item) => item.closest(options.collectionSelector) === collection,
    );
}

export function getFocusNavigationTarget<ElementType extends HTMLElement>(
    event: Pick<KeyboardEvent, 'key' | 'target'>,
    collection: HTMLElement,
    options: FocusNavigationOptions,
): ElementType | undefined {
    if (!isElement(event.target)) return undefined;

    const currentItem = event.target.closest<ElementType>(options.itemSelector);
    if (
        !currentItem ||
        currentItem.closest(options.collectionSelector) !== collection ||
        isDisabled(currentItem)
    ) {
        return undefined;
    }

    const items = getScopedItems<ElementType>(collection, options);
    const currentIndex = items.indexOf(currentItem);
    if (currentIndex < 0) return undefined;

    const enabledIndexes = getEnabledIndexes(items, isDisabled);
    if (enabledIndexes.length === 0) return undefined;
    if (event.key === 'Home') return items[enabledIndexes[0]!];
    if (event.key === 'End') return items[enabledIndexes[enabledIndexes.length - 1]!];

    let direction = getDirection(event.key, options.orientation);
    if (!direction) return undefined;

    if (
        options.orientation === 'horizontal' &&
        collection.ownerDocument.defaultView?.getComputedStyle(collection).direction === 'rtl'
    ) {
        direction = direction === 1 ? -1 : 1;
    }

    const nextIndex = getNextEnabledIndex(items, currentIndex, direction, isDisabled);
    return nextIndex === undefined ? undefined : items[nextIndex];
}
