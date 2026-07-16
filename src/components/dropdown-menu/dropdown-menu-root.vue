<template>
    <slot v-bind="slotProps" />
</template>

<script lang="ts" setup vapor>
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, watch, useId } from 'vue';
import { useFloatingTarget } from '../floating/useFloatingPosition';
import { isEventWithinElement } from './dropdown-menu-outside';
import {
    addOpenLayer,
    createVirtualAnchor,
    getFocusTarget,
    removeOpenLayer,
    rootKey,
    type DropdownMenuRootContext,
    type ElementReference,
    type OpenFocusTarget,
} from './dropdown-menu-primitive-core';
import type {
    DropdownMenuCloseOptions,
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
const uncontrolledOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolledOpen.value);
const disabled = computed(() => props.disabled);
const modal = computed(() => props.modal);
const trigger = ref<HTMLElement | null>(null);
const triggerId = ref<string>();
const contentId = ref<string>();
const activeReference = shallowRef<ElementReference | null>(null);
const { reference: configuredReference } = useFloatingTarget(
    () => props.target ?? props.virtualAnchor,
    trigger,
);
const reference = computed<ElementReference | null>(
    () => activeReference.value ?? configuredReference.value,
);
const pendingFocus = ref<OpenFocusTarget>('first');
const inside = new Set<HTMLElement>();
let returnFocusElement: HTMLElement | null = null;

function setOpen(value: boolean) {
    if (value && disabled.value) return;
    const previous = isOpen.value;
    if (props.open === undefined) uncontrolledOpen.value = value;
    if (previous !== value) emit('update:open', value);
}

function rememberFocus() {
    if (typeof document === 'undefined' || returnFocusElement) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) returnFocusElement = activeElement;
}

function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
    if (disabled.value) return;
    rememberFocus();
    pendingFocus.value = getFocusTarget(options);
    setOpen(true);
}

function focusReturnTarget() {
    const target = returnFocusElement ?? trigger.value;
    void nextTick(() => target?.focus());
}

function close(options: DropdownMenuCloseOptions & { returnFocus?: boolean } = {}) {
    setOpen(false);
    pendingFocus.value = false;
    if (options.focusTrigger || options.returnFocus) focusReturnTarget();
}

function toggle() {
    if (isOpen.value) close({ returnFocus: true });
    else open();
}

function openAt(
    point: DropdownMenuPoint,
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
) {
    activeReference.value = createVirtualAnchor(point);
    open(options);
}

function setTrigger(element: HTMLElement | null, nextId?: string) {
    if (trigger.value && trigger.value !== element) inside.delete(trigger.value);
    trigger.value = element;
    triggerId.value = nextId;
    if (element) inside.add(element);
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
    pendingFocus,
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
    registerInside(element) {
        inside.add(element);
    },
    unregisterInside(element) {
        inside.delete(element);
    },
    isInside(event) {
        return [...inside].some((element) => isEventWithinElement(event, element));
    },
};

const slotProps = computed<DropdownMenuRootSlotProps>(() => ({
    isOpen: isOpen.value,
    open,
    close,
    toggle,
    openAt,
}));

watch(disabled, (value) => {
    if (value) close();
});
watch(
    isOpen,
    (value) => {
        if (value) addOpenLayer(context);
        else removeOpenLayer(context);
    },
    { immediate: true },
);
onBeforeUnmount(() => removeOpenLayer(context));

provide(rootKey, context);
defineExpose({ open, close, toggle, openAt });
</script>
