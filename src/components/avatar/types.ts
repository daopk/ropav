import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const avatarColors = componentColors;

export const avatarSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const avatarRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

export const avatarVariants = ['solid', 'subtle', 'surface', 'outline'] as const;

export type AvatarColor = ComponentColorValue;

export type AvatarSize = (typeof avatarSizes)[number];

export type AvatarRadius = (typeof avatarRadiuses)[number];

export type AvatarVariant = (typeof avatarVariants)[number];

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    ariaLabel?: string;
    name?: string;
    variant?: AvatarVariant;
    color?: AvatarColor;
    autoContrast?: boolean;
    size?: AvatarSize;
    radius?: AvatarRadius;
}
