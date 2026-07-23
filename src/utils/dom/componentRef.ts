import { nextTick, type ComponentPublicInstance, type VaporComponentInstance } from 'vue';

export type ComponentElementRef = Element | ComponentPublicInstance | VaporComponentInstance | null;

function asHTMLElement(value: unknown): HTMLElement | null {
    if (value == null || typeof value !== 'object') return null;

    const ownerDocument =
        'ownerDocument' in value
            ? (value as { ownerDocument?: Document | null }).ownerDocument
            : null;
    const ElementConstructor = ownerDocument?.defaultView?.HTMLElement;
    if (ElementConstructor && value instanceof ElementConstructor) return value as HTMLElement;
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return value;

    return null;
}

export function toHTMLElement(value: ComponentElementRef, fallbackId?: string): HTMLElement | null {
    const directElement = asHTMLElement(value);
    if (directElement) return directElement;

    const vdomElement = asHTMLElement((value as ComponentPublicInstance | null)?.$el);
    if (vdomElement) return vdomElement;

    const vaporBlock = asHTMLElement((value as VaporComponentInstance | null)?.block);
    if (vaporBlock) return vaporBlock;

    return fallbackId && typeof document !== 'undefined'
        ? document.getElementById(fallbackId)
        : null;
}

export function resolveHTMLElementRef(
    value: ComponentElementRef,
    fallbackId: string,
    resolve: (element: HTMLElement | null) => void,
) {
    const element = toHTMLElement(value, fallbackId);
    resolve(element);
    if (element || !value) return;

    void nextTick(() => resolve(toHTMLElement(value, fallbackId)));
}
