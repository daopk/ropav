import { computed, provide, ref } from 'vue';
import { bem } from '@/utils/bem';
import { tabsKey } from './types';
import {
    ariaProps,
    DEFAULT_ACTIVATION_MODE,
    DEFAULT_ORIENTATION,
    DEFAULT_PLACEMENT,
    findRegistration,
    getNextTrigger,
    getTabsTrigger,
    orientationClasses,
    placementClasses,
    toAttr,
    useTabsRegistry,
} from './useTabsShared';
import type {
    TabsActivationMode,
    TabsContentRegistration,
    TabsContext,
    TabsOrientation,
    TabsPlacement,
    TabsProps,
    TabsRootProps,
    TabsSize,
    TabsSlotProps,
    TabsTriggerAlign,
    TabsTriggerRegistration,
    TabsValue,
    UseTabsReturn,
} from './types';

export function useTabs(
    props: Readonly<TabsProps>,
    emitUpdate: (value: TabsValue) => void,
): UseTabsReturn {
    const triggerRegistry = useTabsRegistry<TabsTriggerRegistration>();
    const contentRegistry = useTabsRegistry<TabsContentRegistration>();
    const { items: triggers, unregister: unregisterTrigger } = triggerRegistry;
    const {
        items: contents,
        register: registerContent,
        unregister: unregisterContent,
    } = contentRegistry;

    const isControlled = computed(() => props.modelValue !== undefined);
    const uncontrolledValue = ref<TabsValue | null>(props.defaultValue ?? null);
    const isDisabled = computed(() => Boolean(props.disabled));
    const size = computed<TabsSize>(() => props.size ?? 'md');
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
            orientationClasses(isDisabled.value, orientation.value),
            placementClasses(orientation.value, placement.value),
        ),
    );

    const rootProps = computed<TabsRootProps>(() => ({
        id: props.id,
        class: rootClass.value,
        'data-disabled': toAttr(isDisabled.value),
        'data-size': size.value,
        'data-orientation': orientation.value,
        'data-placement': toAttr(orientation.value === 'vertical' ? placement.value : undefined),
        'data-activation-mode': activationMode.value,
        ...ariaProps(props.ariaLabel, props.labelledby, props.describedby),
    }));

    const slotProps = computed<TabsSlotProps>(() => ({
        value: selectedValue.value,
        size: size.value,
        disabled: isDisabled.value,
        placement: placement.value,
        align: align.value ?? (orientation.value === 'vertical' ? 'left' : 'center'),
        select: selectValue,
    }));

    function ensureUncontrolledDefault() {
        if (!isControlled.value && selectedValue.value == null && firstEnabledTrigger.value) {
            uncontrolledValue.value = firstEnabledTrigger.value.value;
        }
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
        ensureUncontrolledDefault();
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
