import { clamp } from './number';

export interface Point {
    x: number;
    y: number;
}

export type Triangle = [Point, Point, Point];

type RectBounds = Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>;

export function getClientPoint(event: Pick<MouseEvent, 'clientX' | 'clientY'>): Point {
    return {
        x: event.clientX,
        y: event.clientY,
    };
}

export function hasMeasuredRect(rect: Pick<DOMRect, 'height' | 'width'>) {
    return rect.width > 0 || rect.height > 0;
}

export function isPointInRect(point: Point, rect: RectBounds, padding = 0) {
    return (
        point.x >= rect.left - padding &&
        point.x <= rect.right + padding &&
        point.y >= rect.top - padding &&
        point.y <= rect.bottom + padding
    );
}

export function getTriangleArea(a: Point, b: Point, c: Point) {
    return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

export function isPointInTriangle(point: Point, triangle: Triangle, tolerance = 0.5) {
    const [a, b, c] = triangle;
    const area = getTriangleArea(a, b, c);
    const area1 = getTriangleArea(point, b, c);
    const area2 = getTriangleArea(a, point, c);
    const area3 = getTriangleArea(a, b, point);

    return Math.abs(area - (area1 + area2 + area3)) < tolerance;
}

export function clampPointToRect(point: Point, rect: RectBounds): Point {
    return {
        x: clamp(point.x, rect.left, rect.right),
        y: clamp(point.y, rect.top, rect.bottom),
    };
}

export function createPointRect(point: Point): DOMRect {
    return {
        x: point.x,
        y: point.y,
        left: point.x,
        right: point.x,
        top: point.y,
        bottom: point.y,
        width: 0,
        height: 0,
        toJSON: () => ({}),
    } as DOMRect;
}
