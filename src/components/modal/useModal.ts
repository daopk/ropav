import {
    computed,
    isRef,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    useId,
    watch,
    type CSSProperties,
} from 'vue';
import { bem } from '@/utils/bem';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
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

type Cleanup = () => void;

const DEFAULT_ROLE: ModalRole = 'dialog';
const DEFAULT_SIZE: ModalSize = 'md';

const MODAL_PRESET_SIZES = new Set<ModalPresetSize>(['sm', 'md', 'lg', 'xl', 'full']);

function isHTMLElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function isModalPresetSize(size: string): size is ModalPresetSize {
    return MODAL_PRESET_SIZES.has(size as ModalPresetSize);
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

    let isMounted = false;
    let isActiveModal = false;
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

    const focusTrap = useFocusTrap(panelRef, {
        ...props.focusTrapOptions,
        initialFocus: () => resolveInitialFocus() ?? undefined,
        fallbackFocus: () => panelRef.value!,
        returnFocusOnDeactivate: props.returnFocus !== false,
        escapeDeactivates: (event) => {
            if (props.closeOnEscape === false) return false;
            event.preventDefault();
            closeModal();
            return false;
        },
        allowOutsideClick: true,
        preventScroll: true,
        delayInitialFocus: props.focusTrapOptions?.delayInitialFocus ?? false,
        delayReturnFocus: props.focusTrapOptions?.delayReturnFocus ?? false,
    });

    function activateModal() {
        if (isActiveModal) return;

        isActiveModal = true;
        if (props.preventScroll !== false) unlockScroll = lockBodyScroll();
        focusTrap.activate();
    }

    function deactivateModal() {
        if (!isActiveModal) return;

        isActiveModal = false;
        focusTrap.deactivate({ returnFocus: props.returnFocus !== false });
        unlockScroll?.();
        unlockScroll = undefined;
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
