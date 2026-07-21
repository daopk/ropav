import type { HTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const scrollAreaParts = [
    'root',
    'viewport',
    'content',
    'scrollbar',
    'thumb',
    'corner',
] as const;
export type ScrollAreaPart = (typeof scrollAreaParts)[number];

export const scrollAreaTypes = ['auto', 'always', 'hover', 'scroll', 'never'] as const;
export type ScrollAreaType = (typeof scrollAreaTypes)[number];

export const scrollAreaScrollbars = ['x', 'y', 'both'] as const;
export type ScrollAreaScrollbars = (typeof scrollAreaScrollbars)[number];

export type ScrollAreaOrientation = 'horizontal' | 'vertical';

export interface ScrollAreaPosition {
    /** Logical horizontal offset: zero at inline-start and increasing toward inline-end. */
    x: number;
    /** Vertical offset from the top edge. */
    y: number;
}

export interface ScrollAreaSlotProps {
    position: ScrollAreaPosition;
    overflowX: boolean;
    overflowY: boolean;
    /** Uses the native `Element.scrollTo()` coordinate semantics. */
    scrollTo: (options: ScrollToOptions) => void;
    /** Uses the native `Element.scrollBy()` coordinate semantics. */
    scrollBy: (options: ScrollToOptions) => void;
    update: () => void;
}

export interface ScrollAreaProps extends StylesApiProps<ScrollAreaPart> {
    id?: string;
    embedded?: boolean;
    type?: ScrollAreaType;
    scrollbars?: ScrollAreaScrollbars | false;
    scrollbarSize?: number | string;
    scrollHideDelay?: number;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    viewportAttrs?: HTMLAttributes;
    contentAttrs?: HTMLAttributes;
}
