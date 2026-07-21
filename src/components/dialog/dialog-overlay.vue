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
import { computed, mergeProps, ref, useAttrs, useId } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { useOverlayLayerBranch } from '@/internal/composables/useOverlayLayer';
import {
    dialogRootKey,
    resolveDialogHTMLElementRef,
    type DialogElementRefValue,
} from './dialog-core';
import type { DialogOverlayProps } from './types';

defineOptions({ name: 'RpDialogOverlay', inheritAttrs: false });

const props = withDefaults(defineProps<DialogOverlayProps>(), {
    as: 'div',
    forceMount: false,
});

const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogOverlay');
const element = ref<HTMLElement | null>(null);
const generatedId = `${useId()}-overlay`;
const id = computed(() => (typeof attrs.id === 'string' ? attrs.id : generatedId));
const shouldRender = computed(() => props.forceMount || root.isOpen.value);
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        'aria-hidden': 'true',
        'data-state': root.isOpen.value ? 'open' : 'closed',
        style: { zIndex: root.layer.zIndex.value - 1 },
    }),
);

function setElement(value: DialogElementRefValue) {
    resolveDialogHTMLElementRef(value, id.value, (resolved) => {
        element.value = resolved;
    });
}

useOverlayLayerBranch(element, { focus: false, inside: false });
void element;
</script>
