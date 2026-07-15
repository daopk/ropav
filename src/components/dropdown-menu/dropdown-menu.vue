<template>
    <span ref="rootRef" v-bind="rootAttrs">
        <slot v-if="!isTargetMode" v-bind="publicSlotProps" />

        <Teleport :to="teleportTo" :disabled="!shouldTeleport">
            <Transition name="rp-dropdown-menu-content">
                <div
                    v-if="isVisible"
                    ref="menuRef"
                    v-bind="publicContentProps"
                    :data-side="placementSide"
                >
                    <span
                        v-if="arrow"
                        ref="arrowRef"
                        class="rp-dropdown-menu__arrow"
                        :data-side="placementSide"
                        :style="arrowStyle"
                        aria-hidden="true"
                    />
                    <div
                        v-if="isEmpty"
                        v-bind="getPartAttrs('empty', { class: 'rp-dropdown-menu__empty' })"
                    >
                        <slot name="empty">No actions</slot>
                    </div>

                    <DropdownMenuItems :items="visibleItems" :context="publicRenderContext">
                        <template #item="itemSlotProps">
                            <slot name="item" v-bind="itemSlotProps">
                                <span
                                    v-bind="
                                        getPartAttrs('label', {
                                            class: 'rp-dropdown-menu__label',
                                        })
                                    "
                                    >{{ itemSlotProps.item.label }}</span
                                >
                                <kbd
                                    v-if="itemSlotProps.item.shortcut"
                                    v-bind="
                                        getPartAttrs('shortcut', {
                                            class: 'rp-dropdown-menu__shortcut',
                                        })
                                    "
                                >
                                    {{ itemSlotProps.item.shortcut }}
                                </kbd>
                            </slot>
                            <span
                                v-if="itemSlotProps.hasSubmenu"
                                v-bind="
                                    getPartAttrs('submenuIndicator', {
                                        class: 'rp-dropdown-menu__submenu-icon',
                                    })
                                "
                                aria-hidden="true"
                            >
                                <IconChevronRight />
                            </span>
                        </template>
                    </DropdownMenuItems>
                </div>
            </Transition>
        </Teleport>
    </span>
</template>

<script lang="ts" setup vapor>
import { computed } from 'vue';
import IconChevronRight from '~icons/lucide/chevron-right';
import { presence, useStylesApi } from '@/styles-api';
import DropdownMenuItems from './dropdown-menu-items.vue';
import { useDropdownMenu } from './useDropdownMenu';
import type {
    DropdownMenuItem,
    DropdownMenuItemSlotProps,
    DropdownMenuPart,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
    DropdownMenuSlotProps,
} from './types';

defineOptions({ name: 'RpDropdownMenu', inheritAttrs: false });

const props = withDefaults(defineProps<DropdownMenuProps>(), {
    items: () => [],
    placement: 'bottom-start',
    open: undefined,
    disabled: false,
    closeOnSelect: true,
    modal: false,
    strategy: 'absolute',
    flip: true,
    shift: true,
    collisionPadding: 8,
    arrow: false,
    teleport: true,
    portal: undefined,
});

const emit = defineEmits<{
    'update:open': [value: boolean];
    select: [item: DropdownMenuItem, event: DropdownMenuSelectEvent];
}>();

defineSlots<{
    default(props: DropdownMenuSlotProps): unknown;
    item?(props: DropdownMenuItemSlotProps): unknown;
    empty?(): unknown;
}>();

const {
    rootRef,
    menuRef,
    arrowRef,
    isVisible,
    isEmpty,
    visibleItems,
    renderContext,
    rootClass,
    contentClass,
    contentStyle,
    arrowStyle,
    placementSide,
    isTargetMode,
    teleportTo,
    shouldTeleport,
    contentProps,
    slotProps,
} = useDropdownMenu(props, {
    openChange: (open) => emit('update:open', open),
    select: (item, event) => emit('select', item, event),
});

void rootRef;
void menuRef;
void arrowRef;

const { getPartAttrs, getRootAttrs } = useStylesApi<DropdownMenuPart>(props, 'root');
const state = computed<'open' | 'closed'>(() => (isVisible.value ? 'open' : 'closed'));
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-state': state.value,
        'data-disabled': presence(props.disabled),
    }),
);
const publicSlotProps = computed(() => {
    const partAttrs = getPartAttrs('trigger');
    return {
        ...slotProps.value,
        triggerProps: {
            ...slotProps.value.triggerProps,
            ...(props.classNames?.trigger !== undefined ? { class: partAttrs.class } : {}),
            ...(props.styles?.trigger !== undefined ? { style: partAttrs.style } : {}),
            'data-state': state.value,
            'data-disabled': presence(props.disabled),
        },
    };
});
const publicContentProps = computed(() => ({
    ...contentProps.value,
    ...getPartAttrs('content', {
        class: contentClass.value,
        style: contentStyle.value,
    }),
    'data-state': state.value,
    'data-placement': placementSide.value,
}));
const publicRenderContext = computed(() => ({
    ...renderContext,
    getPublicPartAttrs: getPartAttrs,
}));
</script>

<style src="./dropdown-menu.scss" lang="scss"></style>
