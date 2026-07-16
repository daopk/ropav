<template>
    <DialogRoot
        :open="isOpen"
        :modal="modal"
        :close-on-escape="closeOnEscape"
        :close-on-outside-click="closeOnOverlayClick"
        :prevent-scroll="preventScroll"
        :return-focus="returnFocus"
        @update:open="setOpen"
        @close="onDialogClose"
    >
        <DialogPortal :teleport="teleport" :teleport-to="teleportTo">
            <Transition name="rp-modal">
                <div v-if="shouldRender" v-show="isOpen" v-bind="rootAttrs">
                    <DialogOverlay
                        :as="Overlay"
                        :force-mount="keepMounted"
                        v-bind="overlayProps"
                        :class-names="overlayClassNames"
                        :styles="overlayStyles"
                        :z-index="0"
                        interactive
                    />

                    <DialogContent
                        :id="modalId"
                        as="section"
                        :force-mount="keepMounted"
                        v-bind="panelAttrs"
                        :role="role"
                        :aria-label="ariaLabel"
                        :aria-labelledby="ariaLabelledby"
                        :aria-describedby="ariaDescribedby"
                        :initial-focus="initialFocus"
                        :focus-trap-options="focusTrapOptions"
                    >
                        <div
                            v-if="hasHeader"
                            :id="headerId"
                            v-bind="getPartAttrs('header', { class: 'rp-modal__header' })"
                        >
                            <slot name="header" v-bind="slotProps">
                                <div class="rp-modal__heading">
                                    <DialogTitle
                                        v-if="title"
                                        :id="titleId"
                                        as="h2"
                                        v-bind="getPartAttrs('title', { class: 'rp-modal__title' })"
                                    >
                                        {{ title }}
                                    </DialogTitle>
                                    <DialogDescription
                                        v-if="description"
                                        :id="descriptionId"
                                        as="p"
                                        v-bind="
                                            getPartAttrs('description', {
                                                class: 'rp-modal__description',
                                            })
                                        "
                                    >
                                        {{ description }}
                                    </DialogDescription>
                                </div>
                            </slot>
                        </div>

                        <DialogClose
                            v-if="showCloseButton"
                            :as="IconButton"
                            :class-names="closeClassNames"
                            :styles="closeStyles"
                            :ariaLabel="closeLabel"
                            variant="ghost"
                            size="sm"
                        >
                            <IconX />
                        </DialogClose>

                        <div
                            v-if="$slots.default"
                            v-bind="getPartAttrs('body', { class: 'rp-modal__body' })"
                        >
                            <slot v-bind="slotProps" />
                        </div>

                        <div
                            v-if="hasFooter"
                            v-bind="getPartAttrs('footer', { class: 'rp-modal__footer' })"
                        >
                            <slot name="footer" v-bind="slotProps" />
                        </div>
                    </DialogContent>
                </div>
            </Transition>
        </DialogPortal>
    </DialogRoot>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconX from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    type DialogCloseReason,
} from '../dialog';
import IconButton from '../icon-button/icon-button.vue';
import Overlay from '../overlay/overlay.vue';
import { useModal } from './useModal';
import type { ModalPart, ModalProps } from './types';

defineOptions({ name: 'RpModal', inheritAttrs: false });

const props = withDefaults(defineProps<ModalProps>(), {
    open: undefined,
    title: '',
    description: '',
    ariaLabel: '',
    closeLabel: 'Close modal',
    role: 'dialog',
    size: 'md',
    initialFocus: null,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    overlayProps: () => ({}),
    preventScroll: true,
    returnFocus: true,
    keepMounted: false,
    modal: true,
    teleport: true,
    focusTrapOptions: () => ({}),
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [reason: DialogCloseReason];
}>();

const {
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
    setOpen,
} = useModal(props, {
    openChange: (open) => emit('update:open', open),
    close: (reason) => emit('close', reason),
});

function onDialogClose(reason: DialogCloseReason) {
    emit('close', reason);
}

const { getPartAttrs, getRootAttrs } = useStylesApi<ModalPart>(props, 'root');
const state = computed(() => (isOpen.value ? 'open' : 'closed'));
const rootAttrs = computed(() =>
    getRootAttrs({
        class: [rootClass.value, stateClass.value],
        style: rootStyle.value,
        'data-state': state.value,
    }),
);
const overlayClassNames = computed(() => ({
    root: ['rp-modal__overlay', props.classNames?.overlay],
}));
const overlayStyles = computed(() => ({ root: props.styles?.overlay }));
const panelAttrs = computed(() => ({
    ...getPartAttrs('panel', { class: 'rp-modal__panel' }),
    'data-state': state.value,
}));
const closeClassNames = computed(() => ({
    root: ['rp-modal__close', props.classNames?.close],
}));
const closeStyles = computed(() => ({ root: props.styles?.close }));
</script>

<style src="./modal.scss" lang="scss" scoped></style>
