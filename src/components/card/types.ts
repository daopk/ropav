export interface CardProps {
    variant?: 'elevated' | 'outline' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    header?: string;
    footer?: string;
    showHeader?: boolean;
    showFooter?: boolean;
}
