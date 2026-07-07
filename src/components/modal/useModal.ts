import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import type { ModalInitialFocus, ModalPresetSize, ModalProps, ModalSlotProps } from './types';

let bodyScrollLockCount = 0;
let previousBodyOverflow = '';
const activeModalStack: symbol[] = [];

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const modalPresetSizes = new Set<ModalPresetSize>(['sm', 'md', 'lg', 'xl', 'full']);

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function isModalPresetSize(size: string): size is ModalPresetSize {
    return modalPresetSizes.has(size as ModalPresetSize);
}

function isFocusable(element: HTMLElement) {
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.hasAttribute('disabled')) return false;
    return element.tabIndex >= 0;
}

function focusElement(element: HTMLElement | null | undefined) {
    if (!element) return;

    try {
        element.focus({ preventScroll: true });
    } catch {
        element.focus();
    }
}

function lockBodyScroll() {
    if (typeof document === 'undefined') return undefined;

    if (bodyScrollLockCount === 0) {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    bodyScrollLockCount += 1;

    return () => {
        bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
        if (bodyScrollLockCount === 0) document.body.style.overflow = previousBodyOverflow;
    };
}

function readInitialFocus(initialFocus: ModalInitialFocus | null | undefined) {
    return isRef(initialFocus) ? initialFocus.value : initialFocus;
}

export function useModal(props: Readonly<ModalProps>, emitOpenChange?: (open: boolean) => void) {
    const generatedId = useId();
    const panelRef = ref<HTMLElement | null>(null);
    const uncontrolledOpen = ref(Boolean(props.defaultOpen));
    const modalToken = Symbol('modal');

    let isMounted = false;
    let isActive = false;
    let previousActiveElement: HTMLElement | null = null;
    let removeDocumentListeners: (() => void) | undefined;
    let unlockScroll: (() => void) | undefined;

    const modalId = computed(() => props.id ?? `${generatedId}-modal`);
    const titleId = computed(() => `${modalId.value}-title`);
    const descriptionId = computed(() => `${modalId.value}-description`);
    const role = computed(() => props.role ?? 'dialog');
    const size = computed(() => props.size || 'md');
    const isPresetSize = computed(() => isModalPresetSize(size.value));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const isVisible = computed(() => isOpen.value);
    const shouldRender = computed(() => Boolean(props.keepMounted || isVisible.value));

    const rootClass = computed(() =>
        bem('rp-modal', {
            [`size-${size.value}`]: isPresetSize.value,
            'size-custom': !isPresetSize.value,
            open: isVisible.value,
        }),
    );

    const rootStyle = computed<CSSProperties | undefined>(() => {
        if (isPresetSize.value) return undefined;

        return {
            '--_rp-modal-width': size.value,
        };
    });

    const slotProps = computed<ModalSlotProps>(() => ({
        isOpen: isVisible.value,
        open: openModal,
        close: closeModal,
        toggle: toggleModal,
    }));

    function setOpen(nextOpen: boolean) {
        const previousOpen = isOpen.value;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) emitOpenChange?.(nextOpen);
    }

    function openModal() {
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
    }

    function toggleModal() {
        setOpen(!isOpen.value);
    }

    function getFocusableElements() {
        const panel = panelRef.value;
        if (!panel) return [];

        return [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(isFocusable);
    }

    function resolveInitialFocus() {
        const initialFocus = readInitialFocus(props.initialFocus);
        const panel = panelRef.value;
        if (!initialFocus || !panel) return null;

        if (typeof initialFocus === 'string') {
            const element = panel.querySelector(initialFocus);
            return isHTMLElement(element) ? element : null;
        }

        return panel.contains(initialFocus) ? initialFocus : null;
    }

    function focusInitialElement() {
        const firstFocusable = getFocusableElements()[0];
        focusElement(resolveInitialFocus() ?? firstFocusable ?? panelRef.value);
    }

    function addToStack() {
        if (!activeModalStack.includes(modalToken)) activeModalStack.push(modalToken);
    }

    function removeFromStack() {
        const index = activeModalStack.indexOf(modalToken);
        if (index !== -1) activeModalStack.splice(index, 1);
    }

    function isTopModal() {
        return activeModalStack[activeModalStack.length - 1] === modalToken;
    }

    function trapFocus(event: KeyboardEvent) {
        const panel = panelRef.value;
        if (!panel) return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
            event.preventDefault();
            focusElement(panel);
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;
        const isInsidePanel = activeElement instanceof Node && panel.contains(activeElement);

        if (!isInsidePanel) {
            event.preventDefault();
            focusElement(firstElement);
            return;
        }

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            focusElement(lastElement);
            return;
        }

        if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            focusElement(firstElement);
        }
    }

    function onDocumentKeydown(event: KeyboardEvent) {
        if (!isVisible.value || !isTopModal()) return;

        if (event.key === 'Escape') {
            if (props.closeOnEscape === false) return;
            event.preventDefault();
            closeModal();
            return;
        }

        if (event.key === 'Tab') trapFocus(event);
    }

    function bindDocumentListeners() {
        if (typeof document === 'undefined' || removeDocumentListeners) return;

        document.addEventListener('keydown', onDocumentKeydown);

        removeDocumentListeners = () => {
            document.removeEventListener('keydown', onDocumentKeydown);
            removeDocumentListeners = undefined;
        };
    }

    function restoreFocus() {
        if (props.returnFocus === false) {
            previousActiveElement = null;
            return;
        }

        if (previousActiveElement?.isConnected) focusElement(previousActiveElement);
        previousActiveElement = null;
    }

    function activateModal() {
        if (isActive) return;

        isActive = true;
        addToStack();

        if (typeof document !== 'undefined') {
            const activeElement = document.activeElement;
            previousActiveElement = isHTMLElement(activeElement) ? activeElement : null;
        }

        bindDocumentListeners();
        if (props.preventScroll !== false) unlockScroll = lockBodyScroll();
        void nextTick(focusInitialElement);
    }

    function deactivateModal() {
        if (!isActive) return;

        isActive = false;
        removeFromStack();
        removeDocumentListeners?.();
        unlockScroll?.();
        unlockScroll = undefined;
        restoreFocus();
    }

    function onOverlayClick(event: MouseEvent) {
        if (props.closeOnOverlayClick === false || event.target !== event.currentTarget) return;
        closeModal();
    }

    onMounted(() => {
        isMounted = true;
        if (isVisible.value) activateModal();
    });

    onBeforeUnmount(() => {
        deactivateModal();
    });

    watch(isVisible, (nextVisible) => {
        if (!isMounted) return;
        if (nextVisible) activateModal();
        else deactivateModal();
    });

    return {
        panelRef,
        modalId,
        titleId,
        descriptionId,
        role,
        isVisible,
        shouldRender,
        rootClass,
        rootStyle,
        slotProps,
        openModal,
        closeModal,
        toggleModal,
        onOverlayClick,
    };
}
