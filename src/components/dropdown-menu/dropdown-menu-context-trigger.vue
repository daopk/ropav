<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="root.isOpen.value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, ref, useAttrs, useId } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { toOptionalAttribute } from '@/utils/attributes';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { rootKey } from './dropdownMenuContext';
import type { DropdownMenuContextTriggerPrimitiveProps, DropdownMenuPoint } from './types';

defineOptions({ name: 'RpDropdownMenuContextTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuContextTriggerPrimitiveProps>(), {
    as: 'span',
    disabled: false,
    longPressDelay: 700,
    longPressTolerance: 10,
});

defineSlots<{
    default?(props: { isOpen: boolean }): unknown;
}>();

const attrs = useAttrs();
const root = useRequiredInject(rootKey, 'RpDropdownMenuContextTrigger');
const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-context-trigger`);
const element = ref<HTMLElement | null>(null);
const isDisabled = computed(() => root.disabled.value || props.disabled);
let timer: ReturnType<typeof setTimeout> | undefined;
let pointerId: number | undefined;
let startPoint: DropdownMenuPoint | undefined;
let longPressOpened = false;
let suppressUntil = 0;

function setElement(value: ComponentElementRef) {
    resolveHTMLElementRef(value, id.value, (resolved) => {
        const previous = element.value;
        if (previous) root.unregisterInside(previous);
        element.value = resolved;
        if (resolved) root.registerInside(resolved);
        if (!root.triggerId.value) root.triggerId.value = id.value;
    });
}

function clearLongPress() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pointerId = undefined;
    startPoint = undefined;
    element.value?.ownerDocument.defaultView?.removeEventListener('scroll', clearLongPress, true);
}

function openAt(point: DropdownMenuPoint) {
    root.setReturnFocus(element.value);
    root.openAt(point);
}

function onContextmenu(event: MouseEvent) {
    if (isDisabled.value) return;
    event.preventDefault();
    if (Date.now() < suppressUntil) return;
    openAt({ x: event.clientX, y: event.clientY });
}

function onKeydown(event: KeyboardEvent) {
    if (isDisabled.value) return;
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const rect = element.value?.getBoundingClientRect();
    openAt({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 });
}

function onPointerdown(event: PointerEvent) {
    if (isDisabled.value || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;

    clearLongPress();
    pointerId = event.pointerId;
    startPoint = { x: event.clientX, y: event.clientY };
    longPressOpened = false;
    const view = element.value?.ownerDocument.defaultView;
    view?.addEventListener('scroll', clearLongPress, true);
    timer = setTimeout(() => {
        if (!startPoint) return;
        longPressOpened = true;
        suppressUntil = Date.now() + 1000;
        openAt(startPoint);
        timer = undefined;
    }, props.longPressDelay);
}

function onPointermove(event: PointerEvent) {
    if (event.pointerId !== pointerId || !startPoint) return;
    const distance = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y);
    if (distance > props.longPressTolerance) clearLongPress();
}

function finishPointer(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    if (longPressOpened) event.preventDefault();
    clearLongPress();
}

function onClick(event: MouseEvent) {
    if (Date.now() >= suppressUntil) return;
    event.preventDefault();
    event.stopPropagation();
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        'aria-controls': root.contentId.value,
        'aria-haspopup': 'menu',
        'aria-disabled': toOptionalAttribute(isDisabled.value),
        'data-state': root.isOpen.value ? 'open' : 'closed',
        'data-disabled': toOptionalAttribute(isDisabled.value),
        onClick,
        onContextmenu,
        onKeydown,
        onPointerdown,
        onPointermove,
        onPointerup: finishPointer,
        onPointercancel: finishPointer,
    }),
);

onBeforeUnmount(() => {
    clearLongPress();
    if (element.value) root.unregisterInside(element.value);
    if (root.triggerId.value === id.value) root.triggerId.value = undefined;
});
</script>
