export type ElementDirection = 'ltr' | 'rtl';

export function getElementDirection(element: Element): ElementDirection {
    const view = element.ownerDocument.defaultView;
    return view?.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}
