<template>
    <slot v-bind="slotProps" />
</template>

<script lang="ts" setup vapor>
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watch, useId } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useOverlayLayer } from '@/internal/composables/useOverlayLayer';
import { useFloatingTargetLifecycle } from '../floating/useFloatingTargetLifecycle';
import { useOverlayZIndex } from '../overlay/useOverlayZIndex';
import {
    createVirtualAnchor,
    rootKey,
    type DropdownMenuRootContext,
    type ElementReference,
} from './dropdownMenuContext';
import { useDropdownMenuInteraction } from './dropdownMenuInteraction';
import type {
    DropdownMenuFocusTarget,
    DropdownMenuOpenOptions,
    DropdownMenuPoint,
    DropdownMenuRootPrimitiveProps,
    DropdownMenuRootSlotProps,
} from './types';

defineOptions({ name: 'RpDropdownMenuRoot' });

const props = withDefaults(defineProps<DropdownMenuRootPrimitiveProps>(), {
    open: undefined,
    defaultOpen: false,
    disabled: false,
    modal: true,
    target: null,
    virtualAnchor: null,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

defineSlots<{
    default?(props: DropdownMenuRootSlotProps): unknown;
}>();

const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-dropdown-menu`);
const controllableOpen = useControllableValue({
    modelValue: () => props.open,
    defaultValue: () => props.defaultOpen,
    onChange: (nextOpen) => emit('update:open', nextOpen),
});
const isOpen = controllableOpen.value;
const disabled = computed(() => props.disabled);
const modal = computed(() => props.modal);
const trigger = ref<HTMLElement | null>(null);
const triggerId = ref<string>();
const contentId = ref<string>();
const activeReference = shallowRef<ElementReference | null>(null);
const { reference: configuredReference } = useFloatingTargetLifecycle({
    target: () => props.target ?? props.virtualAnchor,
    fallback: trigger,
});
const reference = computed<ElementReference | null>(
    () => activeReference.value ?? configuredReference.value,
);
const contentElement = ref<HTMLElement | null>(null);
let returnFocusElement: HTMLElement | null = null;
const baseZIndex = useOverlayZIndex({
    baseZIndex: () => props.baseZIndex,
    defaultBaseZIndex: 100,
    aboveParent: false,
});
const layer = useOverlayLayer({
    active: computed(() => isOpen.value && !disabled.value),
    element: contentElement,
    baseZIndex,
});

function setOpen(value: boolean) {
    if (value && disabled.value) return;
    const previous = isOpen.value;
    if (previous !== value) controllableOpen.setValue(value);
}

function rememberFocus() {
    if (typeof document === 'undefined' || returnFocusElement) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) returnFocusElement = activeElement;
}

function focusReturnTarget() {
    const target = returnFocusElement ?? trigger.value;
    void nextTick(() => target?.focus());
}

const interactionRootMenuId = `${generatedId}-interaction-root`;
const interaction = useDropdownMenuInteraction({
    rootMenuId: interactionRootMenuId,
    isOpen,
    disabled,
    modal,
    setOpen,
    connectLayerInteraction: layer.connectInteraction,
    focusTrigger: focusReturnTarget,
    beforeOpen: rememberFocus,
});
const { open, close, toggle } = interaction;

function openAt(
    point: DropdownMenuPoint,
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
) {
    activeReference.value = createVirtualAnchor(point);
    open(options);
}

let disconnectTrigger: (() => void) | undefined;

function setTrigger(element: HTMLElement | null, nextId?: string) {
    disconnectTrigger?.();
    disconnectTrigger = undefined;
    trigger.value = element;
    triggerId.value = nextId;
    if (element) disconnectTrigger = interaction.connectInside(element);
}

const context: DropdownMenuRootContext = {
    id,
    isOpen,
    disabled,
    modal,
    trigger,
    triggerId,
    contentId,
    reference,
    interactionRootMenuId,
    layer,
    interaction,
    open,
    close,
    toggle,
    openAt,
    setTrigger,
    setReference(nextReference) {
        activeReference.value = nextReference;
    },
    setReturnFocus(element) {
        returnFocusElement = element;
    },
    connectInside: interaction.connectInside,
};

const slotProps = computed<DropdownMenuRootSlotProps>(() => ({
    isOpen: isOpen.value,
    open,
    close,
    toggle,
    openAt,
}));

watch(
    isOpen,
    (value) => {
        if (!value) activeReference.value = null;
    },
    { flush: 'sync' },
);
provide(rootKey, context);
onBeforeUnmount(() => disconnectTrigger?.());
defineExpose({ open, close, toggle, openAt });
</script>
