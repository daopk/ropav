export function isElement(value: unknown): value is Element {
    if (value == null || typeof value !== 'object') return false;
    if (typeof Element !== 'undefined' && value instanceof Element) return true;

    const ownerDocument =
        'ownerDocument' in value
            ? (value as { ownerDocument?: Document | null }).ownerDocument
            : null;
    const ElementConstructor = ownerDocument?.defaultView?.Element;
    return Boolean(ElementConstructor && value instanceof ElementConstructor);
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
