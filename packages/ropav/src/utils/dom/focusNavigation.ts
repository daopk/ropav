import { getEnabledIndexes, getNextEnabledIndex } from '../collectionNavigation';
import { isElement } from './query';

export type FocusNavigationOrientation = 'horizontal' | 'vertical';

export interface FocusNavigationCollectionOptions {
    itemSelector: string;
    collectionSelector: string;
}

export interface FocusNavigationOptions extends FocusNavigationCollectionOptions {
    orientation: FocusNavigationOrientation;
}

function isIneligible(element: Element) {
    return element.matches(':disabled') || element.closest('[hidden], [inert]') !== null;
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
    options: FocusNavigationCollectionOptions,
) {
    return Array.from(collection.querySelectorAll<ElementType>(options.itemSelector)).filter(
        (item) => item.closest(options.collectionSelector) === collection,
    );
}

export function setFocusNavigationTabStop<ElementType extends HTMLElement>(
    collection: HTMLElement,
    preferredItem: ElementType | null,
    options: FocusNavigationCollectionOptions,
): ElementType | null {
    const items = getScopedItems<ElementType>(collection, options);
    const target =
        preferredItem && items.includes(preferredItem) && !isIneligible(preferredItem)
            ? preferredItem
            : (items.find((item) => !isIneligible(item)) ?? null);

    for (const item of items) item.tabIndex = item === target ? 0 : -1;
    return target;
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
        isIneligible(currentItem)
    ) {
        return undefined;
    }

    const items = getScopedItems<ElementType>(collection, options);
    const currentIndex = items.indexOf(currentItem);
    if (currentIndex < 0) return undefined;

    const enabledIndexes = getEnabledIndexes(items, isIneligible);
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

    const nextIndex = getNextEnabledIndex(items, currentIndex, direction, isIneligible);
    return nextIndex === undefined ? undefined : items[nextIndex];
}
