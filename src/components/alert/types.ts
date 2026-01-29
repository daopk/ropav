export interface AlertProps {
    color?: 'info' | 'success' | 'warning' | 'danger';
    variant?: 'subtle' | 'solid' | 'outline';
    closable?: boolean;
    title?: string;
}
