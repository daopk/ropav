import { computed, useSlots, useId, type CSSProperties } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { bem } from '@/utils/bem';
import { resolveDialogCloseReason } from '../dialog/dialogContext';
import type { DialogCloseReason } from '../dialog/types';
import type { ModalPresetSize, ModalProps, ModalRole, ModalSize, ModalSlotProps } from './types';

const DEFAULT_ROLE: ModalRole = 'dialog';
const DEFAULT_SIZE: ModalSize = 'md';

const MODAL_PRESET_SIZES = new Set<ModalPresetSize>(['sm', 'md', 'lg', 'xl', 'full']);

function isModalPresetSize(size: string): size is ModalPresetSize {
    return MODAL_PRESET_SIZES.has(size as ModalPresetSize);
}

export function useModal(
    props: Readonly<ModalProps>,
    emit: {
        openChange?: (open: boolean) => void;
        close?: (reason: DialogCloseReason) => void;
    } = {},
) {
    const slots = useSlots();
    const generatedId = useId();
    const controllableOpen = useControllableValue({
        modelValue: () => props.open,
        defaultValue: () => false,
        onChange: (open) => emit.openChange?.(open),
    });

    const modalId = computed(() => props.id ?? `${generatedId}-modal`);
    const titleId = computed(() => `${modalId.value}-title`);
    const descriptionId = computed(() => `${modalId.value}-description`);
    const role = computed(() => props.role ?? DEFAULT_ROLE);
    const size = computed(() => props.size || DEFAULT_SIZE);
    const isPresetSize = computed(() => isModalPresetSize(size.value));
    const isOpen = controllableOpen.value;
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
        controllableOpen.setValue(nextOpen);
    }

    function openModal() {
        setOpen(true);
    }

    function closeModal(reason: DialogCloseReason = 'programmatic') {
        if (!isOpen.value) return;
        setOpen(false);
        emit.close?.(resolveDialogCloseReason(reason));
    }

    function toggleModal() {
        if (isOpen.value) closeModal('programmatic');
        else openModal();
    }

    return {
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
        setOpen,
    };
}
