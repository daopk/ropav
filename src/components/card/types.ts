export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export type CardRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CardLayer = 'base' | 'surface' | 'raised';

export interface CardProps {
    layer?: CardLayer;
    padding?: CardPadding;
    radius?: CardRadius;
    border?: boolean;
    title?: string;
    description?: string;
}
