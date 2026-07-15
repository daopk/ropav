import { componentColors, type ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const alertParts = [
    'root',
    'icon',
    'title',
    'description',
    'body',
    'action',
    'close',
] as const;

export type AlertPart = (typeof alertParts)[number];

export const alertColors = componentColors;

export const alertVariants = ['subtle', 'surface', 'outline', 'solid'] as const;

export const alertRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;

export type AlertColor = ComponentColorValue;

export type AlertVariant = (typeof alertVariants)[number];

export type AlertRadius = (typeof alertRadiuses)[number];

export type AlertRole = 'alert' | 'status' | 'none';

export interface AlertProps extends StylesApiProps<AlertPart> {
    open?: boolean;
    title?: string;
    description?: string;
    variant?: AlertVariant;
    color?: AlertColor;
    autoContrast?: boolean;
    radius?: AlertRadius;
    role?: AlertRole;
    closable?: boolean;
    closeLabel?: string;
}
