import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, useId, watch } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { tabsKey } from './types';
import type {
    TabsActivationMode,
    TabsContentProps,
    TabsContentRegistration,
    TabsContentRootProps,
    TabsContentSlotProps,
    TabsContext,
    TabsListProps,
    TabsListRootProps,
    TabsListSlotProps,
    TabsOrientation,
    TabsProps,
    TabsRootProps,
    TabsSlotProps,
    TabsState,
    TabsTriggerProps,
    TabsTriggerRegistration,
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
const DEFAULT_ORIENTATION: TabsOrientation = 'horizontal';
const DEFAULT_ACTIVATION_MODE: TabsActivationMode = 'automatic';

type NavigationDirection = 1 | -1;
type TabsRegistrationEntry = {
    id: string;
    value: TabsValue;
};

const ORIENTATION_NAVIGATION_KEYS: Record<
    TabsOrientation,
    Partial<Record<string, NavigationDirection>>
> = {
    horizontal: {
        ArrowRight: 1,
        ArrowLeft: -1,
    },
    vertical: {
        ArrowDown: 1,
        ArrowUp: -1,
    },
};

function getTabsTrigger(event: KeyboardEvent, list: HTMLElement) {
    const target = event.target;
    if (!(target instanceof Element)) return undefined;

    const trigger = target.closest<HTMLButtonElement>(TRIGGER_SELECTOR);
    if (!trigger || trigger.closest(TABLIST_SELECTOR) !== list) return undefined;

    return trigger;
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

function sameValue(left: TabsValue | null | undefined, right: TabsValue | null | undefined) {
    return left === right;
}

function getTabsState(active: boolean): TabsState {
    return active ? 'active' : 'inactive';
}

function toOptionalBoolean(value: boolean) {
    return value || undefined;
}

function toOptionalString(value: string | undefined) {
    return value || undefined;
}

function findRegistration<T extends TabsRegistrationEntry>(
    entries: T[],
    value: TabsValue | null | undefined,
) {
    if (value == null) return undefined;
    return entries.find((entry) => sameValue(entry.value, value));
}

function upsertRegistration<T extends { id: string }>(entries: T[], entry: T) {
    const index = entries.findIndex((current) => current.id === entry.id);
    if (index < 0) return [...entries, entry];

    const nextEntries = entries.slice();
    nextEntries[index] = entry;
    return nextEntries;
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

export function useTabs(
    props: Readonly<TabsProps>,
    emitUpdate: (value: TabsValue) => void,
): UseTabsReturn {
    const triggers = shallowRef<TabsTriggerRegistration[]>([]);
    const contents = shallowRef<TabsContentRegistration[]>([]);

    const isControlled = computed(() => props.modelValue !== undefined);
    const uncontrolledValue = ref<TabsValue | null>(props.defaultValue ?? null);
    const isDisabled = computed(() => Boolean(props.disabled));
    const orientation = computed<TabsOrientation>(() => props.orientation ?? DEFAULT_ORIENTATION);
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
        bem('rp-tabs', {
            disabled: isDisabled.value,
            [`${orientation.value}`]: true,
        }),
    );

    const rootProps = computed<TabsRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': toOptionalBoolean(isDisabled.value),
        'data-orientation': orientation.value,
        'data-activation-mode': activationMode.value,
        'aria-label': toOptionalString(props.ariaLabel),
        'aria-labelledby': toOptionalString(props.labelledby),
        'aria-describedby': toOptionalString(props.describedby),
    }));

    const slotProps = computed<TabsSlotProps>(() => ({
        value: selectedValue.value,
        disabled: isDisabled.value,
        select: selectValue,
    }));

    function ensureUncontrolledDefault() {
        if (isControlled.value || selectedValue.value != null) return;

        if (firstEnabledTrigger.value) {
            uncontrolledValue.value = firstEnabledTrigger.value.value;
        }
    }

    function setValue(value: TabsValue) {
        if (isDisabled.value || sameValue(value, selectedValue.value)) return;

        if (!isControlled.value) uncontrolledValue.value = value;
        emitUpdate(value);
    }

    function selectValue(value: TabsValue) {
        const trigger = findRegistration(triggers.value, value);
        if (isDisabled.value || trigger?.disabled) return;

        setValue(value);
    }

    function getFocusableValue() {
        return selectedEnabledTrigger.value?.value ?? firstEnabledTrigger.value?.value ?? null;
    }

    function getTriggerId(value: TabsValue) {
        return findRegistration(triggers.value, value)?.id;
    }

    function getContentId(value: TabsValue) {
        return findRegistration(contents.value, value)?.id;
    }

    function getTriggerValue(id: string) {
        return triggers.value.find((trigger) => trigger.id === id)?.value;
    }

    function registerTrigger(registration: TabsTriggerRegistration) {
        triggers.value = upsertRegistration(triggers.value, registration);
        ensureUncontrolledDefault();
    }

    function unregisterTrigger(id: string) {
        triggers.value = triggers.value.filter((trigger) => trigger.id !== id);
    }

    function registerContent(registration: TabsContentRegistration) {
        contents.value = upsertRegistration(contents.value, registration);
    }

    function unregisterContent(id: string) {
        contents.value = contents.value.filter((content) => content.id !== id);
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
        get orientation() {
            return orientation.value;
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
            return sameValue(selectedValue.value, value);
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

    return {
        rootClass,
        rootProps,
        slotProps,
        selectedValue,
        selectValue,
    };
}

export function useTabsList(props: Readonly<TabsListProps>): UseTabsListReturn {
    const group = useRequiredInject(tabsKey, 'RpTabsList');

    const rootClass = computed(() =>
        bem('rp-tabs-list', {
            disabled: group.disabled,
            [`${group.orientation}`]: true,
        }),
    );

    const rootProps = computed<TabsListRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        role: 'tablist',
        'data-disabled': toOptionalBoolean(group.disabled),
        'data-orientation': group.orientation,
        'aria-orientation': group.orientation,
        'aria-label': props.ariaLabel ?? group.ariaLabel ?? undefined,
        'aria-labelledby': props.ariaLabelledby ?? group.labelledby ?? undefined,
        'aria-describedby': props.ariaDescribedby ?? group.describedby ?? undefined,
        onKeydown: group.onListKeydown,
    }));

    const slotProps = computed<TabsListSlotProps>(() => ({
        disabled: group.disabled,
        orientation: group.orientation,
    }));

    return {
        rootClass,
        rootProps,
        slotProps,
    };
}

