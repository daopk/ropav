<template>
    <Transition name="rp-modal">
        <div
            v-if="shouldRender"
            v-show="isVisible"
            :class="[rootClass, stateClass]"
            :style="rootStyle"
            @click="onOverlayClick"
        >
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
                    <slot
                        name="header"
                        :is-open="slotProps.isOpen"
                        :open="slotProps.open"
                        :close="slotProps.close"
                        :toggle="slotProps.toggle"
                    >
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
                    <slot
                        :is-open="slotProps.isOpen"
                        :open="slotProps.open"
                        :close="slotProps.close"
                        :toggle="slotProps.toggle"
                    />
                </div>

                <div v-if="hasFooter" class="rp-modal__footer">
                    <slot
                        name="footer"
                        :is-open="slotProps.isOpen"
                        :open="slotProps.open"
                        :close="slotProps.close"
                        :toggle="slotProps.toggle"
                    />
                </div>
            </section>
        </div>
    </Transition>
</template>

<script lang="ts" setup vapor>
import { computed, useSlots } from 'vue';
import IconX from '~icons/lucide/x';
import IconButton from '../icon-button/icon-button.vue';
import { useModal } from './useModal';
import type { ModalProps } from './types';

defineOptions({ name: 'RpModal' });

const props = withDefaults(defineProps<ModalProps>(), {
    open: undefined,
    defaultOpen: false,
    title: '',
    description: '',
    ariaLabel: '',
    closeLabel: 'Close modal',
    role: 'dialog',
    size: 'md',
    initialFocus: null,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    hideCloseButton: false,
    preventScroll: true,
    returnFocus: true,
    keepMounted: false,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const slots = useSlots();

const {
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
    closeModal,
    onOverlayClick,
} = useModal(props, (open) => {
    emit('update:open', open);
});

const hasCustomHeader = computed(() => Boolean(slots.header));
const hasTitle = computed(() => Boolean(props.title));
const hasDescription = computed(() => Boolean(props.description));
const hasHeader = computed(() =>
    Boolean(hasCustomHeader.value || hasTitle.value || hasDescription.value),
);
const hasFooter = computed(() => Boolean(slots.footer));
const showCloseButton = computed(() => !props.hideCloseButton);

const headerId = computed(() =>
    hasCustomHeader.value && !props.ariaLabel ? titleId.value : undefined,
);
const ariaLabelledby = computed(() => {
    if (props.ariaLabel) return undefined;
    return hasCustomHeader.value || hasTitle.value ? titleId.value : undefined;
});
const ariaDescribedby = computed(() =>
    hasDescription.value && !hasCustomHeader.value ? descriptionId.value : undefined,
);
const ariaLabel = computed(() => (ariaLabelledby.value ? undefined : props.ariaLabel || undefined));
const stateClass = computed(() => ({
    'rp-modal--closable': showCloseButton.value,
    'rp-modal--headerless': !hasHeader.value,
}));

void panelRef;
</script>

<style src="./modal.scss" lang="scss" scoped></style>
