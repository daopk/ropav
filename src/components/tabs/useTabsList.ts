import { computed } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { tabsKey } from './types';
import { ariaProps, orientationClasses, placementClasses, toAttr } from './useTabsShared';
import type {
    TabsListProps,
    TabsListRootProps,
    TabsListSlotProps,
    UseTabsListReturn,
} from './types';

export function useTabsList(props: Readonly<TabsListProps>): UseTabsListReturn {
    const group = useRequiredInject(tabsKey, 'RpTabsList');

    const rootClass = computed(() =>
        bem(
            'rp-tabs-list',
            orientationClasses(group.disabled, group.orientation),
            placementClasses(group.orientation, group.placement),
        ),
    );

    const rootProps = computed<TabsListRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        role: 'tablist',
        'data-disabled': toAttr(group.disabled),
        'data-orientation': group.orientation,
        'data-placement': toAttr(group.orientation === 'vertical' ? group.placement : undefined),
        'aria-orientation': group.orientation,
        ...ariaProps(
            props.ariaLabel ?? group.ariaLabel,
            props.ariaLabelledby ?? group.labelledby,
            props.ariaDescribedby ?? group.describedby,
        ),
        onKeydown: group.onListKeydown,
    }));

    const slotProps = computed<TabsListSlotProps>(() => ({
        disabled: group.disabled,
        orientation: group.orientation,
        placement: group.placement,
    }));

    return { rootClass, rootProps, slotProps };
}
