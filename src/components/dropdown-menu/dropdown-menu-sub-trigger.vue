<template>
    <component :is="as" :ref="setElement" v-bind="rootAttrs">
        <slot
            :focused="focused"
            :disabled="isDisabled"
            :is-open="sub.isOpen.value"
            :open="sub.open"
            :close="sub.close"
        />
    </component>
</template>

<script lang="ts" setup vapor>
import { computed, mergeProps, onBeforeUnmount, useAttrs, useId, watch } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { toOptionalAttribute } from '@/utils/attributes';
import { resolveHTMLElementRef, type ComponentElementRef } from '@/utils/dom/componentRef';
import {
    menuKey,
    subKey,
    type MenuItemRegistration,
    type OpenFocusTarget,
} from './dropdownMenuContext';
import type { DropdownMenuSubTriggerPrimitiveProps } from './types';

defineOptions({ name: 'RpDropdownMenuSubTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuSubTriggerPrimitiveProps>(), {
    as: 'button',
    disabled: false,
});

defineSlots<{
    default?(props: {
        focused: boolean;
        disabled: boolean;
        isOpen: boolean;
        open: (focus?: OpenFocusTarget) => void;
        close: (focusParent?: boolean) => void;
    }): unknown;
}>();

const attrs = useAttrs();
const menu = useRequiredInject(menuKey, 'RpDropdownMenuSubTrigger');
const sub = useRequiredInject(subKey, 'RpDropdownMenuSubTrigger');
const generatedId = useId();
const id = computed(() => props.id ?? `${generatedId}-sub-trigger`);
const isDisabled = computed(() => menu.root.disabled.value || props.disabled);
const focused = computed(() => menu.isActive(id.value));

const registration: MenuItemRegistration = {
    get id() {
        return id.value;
    },
    element: () => sub.trigger.value,
    textValue: () => props.textValue ?? sub.trigger.value?.textContent?.trim() ?? '',
    disabled: () => isDisabled.value,
    activate: () => undefined,
    submenu: sub,
};

menu.registerItem(registration);
watch(
    id,
    (nextId, previousId) => {
        const wasActive = menu.activeId.value === previousId;
        menu.unregisterItem(previousId);
        menu.registerItem(registration);
        if (wasActive) menu.setActive(nextId);
    },
    { flush: 'sync' },
);
watch(isDisabled, () => menu.root.interaction.reconcile(menu.id));
onBeforeUnmount(() => menu.unregisterItem(id.value));

function setElement(value: ComponentElementRef) {
    resolveHTMLElementRef(value, id.value, (resolved) => {
        sub.trigger.value = resolved;
    });
}

function onMouseenter() {
    if (isDisabled.value) return;
    menu.hover(id.value, true);
}

function onClick(event: MouseEvent) {
    if (!event.defaultPrevented && !isDisabled.value) menu.activate(id.value, event);
}

const rootAttrs = computed(() =>
    mergeProps(attrs, {
        id: id.value,
        type: props.as === 'button' ? 'button' : undefined,
        role: 'menuitem',
        tabindex: -1,
        disabled: props.as === 'button' ? toOptionalAttribute(isDisabled.value) : undefined,
        'aria-disabled': toOptionalAttribute(isDisabled.value),
        'aria-haspopup': 'menu',
        'aria-expanded': sub.isOpen.value,
        'aria-controls': sub.contentId.value,
        'data-disabled': toOptionalAttribute(isDisabled.value),
        'data-focused': toOptionalAttribute(focused.value),
        'data-highlighted': toOptionalAttribute(focused.value),
        'data-state': sub.isOpen.value ? 'open' : 'closed',
        class: bem('rp-dropdown-menu__item', {
            focused: focused.value,
            disabled: isDisabled.value,
            submenu: true,
            open: sub.isOpen.value,
        }),
        onClick,
        onMouseenter,
    }),
);
</script>
