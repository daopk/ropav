export interface BadgeProps {
    content?: string | number;
    max?: number;
    dot?: boolean;
    bordered?: boolean;
    placement?: 'corner' | 'edge';
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    show?: boolean;
}
