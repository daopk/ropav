import {
    computed,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    shallowRef,
    useId,
    watch,
    type InjectionKey,
} from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import type {
    TabsActivationMode,
    TabsContentProps,
    TabsContentRootProps,
    TabsContentSlotProps,
    TabsListProps,
    TabsListRootProps,
    TabsListSlotProps,
    TabsOrientation,
    TabsPlacement,
    TabsProps,
    TabsRootProps,
    TabsSize,
    TabsSlotProps,
    TabsState,
    TabsTriggerAlign,
    TabsTriggerProps,
    TabsTriggerRootProps,
    TabsTriggerSlotProps,
    TabsValue,
    UseTabsContentReturn,
    UseTabsListReturn,
    UseTabsReturn,
    UseTabsTriggerReturn,
} from './types';

const TABLIST_SELECTOR = '.rp-tabs-list';
const TRIGGER_SELECTOR = '.rp-tabs-trigger';

const DEFAULT_SIZE: TabsSize = 'md';
const DEFAULT_ORIENTATION: TabsOrientation = 'horizontal';
const DEFAULT_PLACEMENT: TabsPlacement = 'left';
const DEFAULT_ACTIVATION_MODE: TabsActivationMode = 'automatic';

type NavigationDirection = 1 | -1;

interface TabsRegistration {
    id: string;
    value: TabsValue;
}

interface TabsTriggerRegistration extends TabsRegistration {
    disabled: boolean;
}

interface TabsContext {
    selectedValue: TabsValue | null;
    size: TabsSize;
    disabled: boolean;
    orientation: TabsOrientation;
    placement: TabsPlacement;
    align?: TabsTriggerAlign;
    activationMode: TabsActivationMode;
    unmountOnExit: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    isSelected: (value: TabsValue) => boolean;
    selectValue: (value: TabsValue) => void;
    getFocusableValue: () => TabsValue | null;
    getTriggerId: (value: TabsValue) => string | undefined;
    getContentId: (value: TabsValue) => string | undefined;
    getTriggerValue: (id: string) => TabsValue | undefined;
    registerTrigger: (registration: TabsTriggerRegistration) => void;
    unregisterTrigger: (id: string) => void;
    registerContent: (registration: TabsRegistration) => void;
    unregisterContent: (id: string) => void;
    onListKeydown: (event: KeyboardEvent) => void;
}

const tabsKey = Symbol('tabs') as InjectionKey<TabsContext>;

const ORIENTATION_NAVIGATION_KEYS: Record<
    TabsOrientation,
    Partial<Record<string, NavigationDirection>>
> = {
    horizontal: { ArrowRight: 1, ArrowLeft: -1 },
    vertical: { ArrowDown: 1, ArrowUp: -1 },
};

function optionalAttr<T extends boolean | string | undefined>(value: T): T | undefined {
    return value || undefined;
}

function toTabsState(active: boolean): TabsState {
    return active ? 'active' : 'inactive';
}

function getDefaultAlign(orientation: TabsOrientation): TabsTriggerAlign {
    return orientation === 'vertical' ? 'left' : 'center';
}

function getAriaProps(label?: string, labelledby?: string, describedby?: string) {
    return {
        'aria-label': optionalAttr(label),
        'aria-labelledby': optionalAttr(labelledby),
        'aria-describedby': optionalAttr(describedby),
    };
}

function getOrientationClasses(disabled: boolean, orientation: TabsOrientation) {
    return { disabled, [orientation]: true };
}

function getPlacementClasses(orientation: TabsOrientation, placement: TabsPlacement) {
    return { [`placement-${placement}`]: orientation === 'vertical' };
}

function getStateClasses(active: boolean) {
    return { active, inactive: !active };
}

function getTriggerClasses(
    active: boolean,
    disabled: boolean,
    orientation: TabsOrientation,
    placement: TabsPlacement,
    align: TabsTriggerAlign | undefined,
) {
    return {
        ...getStateClasses(active),
        ...getOrientationClasses(disabled, orientation),
        ...getPlacementClasses(orientation, placement),
        ...(align ? { [`align-${align}`]: true } : {}),
    };
}

