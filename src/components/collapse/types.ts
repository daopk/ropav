export type CollapseContentRole = 'region' | 'group';

export interface CollapseTriggerProps {
    type: 'button';
    disabled?: boolean;
    'aria-controls': string;
    'aria-expanded': boolean;
    'aria-disabled'?: boolean;
    onClick: (event: MouseEvent) => void;
}

export interface CollapseSlotProps {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface CollapseTriggerSlotProps extends CollapseSlotProps {
    triggerProps: CollapseTriggerProps;
}

export interface CollapseProps {
    id?: string;
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    unmountOnExit?: boolean;
    role?: CollapseContentRole;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
