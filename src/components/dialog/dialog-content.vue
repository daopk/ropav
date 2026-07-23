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
import { computed, mergeProps, useAttrs } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { toPresenceAttribute } from '@/utils/attributes';
import { dialogRootKey } from './dialogContext';
import type { DialogCloseReason, DialogContentProps, DialogInteractOutsideEvent } from './types';
import { useDialogContentInteractions } from './useDialogContentInteractions';

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
const shouldRender = computed(() => props.forceMount || root.isOpen.value);
const { id, setElement } = useDialogContentInteractions(root, props, {
    escapeKeyDown: (event) => emit('escapeKeyDown', event),
    pointerDownOutside: (event) => emit('pointerDownOutside', event),
    interactOutside: (event) => emit('interactOutside', event),
});
const ariaLabelledby = computed(() => {
    if (props.ariaLabel) return undefined;
    return props.ariaLabelledby ?? (root.titleIds.value.join(' ') || undefined);
});
const ariaDescribedby = computed(
    () => props.ariaDescribedby ?? (root.descriptionIds.value.join(' ') || undefined),
);

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
        'data-modal': toPresenceAttribute(root.modal.value),
        style: { zIndex: root.layer.zIndex.value },
    }),
);
</script>
