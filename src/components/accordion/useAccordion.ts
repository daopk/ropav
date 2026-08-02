import { computed, provide } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { toOptionalAttribute } from '@/utils/attributes';
import { bem } from '@/utils/bem';
import { getFocusNavigationTarget } from '@/utils/dom/focusNavigation';
import { accordionKey } from './accordionContext';
import { readAccordionOpenValues, transitionAccordionValue } from './accordionModel';
import type {
    AccordionContext,
    AccordionItemValue,
    AccordionModelValue,
    AccordionProps,
    AccordionRootProps,
    UseAccordionReturn,
} from './types';

const ACCORDION_SELECTOR = '.rp-accordion';
const TRIGGER_SELECTOR = '.rp-accordion-item__trigger';

export function useAccordion(
    props: Readonly<AccordionProps>,
    emitUpdate: (value: AccordionModelValue) => void,
): UseAccordionReturn {
    const isMultiple = computed(() => Boolean(props.multiple));
    const isCollapsible = computed(() => props.collapsible !== false);
    const isDisabled = computed(() => Boolean(props.disabled));
    const controllable = useControllableValue<AccordionModelValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: emitUpdate,
    });

    const openValues = computed(() =>
        readAccordionOpenValues(controllable.value.value, isMultiple.value),
    );

    const rootClass = computed(() =>
        bem('rp-accordion', {
            disabled: isDisabled.value,
            multiple: isMultiple.value,
        }),
    );

    const rootProps = computed<AccordionRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': toOptionalAttribute(isDisabled.value),
        'aria-label': toOptionalAttribute(props.ariaLabel),
        'aria-labelledby': toOptionalAttribute(props.labelledby),
        'aria-describedby': toOptionalAttribute(props.describedby),
        onKeydown: onRootKeydown,
    }));

    function setItemOpen(value: AccordionItemValue, open: boolean) {
        if (isDisabled.value) return;

        const transition = transitionAccordionValue(controllable.value.value, value, open, {
            multiple: isMultiple.value,
            collapsible: isCollapsible.value,
        });
        if (!transition.changed) return;

        controllable.setValue(transition.modelValue);
    }

    function onRootKeydown(event: KeyboardEvent) {
        const root = event.currentTarget as HTMLElement | null;
        if (!root) return;

        const nextTrigger = getFocusNavigationTarget<HTMLButtonElement>(event, root, {
            itemSelector: TRIGGER_SELECTOR,
            collectionSelector: ACCORDION_SELECTOR,
            orientation: 'vertical',
        });
        if (!nextTrigger) return;

        event.preventDefault();
        nextTrigger.focus();
    }

    provide<AccordionContext>(accordionKey, {
        get multiple() {
            return isMultiple.value;
        },
        get collapsible() {
            return isCollapsible.value;
        },
        get disabled() {
            return isDisabled.value;
        },
        get unmountOnExit() {
            return Boolean(props.unmountOnExit);
        },
        isItemOpen(value) {
            return openValues.value.some((itemValue) => itemValue === value);
        },
        setItemOpen,
    });

    return {
        rootClass,
        rootProps,
        openValues,
        setItemOpen,
    };
}

export { useAccordionItem } from './useAccordionItem';
