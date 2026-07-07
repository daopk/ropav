<template>
    <Transition name="rp-modal">
        <div
            v-if="shouldRender"
            v-show="isOpen"
            :class="[rootClass, stateClass]"
            :style="rootStyle"
        >
            <Overlay
                v-bind="overlayProps"
                class="rp-modal__overlay"
                :z-index="0"
                interactive
                @click="onOverlayClick"
            />

            <section
                :id="modalId"
                ref="panelRef"
                class="rp-modal__panel"
                :role="role"
                aria-modal="true"
                :aria-label="ariaLabel"
                :aria-labelledby="ariaLabelledby"
                :aria-describedby="ariaDescribedby"
                tabindex="-1"
            >
                <div v-if="hasHeader" class="rp-modal__header" :id="headerId">
                    <slot name="header" v-bind="slotProps">
                        <div class="rp-modal__heading">
                            <h2 v-if="title" :id="titleId" class="rp-modal__title">
                                {{ title }}
                            </h2>
                            <p v-if="description" :id="descriptionId" class="rp-modal__description">
                                {{ description }}
                            </p>
                        </div>
                    </slot>
                </div>

                <IconButton
                    v-if="showCloseButton"
                    class="rp-modal__close"
                    :ariaLabel="closeLabel"
                    variant="ghost"
                    size="sm"
                    @click="closeModal"
                >
                    <IconX />
                </IconButton>

                <div v-if="$slots.default" class="rp-modal__body">
                    <slot v-bind="slotProps" />
                </div>

                <div v-if="hasFooter" class="rp-modal__footer">
                    <slot name="footer" v-bind="slotProps" />
                </div>
            </section>
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import IconX from '~icons/lucide/x';
import IconButton from '../icon-button/icon-button.vue';
import Overlay from '../overlay/overlay.vue';
import { useModal } from './useModal';
import type { ModalProps } from './types';

defineOptions({ name: 'RpModal' });

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
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const {
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
    closeModal,
    onOverlayClick,
} = useModal(props, (open) => {
    emit('update:open', open);
});

void panelRef;
</script>

<style src="./modal.scss" lang="scss" scoped></style>
