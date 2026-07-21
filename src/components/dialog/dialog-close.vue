<template>
    <component :is="as" v-bind="rootAttrs"><slot /></component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, useAttrs } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { dialogRootKey } from './dialog-core';
import type { DialogCloseProps } from './types';

defineOptions({ name: 'RpDialogClose', inheritAttrs: false });
const props = withDefaults(defineProps<DialogCloseProps>(), {
    as: 'button',
    disabled: false,
});
const attrs = useAttrs();
const root = useRequiredInject(dialogRootKey, 'RpDialogClose');
function onClick(event: MouseEvent) {
    if (event.defaultPrevented || props.disabled) return;
    root.close('programmatic');
}
const rootAttrs = computed(() =>
    mergeProps(attrs, {
        type: props.as === 'button' ? 'button' : undefined,
        disabled: props.as === 'button' ? props.disabled || undefined : undefined,
        'aria-disabled': props.as === 'button' ? undefined : props.disabled || undefined,
        'data-disabled': props.disabled ? '' : undefined,
        onClick,
    }),
);
</script>
