<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot :is-open="root.isOpen.value" />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, ref, useAttrs, useId } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { optionalAttr, rootKey, toHTMLElement } from './dropdown-menu-primitive-core';
import type { DropdownMenuFocusTarget, DropdownMenuTriggerPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuTriggerPrimitiveProps>(), {
    as: 'button',
    disabled: false,
});

defineSlots<{
    default?(props: { isOpen: boolean }): unknown;
}>();

const attrs = useAttrs();
const root = useRequiredInject(rootKey, 'RpDropdownMenuTrigger');
const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-trigger`);
const element = ref<HTMLElement | null>(null);
const isDisabled = computed(() => root.disabled.value || props.disabled);

function setElement(value: Element | null) {
    element.value = toHTMLElement(value);
    root.setTrigger(element.value, id.value);
}

function openWithReference(focus: DropdownMenuFocusTarget = 'first') {
    root.setReference(element.value);
    root.setReturnFocus(element.value);
    root.open({ focus });
}

function onClick(event: MouseEvent) {
    if (event.defaultPrevented || isDisabled.value) return;
    root.setReference(element.value);
    root.setReturnFocus(element.value);
    root.toggle();
}

function onKeydown(event: KeyboardEvent) {
    if (isDisabled.value) return;
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        openWithReference('last');
    } else if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        openWithReference('first');
    } else if (event.key === 'Escape') {
        root.close({ focusTrigger: true });
    }
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        disabled: props.as === 'button' ? optionalAttr(isDisabled.value) : undefined,
        'aria-controls': root.contentId.value,
        'aria-expanded': root.isOpen.value,
        'aria-haspopup': 'menu',
        'aria-disabled': props.as === 'button' ? undefined : optionalAttr(isDisabled.value),
        'data-state': root.isOpen.value ? 'open' : 'closed',
        'data-disabled': optionalAttr(isDisabled.value),
        onClick,
        onKeydown,
    }),
);

onBeforeUnmount(() => root.setTrigger(null));
</script>
