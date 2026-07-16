<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="root.isOpen.value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, useAttrs, type ComponentPublicInstance } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { dialogRootKey, toDialogHTMLElement } from './dialog-core';
import type { DialogTriggerProps } from './types';

defineOptions({ name: 'RpDialogTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DialogTriggerProps>(), {
    as: 'button',
    disabled: false,
});

defineSlots<{ default?(props: { isOpen: boolean }): unknown }>();

const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogTrigger');

function setElement(value: Element | ComponentPublicInstance | null) {
    root.setTrigger(toDialogHTMLElement(value));
}

function onClick(event: MouseEvent) {
    if (event.defaultPrevented || props.disabled) return;
    root.toggle();
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: props.id,
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
