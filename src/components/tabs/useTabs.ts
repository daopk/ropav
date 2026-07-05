import { computed, provide, ref } from 'vue';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { tabsKey } from './types';
import type { TabPanelProps, TabsContext, TabsProps, TabsTriggerProps } from './types';

function safeTabId(value: string) {
    return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function useTabs(
    props: Readonly<TabsProps>,
    tabsId: string,
    emitUpdate: (value: string) => void,
) {
    function select(value: string) {
        emitUpdate(value);
    }

    function getTriggerId(value: string) {
        return `${tabsId}-trigger-${safeTabId(value)}`;
    }

    function getPanelId(value: string) {
        return `${tabsId}-panel-${safeTabId(value)}`;
    }

    const rootClass = computed(() => bem('rp-tabs'));

    provide<TabsContext>(tabsKey, {
        get activeTab() {
            return props.modelValue;
        },
        select,
        getTriggerId,
        getPanelId,
    });

    return { rootClass };
}

function getEnabledTabs(list: HTMLElement | null) {
    if (!list) return [];
    return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
        (tab) => !tab.disabled && tab.getAttribute('aria-disabled') !== 'true',
    );
}

export function useTabsList() {
    const tabs = useRequiredInject(tabsKey, 'RpTabsList');
    const listRef = ref<HTMLElement | null>(null);

    const rootClass = computed(() => bem('rp-tabs__list'));

    function focusTab(index: number) {
        const items = getEnabledTabs(listRef.value);
        if (items.length === 0) return;

        const next = (index + items.length) % items.length;
        const item = items[next]!;
        item.focus();

        const value = item.dataset.value;
        if (value) tabs.select(value);
    }

    function onKeydown(e: KeyboardEvent) {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(e.key)) return;

        const items = getEnabledTabs(listRef.value);
        if (items.length === 0) return;

        e.preventDefault();
        const current = items.indexOf(document.activeElement as HTMLButtonElement);

        if (e.key === 'Home') {
            focusTab(0);
        } else if (e.key === 'End') {
            focusTab(items.length - 1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            focusTab(current + 1);
        } else {
            focusTab(current - 1);
        }
    }

    return {
        listRef,
        rootClass,
        onKeydown,
    };
}

export function useTabsTrigger(props: Readonly<TabsTriggerProps>) {
    const tabs = useRequiredInject(tabsKey, 'RpTabsTrigger');
    const isActive = computed(() => tabs.activeTab === props.value);

    const rootClass = computed(() =>
        bem('rp-tabs__trigger', {
            active: isActive.value,
            disabled: props.disabled,
        }),
    );

    function select() {
        if (!props.disabled) tabs.select(props.value);
    }

    return {
        tabs,
        isActive,
        rootClass,
        select,
    };
}

export function useTabPanel(props: Readonly<TabPanelProps>) {
    const tabs = useRequiredInject(tabsKey, 'RpTabPanel');
    const isActive = computed(() => tabs.activeTab === props.value);

    return {
        tabs,
        isActive,
    };
}
