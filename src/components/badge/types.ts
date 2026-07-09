import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const badgeColors = componentColors;

export const badgeSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const badgeRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

export const badgeVariants = ['solid', 'subtle', 'surface', 'outline'] as const;

export type BadgeColor = ComponentColorValue;

export type BadgeSize = (typeof badgeSizes)[number];

export type BadgeRadius = (typeof badgeRadiuses)[number];

export type BadgeVariant = (typeof badgeVariants)[number];

export interface BadgeProps {
    variant?: BadgeVariant;
    color?: BadgeColor;
    autoContrast?: boolean;
    size?: BadgeSize;
    radius?: BadgeRadius;
    ariaLabel?: string;
}
