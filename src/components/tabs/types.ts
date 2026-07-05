import type { InjectionKey } from 'vue';

export interface TabsProps {
    modelValue: string;
}

export interface TabPanelProps {
    value: string;
}

export interface TabsTriggerProps {
    value: string;
    disabled?: boolean;
}

export interface TabsContext {
    activeTab: string;
    select: (value: string) => void;
    getTriggerId: (value: string) => string;
    getPanelId: (value: string) => string;
}

export const tabsKey = Symbol('tabs') as InjectionKey<TabsContext>;
