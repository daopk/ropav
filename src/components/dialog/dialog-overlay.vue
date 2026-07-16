<template>
    <component
        v-if="shouldRender"
        v-show="root.isOpen.value"
        :is="as"
        :ref="setElement"
        v-bind="rootAttrs"
    >
        <slot />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, ref, useAttrs, type ComponentPublicInstance } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { useOverlayLayerBranch } from '@/composables/useOverlayLayer';
import { dialogRootKey, toDialogHTMLElement } from './dialog-core';
import type { DialogOverlayProps } from './types';

defineOptions({ name: 'RpDialogOverlay', inheritAttrs: false });

const props = withDefaults(defineProps<DialogOverlayProps>(), {
    as: 'div',
    forceMount: false,
});

const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogOverlay');
const element = ref<HTMLElement | null>(null);
const shouldRender = computed(() => props.forceMount || root.isOpen.value);
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        'aria-hidden': 'true',
        'data-state': root.isOpen.value ? 'open' : 'closed',
        style: { zIndex: root.layer.zIndex.value - 1 },
    }),
);

function setElement(value: Element | ComponentPublicInstance | null) {
    element.value = toDialogHTMLElement(value);
}

useOverlayLayerBranch(element, { focus: false, inside: false });
void element;
</script>
