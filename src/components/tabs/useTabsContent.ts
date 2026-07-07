import { computed } from 'vue';
import { bem } from '@/utils/bem';
import { ariaProps, stateClasses, toAttr, useTabsItem, useTabsRegistration } from './useTabsShared';
import type {
    TabsContentProps,
    TabsContentRootProps,
    TabsContentSlotProps,
    UseTabsContentReturn,
} from './types';

export function useTabsContent(props: Readonly<TabsContentProps>): UseTabsContentReturn {
    const { group, id, isSelected, state } = useTabsItem('RpTabsContent', props, 'tabpanel');
    const shouldUnmountOnExit = computed(() => props.unmountOnExit ?? group.unmountOnExit);
    const shouldRenderContent = computed(() => !shouldUnmountOnExit.value || isSelected.value);

    const rootClass = computed(() => bem('rp-tabs-content', stateClasses(isSelected.value)));

    const rootProps = computed<TabsContentRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tabpanel',
        tabIndex: 0,
        hidden: toAttr(!isSelected.value),
        'data-state': state.value,
        ...ariaProps(
            props.ariaLabel,
            props.ariaLabelledby ?? group.getTriggerId(props.value),
            props.ariaDescribedby,
        ),
    }));

    const slotProps = computed<TabsContentSlotProps>(() => ({
        value: props.value,
        selected: isSelected.value,
    }));

    useTabsRegistration(
        () => ({
            id: id.value,
            value: props.value,
        }),
        group.registerContent,
        group.unregisterContent,
        () => [id.value, props.value] as const,
    );

    return { id, state, isSelected, shouldRenderContent, rootClass, rootProps, slotProps };
}
