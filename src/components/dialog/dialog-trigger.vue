<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="root.isOpen.value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, useAttrs, useId } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import {
    dialogRootKey,
    resolveDialogHTMLElementRef,
    type DialogElementRefValue,
} from './dialog-core';
import type { DialogTriggerProps } from './types';

defineOptions({ name: 'RpDialogTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DialogTriggerProps>(), {
    as: 'button',
    disabled: false,
});

defineSlots<{ default?(props: { isOpen: boolean }): unknown }>();

const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogTrigger');
const generatedId = `${useId()}-trigger`;
const id = computed(() => props.id ?? generatedId);

function setElement(value: DialogElementRefValue) {
    resolveDialogHTMLElementRef(value, id.value, root.setTrigger);
}

function onClick(event: MouseEvent) {
    if (event.defaultPrevented || props.disabled) return;
    root.toggle();
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        disabled: props.as === 'button' ? props.disabled || undefined : undefined,
        'aria-controls': root.contentId.value,
        'aria-expanded': root.isOpen.value,
        'aria-haspopup': 'dialog',
        'aria-disabled': props.as === 'button' ? undefined : props.disabled || undefined,
        'data-state': root.isOpen.value ? 'open' : 'closed',
        'data-disabled': props.disabled ? '' : undefined,
        onClick,
    }),
);

onBeforeUnmount(() => root.setTrigger(null));
</script>
