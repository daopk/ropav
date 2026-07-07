import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { tabsKey } from './types';
import type {
    TabsActivationMode,
    TabsOrientation,
    TabsPlacement,
    TabsState,
    TabsTriggerAlign,
    TabsValue,
} from './types';

const TABLIST_SELECTOR = '.rp-tabs-list';
const TRIGGER_SELECTOR = '.rp-tabs-trigger';

export const DEFAULT_ORIENTATION: TabsOrientation = 'horizontal';
export const DEFAULT_PLACEMENT: TabsPlacement = 'left';
export const DEFAULT_ACTIVATION_MODE: TabsActivationMode = 'automatic';

type NavigationDirection = 1 | -1;
type TabsRegistrationEntry = {
    id: string;
    value: TabsValue;
};

const ORIENTATION_NAVIGATION_KEYS: Record<
    TabsOrientation,
    Partial<Record<string, NavigationDirection>>
> = {
    horizontal: { ArrowRight: 1, ArrowLeft: -1 },
    vertical: { ArrowDown: 1, ArrowUp: -1 },
};

function getTabsTriggers(list: HTMLElement) {
    return Array.from(list.querySelectorAll<HTMLButtonElement>(TRIGGER_SELECTOR)).filter(
        (trigger) => trigger.closest(TABLIST_SELECTOR) === list && !trigger.disabled,
    );
}

function toTabsState(active: boolean): TabsState {
    return active ? 'active' : 'inactive';
}

function upsertRegistration<T extends { id: string }>(entries: T[], entry: T) {
    const index = entries.findIndex((current) => current.id === entry.id);
    if (index < 0) return [...entries, entry];

    const nextEntries = entries.slice();
    nextEntries[index] = entry;
    return nextEntries;
}

export function getTabsTrigger(event: KeyboardEvent, list: HTMLElement) {
    const target = event.target;
    const trigger =
        target instanceof Element ? target.closest<HTMLButtonElement>(TRIGGER_SELECTOR) : undefined;
    return trigger?.closest(TABLIST_SELECTOR) === list ? trigger : undefined;
}

export function getNextTrigger(
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

export function stateClasses(active: boolean) {
    return { active, inactive: !active };
}

export function orientationClasses(disabled: boolean, orientation: TabsOrientation) {
    return { disabled, [orientation]: true };
}

export function placementClasses(orientation: TabsOrientation, placement: TabsPlacement) {
    return { [`placement-${placement}`]: orientation === 'vertical' };
}

export function alignClasses(align: TabsTriggerAlign | undefined) {
    return align ? { [`align-${align}`]: true } : {};
}

export function triggerClasses(
    active: boolean,
    disabled: boolean,
    orientation: TabsOrientation,
    placement: TabsPlacement,
    align: TabsTriggerAlign | undefined,
) {
    return {
        ...stateClasses(active),
        ...orientationClasses(disabled, orientation),
        ...placementClasses(orientation, placement),
        ...alignClasses(align),
    };
}

export function toAttr<T extends string | boolean | undefined>(value: T): T | undefined {
    return value || undefined;
}

export function ariaProps(label?: string, labelledby?: string, describedby?: string) {
    return {
        'aria-label': toAttr(label),
        'aria-labelledby': toAttr(labelledby),
        'aria-describedby': toAttr(describedby),
    };
}

export function findRegistration<T extends TabsRegistrationEntry>(
    entries: T[],
    value: TabsValue | null | undefined,
) {
    if (value == null) return undefined;
    return entries.find((entry) => entry.value === value);
}

export function useTabsRegistry<T extends { id: string }>() {
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

export function useTabsRegistration<T extends { id: string }>(
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

export function useTabsItem(
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
