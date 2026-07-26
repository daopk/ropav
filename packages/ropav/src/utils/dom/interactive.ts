import { isElement } from './query';

export const INTERACTIVE_ELEMENT_SELECTOR = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export function isInteractiveElement(target: unknown, ignoredSelector?: string) {
    if (!isElement(target)) return false;

    const interactiveElement = target.closest(INTERACTIVE_ELEMENT_SELECTOR);
    return Boolean(
        interactiveElement && (!ignoredSelector || !interactiveElement.matches(ignoredSelector)),
    );
}
