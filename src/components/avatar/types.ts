import { componentColors, type ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const avatarParts = ['root', 'image', 'fallback'] as const;
export type AvatarPart = (typeof avatarParts)[number];

export const avatarColors = componentColors;

export const avatarSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const avatarRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

export const avatarVariants = ['solid', 'subtle', 'surface', 'outline'] as const;

export type AvatarColor = ComponentColorValue;

export type AvatarSize = (typeof avatarSizes)[number];

export type AvatarRadius = (typeof avatarRadiuses)[number];

export type AvatarVariant = (typeof avatarVariants)[number];

export interface AvatarProps extends StylesApiProps<AvatarPart> {
    src?: string | null;
    alt?: string;
    ariaLabel?: string;
    name?: string;
    variant?: AvatarVariant;
    color?: AvatarColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: AvatarSize;
    radius?: AvatarRadius;
}
