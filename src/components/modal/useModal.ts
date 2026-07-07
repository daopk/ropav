import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    useId,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import type {
    ModalInitialFocus,
    ModalPresetSize,
    ModalProps,
    ModalRole,
    ModalSize,
    ModalSlotProps,
} from './types';

let bodyScrollLockCount = 0;
let previousBodyOverflow = '';
const activeModalStack: symbol[] = [];

type Cleanup = () => void;

const DEFAULT_ROLE: ModalRole = 'dialog';
const DEFAULT_SIZE: ModalSize = 'md';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const MODAL_PRESET_SIZES = new Set<ModalPresetSize>(['sm', 'md', 'lg', 'xl', 'full']);

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function isModalPresetSize(size: string): size is ModalPresetSize {
    return MODAL_PRESET_SIZES.has(size as ModalPresetSize);
}

function isFocusable(element: HTMLElement) {
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.hasAttribute('disabled')) return false;
    return element.tabIndex >= 0;
}

function getFocusableElements(panel: HTMLElement | null) {
    if (!panel) return [];
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isFocusable);
}

function focusElement(element: HTMLElement | null | undefined) {
    if (!element) return;

    try {
        element.focus({ preventScroll: true });
    } catch {
        element.focus();
    }
}

function lockBodyScroll(): Cleanup | undefined {
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

function queryPanelElement(panel: HTMLElement, selector: string) {
    try {
        const element = panel.querySelector(selector);
        return isHTMLElement(element) ? element : null;
    } catch {
        return null;
    }
}

export function useModal(props: Readonly<ModalProps>, emitOpenChange?: (open: boolean) => void) {
    const slots = useSlots();
    const generatedId = useId();
    const panelRef = ref<HTMLElement | null>(null);
    const uncontrolledOpen = ref(false);
    const modalToken = Symbol('modal');

    let isMounted = false;
    let isActiveModal = false;
    let previousActiveElement: HTMLElement | null = null;
    let removeDocumentListeners: Cleanup | undefined;
    let unlockScroll: Cleanup | undefined;

    const modalId = computed(() => props.id ?? `${generatedId}-modal`);
    const titleId = computed(() => `${modalId.value}-title`);
    const descriptionId = computed(() => `${modalId.value}-description`);
    const role = computed(() => props.role ?? DEFAULT_ROLE);
    const size = computed(() => props.size || DEFAULT_SIZE);
    const isPresetSize = computed(() => isModalPresetSize(size.value));
    const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
    const shouldRender = computed(() => Boolean(props.keepMounted || isOpen.value));
    const hasCustomHeader = computed(() => Boolean(slots.header));
    const hasHeader = computed(() =>
        Boolean(hasCustomHeader.value || props.title || props.description),
    );
    const hasFooter = computed(() => Boolean(slots.footer));
    const showCloseButton = computed(() => props.showCloseButton);

    const headerId = computed(() =>
        hasCustomHeader.value && !props.ariaLabel ? titleId.value : undefined,
    );
    const ariaLabelledby = computed(() => {
        if (props.ariaLabel) return undefined;
        return hasCustomHeader.value || props.title ? titleId.value : undefined;
    });
    const ariaDescribedby = computed(() =>
        props.description && !hasCustomHeader.value ? descriptionId.value : undefined,
    );
    const ariaLabel = computed(() =>
        ariaLabelledby.value ? undefined : props.ariaLabel || undefined,
    );

    const rootClass = computed(() =>
        bem('rp-modal', {
            [`size-${size.value}`]: isPresetSize.value,
            'size-custom': !isPresetSize.value,
            open: isOpen.value,
        }),
    );

    const rootStyle = computed<CSSProperties | undefined>(() => {
        if (isPresetSize.value) return undefined;

        return {
            '--_rp-modal-width': size.value,
        };
    });

    const stateClass = computed(() => ({
        'rp-modal--closable': showCloseButton.value,
        'rp-modal--headerless': !hasHeader.value,
    }));

    const slotProps = computed<ModalSlotProps>(() => ({
        isOpen: isOpen.value,
        open: openModal,
        close: closeModal,
        toggle: toggleModal,
    }));

    function setOpen(nextOpen: boolean) {
        if (nextOpen === isOpen.value) return;
        if (props.open === undefined) uncontrolledOpen.value = nextOpen;
        emitOpenChange?.(nextOpen);
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

    function resolveInitialFocus() {
        const initialFocus = readInitialFocus(props.initialFocus);
        const panel = panelRef.value;
        if (!initialFocus || !panel) return null;

        if (typeof initialFocus === 'string') {
            return queryPanelElement(panel, initialFocus);
        }

        return panel.contains(initialFocus) ? initialFocus : null;
    }

    function focusInitialElement() {
        const firstFocusable = getFocusableElements(panelRef.value)[0];
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

        const focusableElements = getFocusableElements(panel);
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
        if (!isOpen.value || !isTopModal()) return;

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
        if (isActiveModal) return;

        isActiveModal = true;
        addToStack();

        if (typeof document !== 'undefined') {
            const activeElement = document.activeElement;
            previousActiveElement = isHTMLElement(activeElement) ? activeElement : null;
        }

        bindDocumentListeners();
        if (props.preventScroll !== false) unlockScroll = lockBodyScroll();
        void nextTick(() => {
            if (isActiveModal) focusInitialElement();
        });
    }

    function deactivateModal() {
        if (!isActiveModal) return;

        isActiveModal = false;
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
        if (isOpen.value) activateModal();
    });

    onBeforeUnmount(() => {
        deactivateModal();
    });

    watch(isOpen, (nextOpen) => {
        if (!isMounted) return;
        if (nextOpen) activateModal();
        else deactivateModal();
    });

    return {
        panelRef,
        modalId,
        titleId,
        descriptionId,
        role,
        isOpen,
        shouldRender,
        hasHeader,
        hasFooter,
        showCloseButton,
        headerId,
        ariaLabelledby,
        ariaDescribedby,
        ariaLabel,
        rootClass,
        rootStyle,
        stateClass,
        slotProps,
        openModal,
        closeModal,
        toggleModal,
        onOverlayClick,
    };
}