function findRegistration<T extends TabsRegistration>(
    entries: T[],
    value: TabsValue | null | undefined,
) {
    if (value == null) return undefined;
    return entries.find((entry) => entry.value === value);
}

function upsertRegistration<T extends { id: string }>(entries: T[], entry: T) {
    const index = entries.findIndex((current) => current.id === entry.id);
    if (index < 0) return [...entries, entry];

    const nextEntries = entries.slice();
    nextEntries[index] = entry;
    return nextEntries;
}

function useTabsRegistry<T extends { id: string }>() {
    const items = shallowRef<T[]>([]);

    return {
        items,
        register(entry: T) {
            items.value = upsertRegistration(items.value, entry);
        },
        unregister(id: string) {
            items.value = items.value.filter((item) => item.id !== id);
        },
    };
}

function useTabsRegistration<T extends { id: string }>(
    getRegistration: () => T,
    register: (registration: T) => void,
    unregister: (id: string) => void,
    watchSource: () => readonly unknown[],
) {
    const registeredId = ref<string | null>(null);

    function syncRegistration() {
        const registration = getRegistration();
        if (registeredId.value && registeredId.value !== registration.id) {
            unregister(registeredId.value);
        }

        register(registration);
        registeredId.value = registration.id;
    }

    onMounted(syncRegistration);
    watch(watchSource, syncRegistration);

    onBeforeUnmount(() => {
        if (registeredId.value) unregister(registeredId.value);
    });
}

function getTabsTrigger(event: KeyboardEvent, list: HTMLElement) {
    const target = event.target;
    const trigger =
        target instanceof Element ? target.closest<HTMLButtonElement>(TRIGGER_SELECTOR) : undefined;

    return trigger?.closest(TABLIST_SELECTOR) === list ? trigger : undefined;
}

function getTabsTriggers(list: HTMLElement) {
    return Array.from(list.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR)).filter(
        (trigger) => trigger.closest(TABLIST_SELECTOR) === list && !trigger.disabled,
    );
}

function getNextTrigger(
    list: HTMLElement,
    currentTrigger: HTMLButtonElement,
    key: string,
    orientation: TabsOrientation,
) {
    const triggers = getTabsTriggers(list);
    const currentIndex = triggers.indexOf(currentTrigger);
    if (currentIndex === -1 || triggers.length === 0) return undefined;

    if (key === 'Home') return triggers[0];
    if (key === 'End') return triggers[triggers.length - 1];

    const direction = ORIENTATION_NAVIGATION_KEYS[orientation][key];
    if (!direction) return undefined;

    return triggers[(currentIndex + direction + triggers.length) % triggers.length];
}

function useTabsItem(
    componentName: string,
    props: Readonly<{ id?: string; value: TabsValue }>,
    suffix: string,
) {
    const group = useRequiredInject(tabsKey, componentName);
    const generatedId = useId();
    const id = computed(() => props.id ?? `${generatedId}-${suffix}`);
    const isSelected = computed(() => group.isSelected(props.value));
    const state = computed<TabsState>(() => toTabsState(isSelected.value));

    return { group, id, isSelected, state };
}

