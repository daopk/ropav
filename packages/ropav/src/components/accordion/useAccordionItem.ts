import { computed, useId } from 'vue';
import { useRequiredInject } from '@/internal/composables/useRequiredInject';
import { toOptionalAttribute } from '@/utils/attributes';
import { bem } from '@/utils/bem';
import { useCollapse } from '../collapse/useCollapse';
import { accordionKey } from './accordionContext';
import type {
    AccordionContentProps,
    AccordionItemProps,
    AccordionItemRootProps,
    AccordionItemSlotProps,
    AccordionItemTriggerSlotProps,
    AccordionTriggerProps,
    UseAccordionItemReturn,
} from './types';

export function useAccordionItem(props: Readonly<AccordionItemProps>): UseAccordionItemReturn {
    const group = useRequiredInject(accordionKey, 'RpAccordionItem');
    const generatedId = useId();

    const id = computed(() => props.id ?? `${generatedId}-accordion-item`);
    const triggerId = computed(() => `${id.value}-trigger`);
    const contentId = computed(() => `${id.value}-content`);
    const isOpen = computed(() => group.isItemOpen(props.value));
    const isDisabled = computed(() => Boolean(group.disabled || props.disabled));
    const shouldUnmountOnExit = computed(() => props.unmountOnExit ?? group.unmountOnExit);
    const triggerAriaDisabled = computed(
        () => isDisabled.value || (!group.collapsible && isOpen.value),
    );

    const collapse = useCollapse(
        {
            id: contentId,
            open: isOpen,
            disabled: isDisabled,
            unmountOnExit: shouldUnmountOnExit,
            role: () => props.role ?? 'region',
            ariaLabel: () => props.ariaLabel,
            ariaDescribedby: () => props.ariaDescribedby,
            ariaLabelledby: () => props.ariaLabelledby ?? triggerId.value,
        },
        (nextOpen) => {
            group.setItemOpen(props.value, nextOpen);
        },
    );

    const rootClass = computed(() =>
        bem('rp-accordion-item', {
            open: isOpen.value,
            closed: !isOpen.value,
            disabled: isDisabled.value,
        }),
    );

    const rootProps = computed<AccordionItemRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        'data-state': collapse.state.value,
        'data-disabled': toOptionalAttribute(isDisabled.value),
    }));

    const triggerProps = computed<AccordionTriggerProps>(() => ({
        ...collapse.triggerProps.value,
        id: triggerId.value,
        class: 'rp-accordion-item__trigger',
        'aria-controls': contentId.value,
        'aria-expanded': isOpen.value,
        'aria-disabled': toOptionalAttribute(triggerAriaDisabled.value),
        disabled: toOptionalAttribute(isDisabled.value),
    }));

    const contentProps = computed<AccordionContentProps>(() => ({
        ...collapse.contentProps.value,
        class: 'rp-accordion-item__content',
        id: contentId.value,
        'aria-labelledby': props.ariaLabelledby ?? triggerId.value,
    }));

    const contentSlotProps = computed<AccordionItemSlotProps>(() => ({
        value: props.value,
        isOpen: isOpen.value,
        disabled: isDisabled.value,
        open: collapse.open,
        close: collapse.close,
        toggle: collapse.toggle,
    }));

    const triggerSlotProps = computed<AccordionItemTriggerSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    return {
        group,
        id,
        triggerId,
        contentId,
        state: collapse.state,
        isOpen,
        isDisabled,
        shouldRenderContent: collapse.shouldRenderContent,
        rootClass,
        rootProps,
        triggerProps,
        contentProps,
        triggerSlotProps,
        contentSlotProps,
        open: collapse.open,
        close: collapse.close,
        toggle: collapse.toggle,
    };
}
