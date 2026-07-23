function getNodeConstructor(element: Element) {
    return (
        element.ownerDocument.defaultView?.Node ?? (typeof Node !== 'undefined' ? Node : undefined)
    );
}

function isNodeWithinDocument(value: unknown, element: Element): value is Node {
    const NodeConstructor = getNodeConstructor(element);
    return Boolean(NodeConstructor && value instanceof NodeConstructor);
}

export function isEventWithinElement(event: Event, element: Element) {
    const path = event.composedPath();
    if (path.length > 0) {
        return path.some(
            (entry) =>
                entry === element ||
                (isNodeWithinDocument(entry, element) && element.contains(entry)),
        );
    }

    return isNodeWithinDocument(event.target, element) && element.contains(event.target);
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
