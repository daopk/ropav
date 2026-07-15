<template>
    <Teleport :to="teleportTo" :disabled="!teleport">
        <Transition name="rp-modal">
            <div v-if="shouldRender" v-show="isOpen" v-bind="rootAttrs">
                <Overlay
                    v-bind="overlayProps"
                    :class-names="overlayClassNames"
                    :styles="overlayStyles"
                    :z-index="0"
                    interactive
                    @click="onOverlayClick"
                />

                <section
                    :id="modalId"
                    ref="panelRef"
                    v-bind="panelAttrs"
                    :role="role"
                    aria-modal="true"
                    :aria-label="ariaLabel"
                    :aria-labelledby="ariaLabelledby"
                    :aria-describedby="ariaDescribedby"
                    tabindex="-1"
                >
                    <div
                        v-if="hasHeader"
                        :id="headerId"
                        v-bind="getPartAttrs('header', { class: 'rp-modal__header' })"
                    >
                        <slot name="header" v-bind="slotProps">
                            <div class="rp-modal__heading">
                                <h2
                                    v-if="title"
                                    :id="titleId"
                                    v-bind="getPartAttrs('title', { class: 'rp-modal__title' })"
                                >
                                    {{ title }}
                                </h2>
                                <p
                                    v-if="description"
                                    :id="descriptionId"
                                    v-bind="
                                        getPartAttrs('description', {
                                            class: 'rp-modal__description',
                                        })
                                    "
                                >
                                    {{ description }}
                                </p>
                            </div>
                        </slot>
                    </div>

                    <IconButton
                        v-if="showCloseButton"
                        :class-names="closeClassNames"
                        :styles="closeStyles"
                        :ariaLabel="closeLabel"
                        variant="ghost"
                        size="sm"
                        @click="closeModal"
                    >
                        <IconX />
                    </IconButton>

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
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconX from '~icons/lucide/x';
import { useStylesApi } from '@/styles-api';
import IconButton from '../icon-button/icon-button.vue';
import Overlay from '../overlay/overlay.vue';
import { useTeleportTarget } from '../teleport-provider/useTeleportTarget';
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
    teleport: true,
    focusTrapOptions: () => ({}),
});

const teleportTo = useTeleportTarget(() => props.teleportTo);

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
