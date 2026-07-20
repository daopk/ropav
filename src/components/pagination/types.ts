import { componentColors, type ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const paginationParts = ['root', 'items', 'control', 'page', 'ellipsis'] as const;
export type PaginationPart = (typeof paginationParts)[number];

export const paginationColors = componentColors;
export const paginationSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const paginationRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

export type PaginationColor = ComponentColorValue;
export type PaginationSize = (typeof paginationSizes)[number];
export type PaginationRadius = (typeof paginationRadiuses)[number];
export type PaginationControl = 'first' | 'previous' | 'next' | 'last';
export type PaginationGetPageAriaLabel = (page: number, active: boolean) => string;

export interface PaginationPageItem {
    type: 'page';
    key: string;
    page: number;
}

export interface PaginationEllipsisItem {
    type: 'ellipsis';
    key: string;
}

export type PaginationItem = PaginationPageItem | PaginationEllipsisItem;

export interface PaginationPageSlotProps {
    page: number;
    active: boolean;
}

export interface PaginationControlSlotProps {
    page: number;
    disabled: boolean;
}

export interface PaginationProps extends StylesApiProps<PaginationPart> {
    id?: string;
    modelValue?: number;
    defaultValue?: number;
    total: number;
    siblings?: number;
    boundaries?: number;
    withControls?: boolean;
    withEdges?: boolean;
    disabled?: boolean;
    color?: PaginationColor;
    autoContrast?: boolean;
    size?: PaginationSize;
    radius?: PaginationRadius;
    ariaLabel?: string;
    labelledby?: string;
    describedby?: string;
    firstLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    lastLabel?: string;
    getPageAriaLabel?: PaginationGetPageAriaLabel;
}
