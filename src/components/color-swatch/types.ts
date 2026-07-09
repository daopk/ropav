export type ColorSwatchSize = string | number;

export interface ColorSwatchProps {
    color: string;
    size?: ColorSwatchSize;
    ariaLabel?: string;
}
