<template>
    <slot :is-open="isOpen" :open="context.open" :close="context.close" />
</template>

<script lang="ts" setup vapor>
import { onBeforeUnmount, provide, ref, useId } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import {
    menuKey,
    subKey,
    type DropdownMenuSubContext,
    type OpenFocusTarget,
} from './dropdownMenuContext';
import type { DropdownMenuPlacement, DropdownMenuSubPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuSub' });

const props = withDefaults(defineProps<DropdownMenuSubPrimitiveProps>(), {
    open: undefined,
    defaultOpen: false,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

defineSlots<{
    default?(props: {
        isOpen: boolean;
        open: (focus?: OpenFocusTarget) => void;
        close: (focusParent?: boolean) => void;
    }): unknown;
}>();

const parentMenu = useRequiredInject(menuKey, 'RpDropdownMenuSub');
const generatedId = useId();
const menuId = `${generatedId}-interaction-menu`;
const controllableOpen = useControllableValue({
    modelValue: () => props.open,
    defaultValue: () => props.defaultOpen,
    onChange: (open) => emit('update:open', open),
});
const isOpen = controllableOpen.value;
const trigger = ref<HTMLElement | null>(null);
const contentId = ref<string>();
const actualPlacement = ref<DropdownMenuPlacement>('right-start');

function setOpen(value: boolean) {
    const previous = isOpen.value;
    if (previous !== value) controllableOpen.setValue(value);
}

const interaction = parentMenu.root.interaction.connectSubmenu({
    id: menuId,
    parentItemId: () => trigger.value?.id,
    isOpen: () => isOpen.value,
    setOpen,
});

const context: DropdownMenuSubContext = {
    menuId,
    isOpen,
    trigger,
    contentId,
    actualPlacement,
    menu: null,
    interaction,
    open(focus: OpenFocusTarget = 'first') {
        if (!interaction.open(focus)) setOpen(true);
    },
    close(focusParent = false) {
        if (!interaction.close(focusParent)) setOpen(false);
    },
};

provide(subKey, context);
onBeforeUnmount(interaction.dispose);
</script>
