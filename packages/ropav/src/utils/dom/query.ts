export function isElement(value: unknown): value is Element {
    if (value == null || typeof value !== 'object') return false;
    if (typeof Element !== 'undefined' && value instanceof Element) return true;

    const candidate = value as {
        getAttribute?: unknown;
        nodeType?: unknown;
        ownerDocument?: Document | null;
    };
    const ownerDocument = 'ownerDocument' in value ? candidate.ownerDocument : null;
    const ElementConstructor = ownerDocument?.defaultView?.Element;
    if (ElementConstructor && value instanceof ElementConstructor) return true;

    return candidate.nodeType === 1 && typeof candidate.getAttribute === 'function';
}

export function matchesSelectorSafe(element: Element, selector: string) {
    try {
        return element.matches(selector);
    } catch {
        return false;
    }
}

function getQueryRoot(root: ParentNode | null | undefined) {
    if (root !== undefined) return root;
    return typeof document !== 'undefined' ? document : null;
}

export function querySelectorSafe<ElementType extends Element = Element>(
    selector: string,
    root?: ParentNode | null,
): ElementType | null {
    const queryRoot = getQueryRoot(root);
    if (!queryRoot) return null;

    try {
        return queryRoot.querySelector<ElementType>(selector);
    } catch {
        return null;
    }
}

export function querySelectorAllSafe<ElementType extends Element = Element>(
    selector: string,
    root?: ParentNode | null,
): ElementType[] {
    const queryRoot = getQueryRoot(root);
    if (!queryRoot) return [];

    try {
        return Array.from(queryRoot.querySelectorAll<ElementType>(selector));
    } catch {
        return [];
    }
}
