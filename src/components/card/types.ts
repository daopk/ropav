import type { HTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const cardParts = ['root', 'header', 'title', 'description', 'body', 'footer'] as const;
export type CardPart = (typeof cardParts)[number];

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export type CardRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CardLayer = 'base' | 'surface' | 'raised';

export interface CardProps extends StylesApiProps<CardPart> {
    layer?: CardLayer;
    padding?: CardPadding;
    radius?: CardRadius;
    border?: boolean;
    headerBorder?: boolean;
    footerBorder?: boolean;
    title?: string;
    description?: string;
    /** @deprecated Use `classNames.body` instead. */
    bodyClass?: HTMLAttributes['class'];
}
