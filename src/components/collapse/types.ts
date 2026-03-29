import type { InjectionKey } from 'vue';
import type { Size } from '@/types/common';

export interface CollapseItemProps {
    name: string;
    title?: string;
    disabled?: boolean;
}

export interface CollapseProps {
    modelValue?: string[];
    accordion?: boolean;
    size?: Size;
}

export interface CollapseContext {
    activeNames: string[];
    size: Size;
    toggle: (name: string) => void;
}

export const collapseKey = Symbol('collapse') as InjectionKey<CollapseContext>;
