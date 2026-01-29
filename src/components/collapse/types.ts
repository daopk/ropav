import type { InjectionKey } from 'vue';

export interface CollapseItemProps {
    name: string;
    title?: string;
    disabled?: boolean;
}

export interface CollapseProps {
    modelValue?: string[];
    accordion?: boolean;
}

export interface CollapseContext {
    activeNames: string[];
    toggle: (name: string) => void;
}

export const collapseKey: InjectionKey<CollapseContext> = Symbol('collapse');