export function useTabsTrigger(props: Readonly<TabsTriggerProps>): UseTabsTriggerReturn {
    const group = useRequiredInject(tabsKey, 'RpTabsTrigger');
    const generatedId = useId();

    const id = computed(() => props.id ?? `${generatedId}-tab`);
    const isSelected = computed(() => group.isSelected(props.value));
    const isDisabled = computed(() => Boolean(group.disabled || props.disabled));
    const state = computed<TabsState>(() => getTabsState(isSelected.value));
    const isFocusable = computed(
        () => group.getFocusableValue() === props.value && !isDisabled.value,
    );

    const rootClass = computed(() =>
        bem('rp-tabs-trigger', {
            active: isSelected.value,
            inactive: !isSelected.value,
            disabled: isDisabled.value,
            [`${group.orientation}`]: true,
        }),
    );

    const rootProps = computed<TabsTriggerRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tab',
        type: 'button',
        disabled: toOptionalBoolean(isDisabled.value),
        tabIndex: isFocusable.value ? 0 : -1,
        'data-state': state.value,
        'data-disabled': toOptionalBoolean(isDisabled.value),
        'aria-selected': isSelected.value,
        'aria-controls': group.getContentId(props.value),
        'aria-disabled': toOptionalBoolean(isDisabled.value),
        onClick: onClick,
        onFocus: onFocus,
        onKeydown: onKeydown,
    }));

    const slotProps = computed<TabsTriggerSlotProps>(() => ({
        value: props.value,
        selected: isSelected.value,
        disabled: isDisabled.value,
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
        if (isDisabled.value) return;
        group.selectValue(props.value);
    }

    function onClick() {
        select();
    }

    function onFocus() {
        if (group.activationMode === 'automatic') select();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        select();
    }

    return {
        id,
        state,
        isSelected,
        isDisabled,
        rootClass,
        rootProps,
        slotProps,
        select,
    };
}

export function useTabsContent(props: Readonly<TabsContentProps>): UseTabsContentReturn {
    const group = useRequiredInject(tabsKey, 'RpTabsContent');
    const generatedId = useId();

    const id = computed(() => props.id ?? `${generatedId}-tabpanel`);
    const isSelected = computed(() => group.isSelected(props.value));
    const state = computed<TabsState>(() => getTabsState(isSelected.value));
    const shouldUnmountOnExit = computed(() => props.unmountOnExit ?? group.unmountOnExit);
    const shouldRenderContent = computed(() => !shouldUnmountOnExit.value || isSelected.value);

    const rootClass = computed(() =>
        bem('rp-tabs-content', {
            active: isSelected.value,
            inactive: !isSelected.value,
        }),
    );

    const rootProps = computed<TabsContentRootProps>(() => ({
        id: id.value,
        class: rootClass.value,
        role: 'tabpanel',
        tabIndex: 0,
        hidden: toOptionalBoolean(!isSelected.value),
        'data-state': state.value,
        'aria-label': toOptionalString(props.ariaLabel),
        'aria-labelledby': props.ariaLabelledby ?? group.getTriggerId(props.value),
        'aria-describedby': toOptionalString(props.ariaDescribedby),
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

    return {
        id,
        state,
        isSelected,
        shouldRenderContent,
        rootClass,
        rootProps,
        slotProps,
    };
}
