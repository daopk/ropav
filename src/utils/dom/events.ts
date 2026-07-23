import { isElement, matchesSelectorSafe, querySelectorAllSafe } from './query';

function isNodeLike(value: unknown): value is Node {
    return (
        value != null &&
        typeof value === 'object' &&
        'nodeType' in value &&
        typeof value.nodeType === 'number'
    );
}

export function isNodeWithinElement(value: unknown, element: unknown): value is Node {
    if (!isElement(element) || !isNodeLike(value)) return false;

    try {
        return element.contains(value);
    } catch {
        return false;
    }
}

export function isEventWithinElement(event: Event, element: Element) {
    const path = event.composedPath();
    if (path.length > 0) {
        return path.some((entry) => entry === element || isNodeWithinElement(entry, element));
    }

    return isNodeWithinElement(event.target, element);
}

export type EventContainmentTarget = string | Element | null | undefined;

function getEventDocument(event: Event): Document | null {
    const target = event.target;
    if (target != null && typeof target === 'object') {
        if ('nodeType' in target && target.nodeType === 9) return target as Document;
        if ('ownerDocument' in target) {
            return (target as { ownerDocument?: Document | null }).ownerDocument ?? null;
        }
        if ('document' in target) {
            return (target as { document?: Document | null }).document ?? null;
        }
    }

    return typeof document !== 'undefined' ? document : null;
}

function isEventWithinSelector(event: Event, selector: string) {
    const path = event.composedPath();
    if (path.length > 0) {
        return path.some((entry) => isElement(entry) && matchesSelectorSafe(entry, selector));
    }

    return querySelectorAllSafe(selector, getEventDocument(event)).some((element) =>
        isEventWithinElement(event, element),
    );
}

export function isEventWithinTargets(event: Event, targets: readonly EventContainmentTarget[]) {
    for (const target of targets) {
        if (!target) continue;

        if (typeof target === 'string') {
            if (isEventWithinSelector(event, target)) return true;
            continue;
        }

        if (isEventWithinElement(event, target)) return true;
    }

    return false;
}

type BrowserWindow = Window & typeof globalThis;

function getEventView(event: Event): BrowserWindow | null {
    const target = event.target;
    if (target == null || typeof target !== 'object') return null;

    if ('ownerDocument' in target) {
        return ((target as { ownerDocument?: Document | null }).ownerDocument?.defaultView ??
            null) as BrowserWindow | null;
    }
    if ('defaultView' in target) {
        return ((target as { defaultView?: Window | null }).defaultView ??
            null) as BrowserWindow | null;
    }

    return null;
}

export function createCancelableCustomEvent<T>(
    type: string,
    detail: T,
    originalEvent: Event,
): CustomEvent<T> {
    const EventConstructor = getEventView(originalEvent)?.CustomEvent ?? CustomEvent;
    return new EventConstructor(type, { bubbles: false, cancelable: true, detail });
}
