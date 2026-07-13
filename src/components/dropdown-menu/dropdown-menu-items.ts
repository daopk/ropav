import { computed, defineComponent, h, type PropType, type VNode } from 'vue';
import type { DropdownMenuItem, DropdownMenuItemSlotProps } from './types';
import { getPathKey, hasItemSubmenu, type ItemPath } from './dropdown-menu-utils';
import type { DropdownMenuRenderContext } from './useDropdownMenuRenderItems';

type DropdownMenuItemRenderer = (props: DropdownMenuItemSlotProps) => VNode[] | undefined;

const contextProp = {
    type: Object as PropType<DropdownMenuRenderContext>,
    required: true,
} as const;

const renderItemProp = {
    type: Function as PropType<DropdownMenuItemRenderer>,
    required: true,
} as const;

const DropdownMenuItemRow = defineComponent({
    name: 'RpDropdownMenuItemRow',
    props: {
        context: contextProp,
        disabled: {
            type: Boolean,
            required: true,
        },
        focused: {
            type: Boolean,
            required: true,
        },
        index: {
            type: Number,
            required: true,
        },
        item: {
            type: Object as PropType<DropdownMenuItem>,
            required: true,
        },
        parentPath: {
            type: Array as PropType<ItemPath>,
            required: true,
        },
        renderItem: renderItemProp,
        submenuOpen: {
            type: Boolean,
            required: true,
        },
    },
    setup(props) {
        const path = computed<ItemPath>(() => [...props.parentPath, props.index]);

        return () => {
            const currentPath = path.value;
            const hasSubmenu = hasItemSubmenu(props.item);
            const children: VNode[] = [
                h(
                    'button',
                    props.context.getItemProps(
                        props.item,
                        currentPath,
                        props.focused,
                        props.disabled,
                        props.submenuOpen,
                    ),
                    props.renderItem(
                        props.context.getItemSlotProps(
                            props.item,
                            currentPath,
                            props.focused,
                            props.disabled,
                            props.submenuOpen,
                        ),
                    ),
                ),
            ];

            if (hasSubmenu && props.submenuOpen) {
                children.push(
                    h(DropdownMenuSubmenu, {
                        context: props.context,
                        item: props.item,
                        path: currentPath,
                        renderItem: props.renderItem,
                    }),
                );
            }

            return h(
                'div',
                {
                    class: 'rp-dropdown-menu__item-wrap',
                    role: 'none',
                },
                children,
            );
        };
    },
});

const DropdownMenuItemsList = defineComponent({
    name: 'RpDropdownMenuItemsList',
    props: {
        context: contextProp,
        items: {
            type: Array as PropType<DropdownMenuItem[]>,
            required: true,
        },
        parentPath: {
            type: Array as PropType<ItemPath>,
            default: () => [],
        },
        renderItem: renderItemProp,
    },
    setup(props) {
        return () =>
            props.items.map((item, index) => {
                const path = [...props.parentPath, index];
                const hasSubmenu = hasItemSubmenu(item);

                return h(DropdownMenuItemRow, {
                    key: `${getPathKey(path)}:${String(item.value)}`,
                    context: props.context,
                    disabled: Boolean(item.disabled),
                    focused: props.context.isItemFocused(path),
                    index,
                    item,
                    parentPath: props.parentPath,
                    renderItem: props.renderItem,
                    submenuOpen: hasSubmenu && props.context.isSubmenuOpen(path),
                });
            });
    },
});

const DropdownMenuSubmenu = defineComponent({
    name: 'RpDropdownMenuSubmenu',
    props: {
        context: contextProp,
        item: {
            type: Object as PropType<DropdownMenuItem>,
            required: true,
        },
        path: {
            type: Array as PropType<ItemPath>,
            required: true,
        },
        renderItem: renderItemProp,
    },
    setup(props) {
        return () =>
            h('div', props.context.getSubmenuProps(props.item, props.path, true), [
                h(DropdownMenuItemsList, {
                    context: props.context,
                    items: props.item.children ?? [],
                    parentPath: props.path,
                    renderItem: props.renderItem,
                }),
            ]);
    },
});

export default defineComponent({
    name: 'RpDropdownMenuItems',
    props: {
        context: contextProp,
        items: {
            type: Array as PropType<DropdownMenuItem[]>,
            required: true,
        },
    },
    setup(props, { slots }) {
        const renderItem: DropdownMenuItemRenderer = (slotProps) => slots.item?.(slotProps);

        return () =>
            h(DropdownMenuItemsList, {
                context: props.context,
                items: props.items,
                renderItem,
            });
    },
});
