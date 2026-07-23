<template>
    <slot v-bind="slotProps" />
</template>

<script lang="ts" setup vapor>
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, useId, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import { dialogRootKey, resolveDialogCloseReason, type DialogRootContext } from './dialogContext';
import type { DialogCloseReason, DialogRootProps, DialogRootSlotProps } from './types';

defineOptions({ name: 'RpDialogRoot' });

const props = withDefaults(defineProps<DialogRootProps>(), {
    open: undefined,
    defaultOpen: false,
    modal: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    preventScroll: true,
    returnFocus: true,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [reason: DialogCloseReason];
}>();

defineSlots<{ default?(props: DialogRootSlotProps): unknown }>();

const generatedId = useId();
const controllableOpen = useControllableValue({
    modelValue: () => props.open,
    defaultValue: () => props.defaultOpen,
    onChange: (value) => emit('update:open', value),
});
const isOpen = controllableOpen.value;
const modal = computed(() => props.modal);
const closeOnEscape = computed(() => props.closeOnEscape);
const closeOnOutsideClick = computed(() => props.closeOnOutsideClick);
const preventScroll = computed(() => props.preventScroll);
const returnFocus = computed(() => props.returnFocus);
const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const defaultContentId = `${generatedId}-dialog`;
const contentId = ref(defaultContentId);
const titleIds = shallowRef<readonly string[]>([]);
const descriptionIds = shallowRef<readonly string[]>([]);
let restoreFocusTo: HTMLElement | null = null;

const baseZIndex = useOverlayZIndex({
    baseZIndex: () => props.baseZIndex,
    defaultBaseZIndex: 1000,
    aboveParent: false,
});

const layer = useOverlayLayer({
    active: isOpen,
    element: contentRef,
    modal,
    modalEffects: true,
    preventScroll,
    baseZIndex,
});

function setOpen(value: boolean) {
    const previous = isOpen.value;
    if (previous !== value) controllableOpen.setValue(value);
}

function rememberFocus() {
    if (typeof document === 'undefined' || restoreFocusTo) return;
    const activeElement = document.activeElement;
    restoreFocusTo =
        activeElement instanceof HTMLElement && activeElement !== document.body
            ? activeElement
            : triggerRef.value;
}

function restoreFocus() {
    const target = restoreFocusTo ?? triggerRef.value;
    restoreFocusTo = null;
    if (!returnFocus.value) return;
    void nextTick(() => {
        if (target?.isConnected) target.focus({ preventScroll: true });
    });
}

function open() {
    if (isOpen.value) return;
    rememberFocus();
    setOpen(true);
}

function close(reason: DialogCloseReason = 'programmatic') {
    if (!isOpen.value) return;
    setOpen(false);
    emit('close', resolveDialogCloseReason(reason));
}

function toggle() {
    if (isOpen.value) close('programmatic');
    else open();
}

function setTrigger(element: HTMLElement | null) {
    triggerRef.value = element;
}

function setContent(element: HTMLElement | null, id: string) {
    contentRef.value = element;
    contentId.value = id;
}

function registerId(target: typeof titleIds, id: string) {
    target.value = [...target.value.filter((value) => value !== id), id];
    return () => {
        target.value = target.value.filter((value) => value !== id);
    };
}

const context: DialogRootContext = {
    isOpen,
    modal,
    closeOnEscape,
    closeOnOutsideClick,
    returnFocus,
    triggerRef,
    contentRef,
    contentId,
    titleIds,
    descriptionIds,
    layer,
    open,
    close,
    toggle,
    setTrigger,
    setContent,
    registerTitle: (id) => registerId(titleIds, id),
    registerDescription: (id) => registerId(descriptionIds, id),
};

const slotProps = computed<DialogRootSlotProps>(() => ({
    isOpen: isOpen.value,
    zIndex: layer.zIndex.value,
    open,
    close,
    toggle,
}));

watch(
    isOpen,
    (value, previous) => {
        if (value && !previous) rememberFocus();
        else if (!value && previous) restoreFocus();
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (isOpen.value) restoreFocus();
});

provide(dialogRootKey, context);
defineExpose({ open, close, toggle });
</script>
