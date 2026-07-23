<template>
    <component
        v-if="shouldRender"
        v-show="root.isOpen.value"
        :is="as"
        :ref="setElement"
        v-bind="rootAttrs"
    >
        <slot :is-open="root.isOpen.value" :close="root.close" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, isRef, mergeProps, onBeforeUnmount, useAttrs, watch } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import { querySelectorSafe } from '@/utils/dom/query';
import { useFocusTrap } from '../focus-trap/useFocusTrap';
import type { FocusTrapContainers } from '../focus-trap/types';
import { createDialogEvent, dialogRootKey } from './dialogContext';
import type { DialogCloseReason, DialogContentProps, DialogInteractOutsideEvent } from './types';

defineOptions({ name: 'RpDialogContent', inheritAttrs: false });

const props = withDefaults(defineProps<DialogContentProps>(), {
    as: 'div',
    role: 'dialog',
    forceMount: false,
    initialFocus: null,
    focusTrapOptions: () => ({}),
});

const emit = defineEmits<{
    escapeKeyDown: [event: CustomEvent<{ originalEvent: KeyboardEvent }>];
    pointerDownOutside: [event: DialogInteractOutsideEvent];
    interactOutside: [event: DialogInteractOutsideEvent];
}>();

defineSlots<{
    default?(props: { isOpen: boolean; close: (reason?: DialogCloseReason) => void }): unknown;
}>();

const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogContent');
const id = computed(() => props.id ?? root.contentId.value);
const shouldRender = computed(() => props.forceMount || root.isOpen.value);
const focusTrapContainers = computed<FocusTrapContainers | null>(() => {
    const content = root.contentRef.value;
    if (!content) return null;
    return [content, ...root.layer.focusBranches.value];
});
const ariaLabelledby = computed(() => {
    if (props.ariaLabel) return undefined;
    return props.ariaLabelledby ?? (root.titleIds.value.join(' ') || undefined);
});
const ariaDescribedby = computed(
    () => props.ariaDescribedby ?? (root.descriptionIds.value.join(' ') || undefined),
);

function resolveInitialFocus() {
    const initialFocus = props.initialFocus;
    const resolved = isRef(initialFocus) ? initialFocus.value : initialFocus;
    if (typeof resolved !== 'string') return resolved ?? undefined;
    return querySelectorSafe<HTMLElement>(resolved, root.contentRef.value) ?? undefined;
}

const focusTrap = useFocusTrap(focusTrapContainers, {
    ...props.focusTrapOptions,
    initialFocus: resolveInitialFocus,
    fallbackFocus: () => root.contentRef.value!,
    returnFocusOnDeactivate: false,
    escapeDeactivates: false,
    allowOutsideClick: true,
    preventScroll: true,
    delayInitialFocus: props.focusTrapOptions.delayInitialFocus ?? false,
});

function setElement(value: ComponentElementRef) {
    resolveHTMLElementRef(value, id.value, (element) => root.setContent(element, id.value));
}

function onDocumentKeydown(event: KeyboardEvent) {
    if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        !root.closeOnEscape.value ||
        !root.layer.isTopLayer()
    ) {
        return;
    }
    const customEvent = createDialogEvent(
        'dialog-escape-key-down',
        { originalEvent: event },
        event,
    );
    emit('escapeKeyDown', customEvent);
    if (customEvent.defaultPrevented) return;
    event.preventDefault();
    root.close('escape');
}

function onDocumentPointerdown(event: PointerEvent) {
    if (
        event.defaultPrevented ||
        !root.closeOnOutsideClick.value ||
        !root.layer.isTopLayer() ||
        root.layer.isInside(event)
    ) {
        return;
    }
    const customEvent = createDialogEvent(
        'dialog-pointer-down-outside',
        { originalEvent: event },
        event,
    );
    emit('pointerDownOutside', customEvent);
    emit('interactOutside', customEvent);
    if (!customEvent.defaultPrevented) root.close('outside');
}

function setDocumentListeners(active: boolean) {
    const document = root.contentRef.value?.ownerDocument;
    if (!document) return;
    const method = active ? 'addEventListener' : 'removeEventListener';
    document[method]('keydown', onDocumentKeydown as EventListener);
    document[method]('pointerdown', onDocumentPointerdown as EventListener, true);
}

watch(
    [root.isOpen, root.modal, root.contentRef],
    ([open, modal], _previous, onCleanup) => {
        if (!open || !root.contentRef.value) {
            focusTrap.deactivate({ returnFocus: false });
            return;
        }
        setDocumentListeners(true);
        if (modal) focusTrap.activate();
        else focusTrap.deactivate({ returnFocus: false });
        onCleanup(() => setDocumentListeners(false));
    },
    { flush: 'post', immediate: true },
);

watch(
    id,
    (nextId) => {
        root.setContent(root.contentRef.value, nextId);
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    setDocumentListeners(false);
    focusTrap.deactivate({ returnFocus: false });
    root.setContent(null, id.value);
});

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        role: props.role,
        tabindex: root.modal.value ? -1 : undefined,
        'aria-modal': root.modal.value ? 'true' : undefined,
        'aria-label': props.ariaLabel,
        'aria-labelledby': ariaLabelledby.value,
        'aria-describedby': ariaDescribedby.value,
        'data-state': root.isOpen.value ? 'open' : 'closed',
        'data-modal': root.modal.value ? '' : undefined,
        style: { zIndex: root.layer.zIndex.value },
    }),
);
</script>
