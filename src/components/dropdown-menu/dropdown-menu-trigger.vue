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

function setElement(value: ComponentElementRef) {
    resolveHTMLElementRef(value, id.value, (resolved) => {
        element.value = resolved;
        root.setTrigger(resolved, id.value);
    });
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
        disabled: props.as === 'button' ? toOptionalAttribute(isDisabled.value) : undefined,
        'aria-controls': root.contentId.value,
        'aria-expanded': root.isOpen.value,
        'aria-haspopup': 'menu',
        'aria-disabled': props.as === 'button' ? undefined : toOptionalAttribute(isDisabled.value),
        'data-state': root.isOpen.value ? 'open' : 'closed',
        'data-disabled': toOptionalAttribute(isDisabled.value),
        onClick,
        onKeydown,
    }),
);

onBeforeUnmount(() => root.setTrigger(null));
</script>
