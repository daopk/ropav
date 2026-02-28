import type { InjectionKey } from 'vue';
import type { Size } from '@/types/common';

export interface TabsProps {
    modelValue?: string;
    size?: Size;
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
    size: Size;
    variant: 'line' | 'enclosed';
    select: (name: string) => void;
    register: (tab: TabRegistration) => void;
    unregister: (name: string) => void;
}

export const tabsKey = Symbol('tabs') as InjectionKey<TabsContext>;
