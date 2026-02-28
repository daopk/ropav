import { nextTick, watch, type Ref } from 'vue';

const menuItemSelector = [
    '[role="menuitem"]:not([aria-disabled="true"])',
    '[role="menuitemcheckbox"]:not([aria-disabled="true"])',
    '[role="menuitemradio"]:not([aria-disabled="true"])',
].join(', ');

function getMenuItems(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(menuItemSelector))
        .filter((el) => el.closest('[role="menu"]') === container);
}

function focusRelative(container: HTMLElement, delta: 1 | -1) {
    const items = getMenuItems(container);
    if (items.length === 0) return;

    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = delta === 1
        ? (idx < items.length - 1 ? idx + 1 : 0)
        : (idx > 0 ? idx - 1 : items.length - 1);
    items[next]?.focus();
}

export interface UseMenuKeyboardOptions {
    contentRef: Ref<HTMLElement | null>;
    isOpen: Ref<boolean> | (() => boolean);
    onEscape?: (e: KeyboardEvent) => void;
    onArrowLeft?: (e: KeyboardEvent) => void;
    stopPropagation?: boolean;
}

export function useMenuKeyboard(options: UseMenuKeyboardOptions) {
    const { contentRef, isOpen, onEscape, onArrowLeft, stopPropagation = false } = options;

    function onKeydown(e: KeyboardEvent) {
        const el = contentRef.value;
        if (!el) return;

        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                if (stopPropagation) e.stopPropagation();
                focusRelative(el, 1);
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                if (stopPropagation) e.stopPropagation();
                focusRelative(el, -1);
                break;
            }
            case 'Home':
                e.preventDefault();
                if (stopPropagation) e.stopPropagation();
                getMenuItems(el)[0]?.focus();
                break;
            case 'End': {
                e.preventDefault();
                if (stopPropagation) e.stopPropagation();
                const items = getMenuItems(el);
                items[items.length - 1]?.focus();
                break;
            }
            case 'ArrowLeft':
                if (onArrowLeft) {
                    e.preventDefault();
                    if (stopPropagation) e.stopPropagation();
                    onArrowLeft(e);
                }
                break;
            case 'Escape':
                if (onEscape) {
                    e.preventDefault();
                    if (stopPropagation) e.stopPropagation();
                    onEscape(e);
                }
                break;
        }
    }

    const openRef = typeof isOpen === 'function' ? isOpen : () => isOpen.value;

    watch(openRef, (open) => {
        if (open) {
            nextTick(() => {
                const el = contentRef.value;
                if (el) getMenuItems(el)[0]?.focus();
            });
        }
    });

    return { onKeydown };
}
