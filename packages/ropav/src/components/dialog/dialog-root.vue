<template>
    <slot v-bind="slotProps" />
</template>

<script lang="ts" setup vapor>
import { provide } from 'vue';
import { dialogRootKey } from './dialogContext';
import type { DialogCloseReason, DialogRootProps, DialogRootSlotProps } from './types';
import { useDialogRootState } from './useDialogRootState';

defineOptions({ name: 'RpDialogRoot' });

const props = withDefaults(defineProps<DialogRootProps>(), {
    open: undefined,
    defaultOpen: false,
    modal: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    preventScroll: true,
    returnFocus: true,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [reason: DialogCloseReason];
}>();

defineSlots<{ default?(props: DialogRootSlotProps): unknown }>();

const { context, slotProps } = useDialogRootState(props, {
    openChange: (open) => emit('update:open', open),
    close: (reason) => emit('close', reason),
});

provide(dialogRootKey, context);
defineExpose({ open: context.open, close: context.close, toggle: context.toggle });
</script>
