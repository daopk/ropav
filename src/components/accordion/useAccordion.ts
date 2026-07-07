import { computed, provide, ref, useId } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { useCollapse } from '../collapse/useCollapse';
import { accordionKey } from './types';
import type {
    AccordionContentProps,
    AccordionContext,
    AccordionItemProps,
    AccordionItemRootProps,
    AccordionItemSlotProps,
    AccordionItemTriggerSlotProps,
    AccordionItemValue,
    AccordionModelValue,
    AccordionProps,
    AccordionRootProps,
    AccordionState,
    AccordionTriggerProps,
    UseAccordionItemReturn,
    UseAccordionReturn,
} from './types';

const TRIGGER_SELECTOR = '.rp-accordion-item__trigger';

function normalizeValue(value: AccordionModelValue | undefined, multiple: boolean) {
    if (value == null) return [];
    const values = Array.isArray(value) ? value : [value];
    return multiple ? values : values.slice(0, 1);
}

function toModelValue(values: AccordionItemValue[], multiple: boolean): AccordionModelValue {
    return multiple ? [...values] : (values[0] ?? null);
}

function hasValue(values: AccordionItemValue[], value: AccordionItemValue) {
    return values.some((itemValue) => itemValue === value);
}

function withoutValue(values: AccordionItemValue[], value: AccordionItemValue) {
    return values.filter((itemValue) => itemValue !== value);
}

export function useAccordion(
    props: Readonly<AccordionProps>,
    emitUpdate: (value: AccordionModelValue) => void,
): UseAccordionReturn {
    const isMultiple = computed(() => Boolean(props.multiple));
    const isCollapsible = computed(() => props.collapsible !== false);
    const isDisabled = computed(() => Boolean(props.disabled));
    const orientation = computed(() => props.orientation ?? 'vertical');
    const isControlled = computed(() => props.modelValue !== undefined);
    const uncontrolledValue = ref<AccordionModelValue>(props.defaultValue ?? null);

    const openValues = computed(() =>
        normalizeValue(
            isControlled.value ? props.modelValue : uncontrolledValue.value,
            isMultiple.value,
        ),
    );

    const rootClass = computed(() =>
        bem('rp-accordion', {
            disabled: isDisabled.value,
            multiple: isMultiple.value,
            [`${orientation.value}`]: true,
        }),
    );

    const rootProps = computed<AccordionRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': isDisabled.value || undefined,
        'data-orientation': orientation.value,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': props.labelledby || undefined,
        'aria-describedby': props.describedby || undefined,
    }));

    function setValues(nextValues: AccordionItemValue[]) {
        const nextModelValue = toModelValue(nextValues, isMultiple.value);

        if (!isControlled.value) uncontrolledValue.value = nextModelValue;
        emitUpdate(nextModelValue);
    }

    function setItemOpen(value: AccordionItemValue, open: boolean) {
        if (isDisabled.value) return;

        const values = openValues.value;
        const itemIsOpen = hasValue(values, value);
        if (itemIsOpen === open) return;
        if (!open && !isCollapsible.value) return;

        if (isMultiple.value) {
            setValues(open ? [...values, value] : withoutValue(values, value));
            return;
        }

        setValues(open ? [value] : []);
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
        get orientation() {
            return orientation.value;
        },
        isItemOpen(value) {
            return hasValue(openValues.value, value);
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

export function useAccordionItem(props: Readonly<AccordionItemProps>): UseAccordionItemReturn {
    const group = useRequiredInject(accordionKey, 'RpAccordionItem');
    const generatedId = useId();

    const id = computed(() => props.id ?? `${generatedId}-accordion-item`);
    const triggerId = computed(() => `${id.value}-trigger`);
    const contentId = computed(() => `${id.value}-content`);
    const isOpen = computed(() => group.isItemOpen(props.value));
    const isDisabled = computed(() => Boolean(group.disabled || props.disabled));
    const shouldUnmountOnExit = computed(() => props.unmountOnExit ?? group.unmountOnExit);
    const state = computed<AccordionState>(() => (isOpen.value ? 'open' : 'closed'));
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
        (open) => {
            setOpen(open);
        },
    );

    const rootClass = computed(() =>
        bem('rp-accordion-item', {
            open: isOpen.value,
            closed: !isOpen.value,
            disabled: isDisabled.value,
            [`${group.orientation}`]: true,
        }),
    );

    const rootProps = computed<AccordionItemRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        'data-state': state.value,
        'data-disabled': isDisabled.value || undefined,
    }));

    const triggerProps = computed<AccordionTriggerProps>(() => ({
        ...collapse.triggerProps.value,
        id: triggerId.value,
        class: 'rp-accordion-item__trigger',
        'aria-controls': contentId.value,
        'aria-expanded': isOpen.value,
        'aria-disabled': triggerAriaDisabled.value || undefined,
        disabled: isDisabled.value || undefined,
        onClick: onTriggerClick,
        onKeydown: onTriggerKeydown,
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
        open,
        close,
        toggle,
    }));

    const triggerSlotProps = computed<AccordionItemTriggerSlotProps>(() => ({
        triggerProps: triggerProps.value,
        ...contentSlotProps.value,
    }));

    function open() {
        setOpen(true);
    }

    function close() {
        setOpen(false);
    }

    function toggle() {
        setOpen(!isOpen.value);
    }

    function setOpen(open: boolean) {
        if (isDisabled.value) return;
        group.setItemOpen(props.value, open);
    }

    function onTriggerClick() {
        toggle();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        const nextTrigger = getNextTrigger(event);
        if (!nextTrigger) return;

        event.preventDefault();
        nextTrigger.focus();
    }

    function getNextTrigger(event: KeyboardEvent) {
        const currentTrigger = event.currentTarget as HTMLButtonElement | null;
        if (!currentTrigger) return undefined;

        const root = currentTrigger.closest('.rp-accordion');
        if (!root) return undefined;

        const triggers = Array.from(
            root.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR),
        ).filter((trigger) => !trigger.disabled);
        const currentIndex = triggers.indexOf(currentTrigger);
        if (currentIndex === -1 || triggers.length === 0) return undefined;

        switch (event.key) {
            case 'Home':
                return triggers[0];
            case 'End':
                return triggers[triggers.length - 1];
            case 'ArrowDown':
                if (group.orientation !== 'vertical') return undefined;
                return triggers[(currentIndex + 1) % triggers.length];
            case 'ArrowUp':
                if (group.orientation !== 'vertical') return undefined;
                return triggers[(currentIndex - 1 + triggers.length) % triggers.length];
            case 'ArrowRight':
                if (group.orientation !== 'horizontal') return undefined;
                return triggers[(currentIndex + 1) % triggers.length];
            case 'ArrowLeft':
                if (group.orientation !== 'horizontal') return undefined;
                return triggers[(currentIndex - 1 + triggers.length) % triggers.length];
            default:
                return undefined;
        }
    }

    return {
        group,
        id,
        triggerId,
        contentId,
        state,
        isOpen,
        isDisabled,
        shouldRenderContent: collapse.shouldRenderContent,
        rootClass,
        rootProps,
        triggerProps,
        contentProps,
        triggerSlotProps,
        contentSlotProps,
        open,
        close,
        toggle,
    };
}
