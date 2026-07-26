import { onBeforeUnmount, onMounted, shallowRef, type ShallowRef } from 'vue';
import { getFocusNavigationTarget } from '@/utils/dom/focusNavigation';
import { isElement } from '@/utils/dom/query';
import type { ToolbarOrientation } from './types';

const TOOLBAR_SELECTOR = '[role="toolbar"]';
const TOOLBAR_ITEM_SELECTOR = [
    'button',
    'a[href]',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="combobox"]',
    '[role="link"]',
    '[role="radio"]',
    '[role="slider"]',
    '[role="spinbutton"]',
    '[role="switch"]',
    '[tabindex]',
].join(',');

function isDisabled(item: HTMLElement) {
    return item.matches(':disabled');
}

function getToolbarItems(toolbar: HTMLElement) {
    return Array.from(toolbar.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR)).filter(
        (item) =>
            item.closest(TOOLBAR_SELECTOR) === toolbar &&
            item.closest('[hidden], [inert]') === null,
    );
}

export function useToolbar(
    root: ShallowRef<HTMLElement | null>,
    getOrientation: () => ToolbarOrientation,
) {
    const activeItem = shallowRef<HTMLElement | null>(null);
    let observer: MutationObserver | null = null;

    function setTabStop(item: HTMLElement | null) {
        const toolbar = root.value;
        if (!toolbar) return null;

        const items = getToolbarItems(toolbar);
        const nextItem =
            item && items.includes(item) && !isDisabled(item)
                ? item
                : (items.find((candidate) => !isDisabled(candidate)) ?? null);

        for (const candidate of items) {
            candidate.tabIndex = candidate === nextItem ? 0 : -1;
        }
        activeItem.value = nextItem;
        return nextItem;
    }

    function syncTabStop() {
        setTabStop(activeItem.value);
    }

    function onFocusin(event: FocusEvent) {
        const toolbar = root.value;
        if (!toolbar || !isElement(event.target)) return;

        const item = event.target.closest<HTMLElement>(TOOLBAR_ITEM_SELECTOR);
        if (item?.closest(TOOLBAR_SELECTOR) === toolbar) setTabStop(item);
    }

    function onKeydown(event: KeyboardEvent) {
        const toolbar = root.value;
        if (!toolbar) return;

        const nextItem = getFocusNavigationTarget<HTMLElement>(event, toolbar, {
            itemSelector: TOOLBAR_ITEM_SELECTOR,
            collectionSelector: TOOLBAR_SELECTOR,
            orientation: getOrientation(),
        });
        if (!nextItem) return;

        event.preventDefault();
        setTabStop(nextItem);
        nextItem.focus();
    }

    function focus() {
        setTabStop(activeItem.value)?.focus();
    }

    onMounted(() => {
        const toolbar = root.value;
        if (!toolbar) return;

        syncTabStop();
        const MutationObserverConstructor = toolbar.ownerDocument.defaultView?.MutationObserver;
        if (!MutationObserverConstructor) return;

        observer = new MutationObserverConstructor(syncTabStop);
        observer.observe(toolbar, {
            attributes: true,
            attributeFilter: ['disabled', 'hidden', 'inert'],
            childList: true,
            subtree: true,
        });
    });

    onBeforeUnmount(() => observer?.disconnect());

    return { focus, onFocusin, onKeydown };
}
