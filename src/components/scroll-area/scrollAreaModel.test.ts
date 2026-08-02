import { describe, expect, it } from 'vitest';
import {
    createScrollAreaMetrics,
    getReachedScrollAreaBoundaries,
    getScrollAreaDragPosition,
    getScrollAreaRootStyle,
    getScrollAreaTrackPosition,
    isScrollAreaAxisEnabled,
    isScrollAreaScrollbarActive,
    isScrollAreaScrollbarVisible,
} from './scrollAreaModel';

describe('scroll area model', () => {
    it('derives enabled and active axes independently from presentation state', () => {
        expect(isScrollAreaAxisEnabled('x', 'x')).toBe(true);
        expect(isScrollAreaAxisEnabled('x', 'y')).toBe(false);
        expect(isScrollAreaAxisEnabled('both', 'y')).toBe(true);
        expect(isScrollAreaAxisEnabled(false, 'x')).toBe(false);

        expect(isScrollAreaScrollbarActive('always', true, false)).toBe(true);
        expect(isScrollAreaScrollbarActive('auto', true, false)).toBe(false);
        expect(isScrollAreaScrollbarActive('hover', true, true)).toBe(true);
        expect(isScrollAreaScrollbarActive('never', true, true)).toBe(false);
        expect(isScrollAreaScrollbarActive('always', false, true)).toBe(false);
    });

    it('keeps visibility rules independent from DOM event handling', () => {
        const base = {
            active: true,
            axis: 'x' as const,
            draggingAxis: null,
            focusWithin: false,
            hovered: false,
            scrolling: false,
        };

        expect(isScrollAreaScrollbarVisible({ ...base, type: 'always' })).toBe(true);
        expect(isScrollAreaScrollbarVisible({ ...base, type: 'auto' })).toBe(true);
        expect(isScrollAreaScrollbarVisible({ ...base, type: 'hover' })).toBe(false);
        expect(
            isScrollAreaScrollbarVisible({
                ...base,
                hovered: true,
                type: 'hover',
            }),
        ).toBe(true);
        expect(
            isScrollAreaScrollbarVisible({
                ...base,
                scrolling: true,
                type: 'scroll',
            }),
        ).toBe(true);
        expect(
            isScrollAreaScrollbarVisible({
                ...base,
                active: false,
                draggingAxis: 'x',
                type: 'scroll',
            }),
        ).toBe(false);
    });

    it('maps logical horizontal boundaries to physical edges in RTL', () => {
        const metrics = createScrollAreaMetrics();
        Object.assign(metrics, {
            clientHeight: 100,
            clientWidth: 100,
            direction: 'rtl',
            overflowX: true,
            overflowY: true,
            scrollHeight: 300,
            scrollWidth: 300,
        });

        expect(getReachedScrollAreaBoundaries({ x: 0, y: 0 }, { x: 50, y: 50 }, metrics)).toEqual([
            'top',
            'right',
        ]);
        expect(
            getReachedScrollAreaBoundaries({ x: 200, y: 200 }, { x: 50, y: 50 }, metrics),
        ).toEqual(['bottom', 'left']);
    });

    it('mirrors track clicks and pointer drags for horizontal RTL scrolling', () => {
        const trackOptions = {
            axis: 'x' as const,
            coordinate: 10,
            maxPosition: 200,
            thumbSize: 20,
            trackSize: 100,
            trackStart: 0,
        };

        expect(
            getScrollAreaTrackPosition({
                ...trackOptions,
                direction: 'ltr',
            }),
        ).toBe(0);
        expect(
            getScrollAreaTrackPosition({
                ...trackOptions,
                direction: 'rtl',
            }),
        ).toBe(200);
        expect(
            getScrollAreaDragPosition({
                coordinate: 70,
                coordinateDirection: 1,
                maxPosition: 200,
                startCoordinate: 50,
                startPosition: 80,
                travel: 100,
            }),
        ).toBe(120);
        expect(
            getScrollAreaDragPosition({
                coordinate: 70,
                coordinateDirection: -1,
                maxPosition: 200,
                startCoordinate: 50,
                startPosition: 80,
                travel: 100,
            }),
        ).toBe(40);
    });

    it('serializes scrollbar size through the shared CSS length policy', () => {
        expect(getScrollAreaRootStyle(10)).toEqual({
            '--_rp-scroll-area-scrollbar-size': '10px',
        });
        expect(getScrollAreaRootStyle(' 1rem ')).toEqual({
            '--_rp-scroll-area-scrollbar-size': '1rem',
        });
        expect(getScrollAreaRootStyle(0)).toEqual({});
        expect(getScrollAreaRootStyle(Number.NaN)).toEqual({});
    });
});
