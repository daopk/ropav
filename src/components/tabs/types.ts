import type { InjectionKey } from 'vue';

export interface TabsProps {
    modelValue?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'line' | 'enclosed';
}

export interface TabPanelProps {
    name: string;
    label?: string;
    disabled?: boolean;
}

export interface TabRegistration {
    name: string;
    label: string;
    disabled: boolean;
}

export interface TabsContext {
    activeTab: string;
    size: 'sm' | 'md' | 'lg';
    variant: 'line' | 'enclosed';
    select: (name: string) => void;
    register: (tab: TabRegistration) => void;
    unregister: (name: string) => void;
}

export const tabsKey: InjectionKey<TabsContext> = Symbol('tabs');