export function useTabs(
    props: Readonly<TabsProps>,
    emitUpdate: (value: TabsValue) => void,
): UseTabsReturn {
    const triggerRegistry = useTabsRegistry<TabsTriggerRegistration>();
    const contentRegistry = useTabsRegistry<TabsRegistration>();
    const { items: triggers, unregister: unregisterTrigger } = triggerRegistry;
    const {
        items: contents,
        register: registerContent,
        unregister: unregisterContent,
    } = contentRegistry;

    const isControlled = computed(() => props.modelValue !== undefined);
    const uncontrolledValue = ref<TabsValue | null>(props.defaultValue ?? null);
    const isDisabled = computed(() => Boolean(props.disabled));
    const size = computed<TabsSize>(() => props.size ?? DEFAULT_SIZE);
    const orientation = computed<TabsOrientation>(() => props.orientation ?? DEFAULT_ORIENTATION);
    const placement = computed<TabsPlacement>(() => props.placement ?? DEFAULT_PLACEMENT);
    const align = computed<TabsTriggerAlign | undefined>(() => props.align);
    const activationMode = computed<TabsActivationMode>(
        () => props.activationMode ?? DEFAULT_ACTIVATION_MODE,
    );
    const selectedValue = computed<TabsValue | null>(() =>
        isControlled.value ? (props.modelValue ?? null) : uncontrolledValue.value,
    );
    const firstEnabledTrigger = computed(() => triggers.value.find((trigger) => !trigger.disabled));
    const selectedEnabledTrigger = computed(() => {
        const trigger = findRegistration(triggers.value, selectedValue.value);
        return trigger && !trigger.disabled ? trigger : undefined;
    });

    const rootClass = computed(() =>
        bem(
            'rp-tabs',
            `size-${size.value}`,
            getOrientationClasses(isDisabled.value, orientation.value),
            getPlacementClasses(orientation.value, placement.value),
        ),
    );

    const rootProps = computed<TabsRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': optionalAttr(isDisabled.value),
        'data-size': size.value,
        'data-orientation': orientation.value,
        'data-placement': optionalAttr(
            orientation.value === 'vertical' ? placement.value : undefined,
        ),
        'data-activation-mode': activationMode.value,
        ...getAriaProps(props.ariaLabel, props.labelledby, props.describedby),
    }));

    const slotProps = computed<TabsSlotProps>(() => ({
        value: selectedValue.value,
        size: size.value,
        disabled: isDisabled.value,
        placement: placement.value,
        align: align.value ?? getDefaultAlign(orientation.value),
        select: selectValue,
    }));

    function syncUncontrolledValue() {
        if (isControlled.value || isDisabled.value) return;

        const selectedTrigger = findRegistration(triggers.value, selectedValue.value);
        if (selectedValue.value != null && !selectedTrigger?.disabled) return;

        uncontrolledValue.value = firstEnabledTrigger.value?.value ?? null;
    }

    function setValue(value: TabsValue) {
        if (isDisabled.value || value === selectedValue.value) return;

        if (!isControlled.value) uncontrolledValue.value = value;
        emitUpdate(value);
    }

    function selectValue(value: TabsValue) {
        const trigger = findRegistration(triggers.value, value);
        if (isDisabled.value || trigger?.disabled) return;

        setValue(value);
    }

    const getFocusableValue = () =>
        selectedEnabledTrigger.value?.value ?? firstEnabledTrigger.value?.value ?? null;
    const getTriggerId = (value: TabsValue) => findRegistration(triggers.value, value)?.id;
    const getContentId = (value: TabsValue) => findRegistration(contents.value, value)?.id;
    const getTriggerValue = (id: string) =>
        triggers.value.find((trigger) => trigger.id === id)?.value;

    function registerTrigger(registration: TabsTriggerRegistration) {
        triggerRegistry.register(registration);
        syncUncontrolledValue();
    }

    function onListKeydown(event: KeyboardEvent) {
        const list = event.currentTarget as HTMLElement | null;
        if (!list || isDisabled.value) return;

        const trigger = getTabsTrigger(event, list);
        if (!trigger) return;

        const nextTrigger = getNextTrigger(list, trigger, event.key, orientation.value);
        if (!nextTrigger) return;

        event.preventDefault();
        nextTrigger.focus();

        const nextValue = getTriggerValue(nextTrigger.id);
        if (nextValue !== undefined && activationMode.value === 'automatic') {
            selectValue(nextValue);
        }
    }

    provide<TabsContext>(tabsKey, {
        get selectedValue() {
            return selectedValue.value;
        },
        get disabled() {
            return isDisabled.value;
        },
        get size() {
            return size.value;
        },
        get orientation() {
            return orientation.value;
        },
        get placement() {
            return placement.value;
        },
        get align() {
            return align.value;
        },
        get activationMode() {
            return activationMode.value;
        },
        get unmountOnExit() {
            return Boolean(props.unmountOnExit);
        },
        get ariaLabel() {
            return props.ariaLabel;
        },
        get describedby() {
            return props.describedby;
        },
        get labelledby() {
            return props.labelledby;
        },
        isSelected(value) {
            return selectedValue.value === value;
        },
        selectValue,
        getFocusableValue,
        getTriggerId,
        getContentId,
        getTriggerValue,
        registerTrigger,
        unregisterTrigger,
        registerContent,
        unregisterContent,
        onListKeydown,
    });

    return { rootClass, rootProps, slotProps, selectedValue, selectValue };
}

