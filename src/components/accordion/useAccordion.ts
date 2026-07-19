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

const ACCORDION_SELECTOR = '.rp-accordion';
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

type NavigationDirection = 1 | -1;

const NAVIGATION_KEYS: Partial<Record<string, NavigationDirection>> = {
    ArrowDown: 1,
    ArrowUp: -1,
};

function getAccordionTrigger(event: KeyboardEvent, root: HTMLElement) {
    const target = event.target;
    if (!(target instanceof Element)) return undefined;

    const trigger = target.closest<HTMLButtonElement>(TRIGGER_SELECTOR);
    if (!trigger || trigger.closest(ACCORDION_SELECTOR) !== root) return undefined;

    return trigger;
}

function getAccordionTriggers(root: HTMLElement) {
    return Array.from(root.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR)).filter(
        (trigger) => trigger.closest(ACCORDION_SELECTOR) === root && !trigger.disabled,
    );
}

function getNextTrigger(root: HTMLElement, currentTrigger: HTMLButtonElement, key: string) {
    const triggers = getAccordionTriggers(root);
    const currentIndex = triggers.indexOf(currentTrigger);
    if (currentIndex === -1 || triggers.length === 0) return undefined;

    if (key === 'Home') return triggers[0];
    if (key === 'End') return triggers[triggers.length - 1];

    const direction = NAVIGATION_KEYS[key];
    if (!direction) return undefined;

    return triggers[(currentIndex + direction + triggers.length) % triggers.length];
}

export function useAccordion(
    props: Readonly<AccordionProps>,
    emitUpdate: (value: AccordionModelValue) => void,
): UseAccordionReturn {
    const isMultiple = computed(() => Boolean(props.multiple));
    const isCollapsible = computed(() => props.collapsible !== false);
    const isDisabled = computed(() => Boolean(props.disabled));
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
        }),
    );

    const rootProps = computed<AccordionRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': isDisabled.value || undefined,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': props.labelledby || undefined,
        'aria-describedby': props.describedby || undefined,
        onKeydown: onRootKeydown,
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

    function onRootKeydown(event: KeyboardEvent) {
        const root = event.currentTarget as HTMLElement | null;
        if (!root) return;

        const trigger = getAccordionTrigger(event, root);
        if (!trigger) return;

        const nextTrigger = getNextTrigger(root, trigger, event.key);
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
        (nextOpen) => {
            setOpen(nextOpen);
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

    function setOpen(nextOpen: boolean) {
        if (isDisabled.value) return;
        group.setItemOpen(props.value, nextOpen);
    }

    function onTriggerClick() {
        toggle();
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
