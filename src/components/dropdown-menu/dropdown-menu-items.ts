import { defineComponent, h, type PropType } from 'vue';
import type { DropdownMenuItemSlotProps, DropdownMenuRenderedItem } from './types';

export default defineComponent({
    name: 'RpDropdownMenuItems',
    props: {
        items: {
            type: Array as PropType<DropdownMenuRenderedItem[]>,
            required: true,
        },
    },
    setup(props, { slots }) {
        function renderItems(items: DropdownMenuRenderedItem[]) {
            return items.map((renderedItem) => {
                const children = [
                    h(
                        'button',
                        renderedItem.props,
                        slots.item?.(renderedItem.slotProps as DropdownMenuItemSlotProps),
                    ),
                ];

                if (renderedItem.hasSubmenu && renderedItem.submenuOpen) {
                    children.push(
                        h('div', renderedItem.submenuProps, renderItems(renderedItem.children)),
                    );
                }

                return h(
                    'div',
                    {
                        key: renderedItem.key,
                        class: 'rp-dropdown-menu__item-wrap',
                    },
                    children,
                );
            });
        }

        return () => renderItems(props.items);
    },
});