export function useTabsList(props: Readonly<TabsListProps>): UseTabsListReturn {
    const group = useRequiredInject(tabsKey, 'RpTabsList');

    const rootClass = computed(() =>
        bem(
            'rp-tabs-list',
            getOrientationClasses(group.disabled, group.orientation),
            getPlacementClasses(group.orientation, group.placement),
        ),
    );

    const rootProps = computed<TabsListRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        role: 'tablist',
        'data-disabled': optionalAttr(group.disabled),
        'data-orientation': group.orientation,
        'data-placement': optionalAttr(
            group.orientation === 'vertical' ? group.placement : undefined,
        ),
        'aria-orientation': group.orientation,
        ...getAriaProps(
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

export function useTabsTrigger(props: Readonly<TabsTriggerProps>): UseTabsTriggerReturn {
    const { group, id, isSelected, state } = useTabsItem('RpTabsTrigger', props, 'tab');
    const isDisabled = computed(() => Boolean(group.disabled || props.disabled));
    const isFocusable = computed(
        () => group.getFocusableValue() === props.value && !isDisabled.value,
    );
    const align = computed<TabsTriggerAlign | undefined>(() => props.align ?? group.align);
    const effectiveAlign = computed(() => align.value ?? getDefaultAlign(group.orientation));

    const rootClass = computed(() =>
        bem(
            'rp-tabs-trigger',
            `size-${group.size}`,
            getTriggerClasses(
                isSelected.value,
                isDisabled.value,
                group.orientation,
                group.placement,
                align.value,
            ),
        ),
    );

    const rootProps = computed<TabsTriggerRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tab',
        type: 'button',
        disabled: optionalAttr(isDisabled.value),
        tabIndex: isFocusable.value ? 0 : -1,
        'data-state': state.value,
        'data-disabled': optionalAttr(isDisabled.value),
        'data-align': optionalAttr(align.value),
        'aria-selected': isSelected.value,
        'aria-controls': group.getContentId(props.value),
        'aria-disabled': optionalAttr(isDisabled.value),
        onClick: select,
        onFocus,
        onKeydown,
    }));

    const slotProps = computed<TabsTriggerSlotProps>(() => ({
        value: props.value,
        selected: isSelected.value,
        size: group.size,
        disabled: isDisabled.value,
        align: effectiveAlign.value,
        select,
    }));

    useTabsRegistration(
        () => ({
            id: id.value,
            value: props.value,
            disabled: isDisabled.value,
        }),
        group.registerTrigger,
        group.unregisterTrigger,
        () => [id.value, props.value, isDisabled.value] as const,
    );

    function select() {
        if (!isDisabled.value) group.selectValue(props.value);
    }

    function onFocus() {
        if (group.activationMode === 'automatic') select();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        select();
    }

    return { id, state, isSelected, isDisabled, rootClass, rootProps, slotProps, select };
}

export function useTabsContent(props: Readonly<TabsContentProps>): UseTabsContentReturn {
    const { group, id, isSelected, state } = useTabsItem('RpTabsContent', props, 'tabpanel');
    const shouldUnmountOnExit = computed(() => props.unmountOnExit ?? group.unmountOnExit);
    const shouldRenderContent = computed(() => !shouldUnmountOnExit.value || isSelected.value);

    const rootClass = computed(() =>
        bem('rp-tabs-content', getStateClasses(isSelected.value), {
            vertical: group.orientation === 'vertical',
        }),
    );

    const rootProps = computed<TabsContentRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tabpanel',
        tabIndex: 0,
        hidden: optionalAttr(!isSelected.value),
        'data-state': state.value,
        ...getAriaProps(
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
