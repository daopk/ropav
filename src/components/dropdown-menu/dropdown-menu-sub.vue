<template>
    <slot :is-open="isOpen" :open="context.open" :close="context.close" />
</template>

<script lang="ts" setup vapor>
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import {
    menuKey,
    subKey,
    type DropdownMenuSubContext,
    type OpenFocusTarget,
} from './dropdown-menu-primitive-core';
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
const uncontrolled = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? uncontrolled.value);
const trigger = ref<HTMLElement | null>(null);
const contentId = ref<string>();
const actualPlacement = ref<DropdownMenuPlacement>('right-start');
const pendingFocus = ref<OpenFocusTarget>(false);

function setOpen(value: boolean) {
    const previous = isOpen.value;
    if (props.open === undefined) uncontrolled.value = value;
    if (previous !== value) emit('update:open', value);
}

const context: DropdownMenuSubContext = {
    isOpen,
    trigger,
    contentId,
    actualPlacement,
    pendingFocus,
    menu: null,
    open(focus: OpenFocusTarget = 'first') {
        parentMenu.closeSubmenus(context);
        pendingFocus.value = focus;
        setOpen(true);
        if (focus) void nextTick(() => context.menu?.focus(focus));
    },
    close(focusParent = false) {
        setOpen(false);
        pendingFocus.value = false;
        context.menu?.closeSubmenus();
        if (focusParent) {
            parentMenu.setActive(trigger.value?.id ?? '');
            parentMenu.focusElement();
        }
    },
};

parentMenu.registerSub(context);
provide(subKey, context);
watch(parentMenu.root.isOpen, (open) => {
    if (!open) context.close(false);
});
onBeforeUnmount(() => parentMenu.unregisterSub(context));
</script>
