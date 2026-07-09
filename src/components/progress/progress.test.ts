import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Progress from './progress.vue';
import { progressColors, progressRadiuses, progressSizes } from './types';

describe('Progress', () => {
    it('renders determinate progressbar state and ARIA values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        ariaLabel: 'Upload progress',
                        value: 35,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress') as HTMLElement;
        const track = container.querySelector('.rp-progress__track')!;

        expect(root.getAttribute('role')).toBe('progressbar');
        expect(root.getAttribute('data-state')).toBe('determinate');
        expect(root.getAttribute('aria-label')).toBe('Upload progress');
        expect(root.getAttribute('aria-valuemin')).toBe('0');
        expect(root.getAttribute('aria-valuemax')).toBe('100');
        expect(root.getAttribute('aria-valuenow')).toBe('35');
        expect(root.style.getPropertyValue('--_rp-progress-value')).toBe('35%');
        expect(root.style.getPropertyValue('--_rp-progress-ratio')).toBe('0.35');
        expect(track.getAttribute('aria-hidden')).toBe('true');
    });

    it('normalizes ranges before exposing progress values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        value: 50,
                        min: 100,
                        max: 0,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress') as HTMLElement;

        expect(root.getAttribute('aria-valuemin')).toBe('0');
        expect(root.getAttribute('aria-valuemax')).toBe('100');
        expect(root.getAttribute('aria-valuenow')).toBe('50');
        expect(root.style.getPropertyValue('--_rp-progress-value')).toBe('50%');
    });

    it('clamps the displayed value to the normalized range', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        value: 140,
                        min: 20,
                        max: 120,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress') as HTMLElement;

        expect(root.getAttribute('aria-valuenow')).toBe('120');
        expect(root.style.getPropertyValue('--_rp-progress-value')).toBe('100%');
    });

    it('renders label and value content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Progress,
                        {
                            formatValue: (value: number, percent: number) =>
                                `${value} of ${Math.round(percent)}%`,
                            showValue: true,
                            value: 64,
                        },
                        {
                            default: () => 'Syncing',
                        },
                    );
                },
            }),
        );

        await flush();

        const label = container.querySelector('.rp-progress__label')!;
        const value = container.querySelector('.rp-progress__value')!;
        const root = container.querySelector('.rp-progress')!;

        expect(label.textContent).toBe('Syncing');
        expect(value.getAttribute('aria-hidden')).toBe('true');
        expect(value.textContent).toBe('64 of 64%');
        expect(root.getAttribute('aria-valuetext')).toBe('64 of 64%');
    });

    it('passes normalized value props to the value slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Progress,
                        {
                            value: 40,
                            min: 0,
                            max: 200,
                        },
                        {
                            value: ({
                                formattedValue,
                                percent,
                                value,
                            }: {
                                formattedValue: string;
                                percent: number;
                                value: number;
                            }) =>
                                h(
                                    'span',
                                    { class: 'custom-value' },
                                    `${value}:${percent}:${formattedValue}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const value = container.querySelector('.rp-progress__value .custom-value')!;

        expect(value.textContent).toBe('40:20:20%');
    });

    it('renders indeterminate progress without numeric ARIA values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        indeterminate: true,
                        value: 50,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress')!;

        expect(root.getAttribute('data-state')).toBe('indeterminate');
        expect(root.classList.contains('rp-progress--indeterminate')).toBe(true);
        expect(root.getAttribute('aria-valuemin')).toBeNull();
        expect(root.getAttribute('aria-valuemax')).toBeNull();
        expect(root.getAttribute('aria-valuenow')).toBeNull();
    });

    it('treats a missing value as indeterminate', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress);
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress')!;

        expect(root.getAttribute('data-state')).toBe('indeterminate');
        expect(root.getAttribute('aria-valuenow')).toBeNull();
    });

    it('applies ARIA relationship props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        id: 'deploy-progress',
                        value: 24,
                        labelledby: 'deploy-label',
                        describedby: 'deploy-help deploy-status',
                        ariaValueText: '24 files uploaded',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress')!;

        expect(root.id).toBe('deploy-progress');
        expect(root.getAttribute('aria-labelledby')).toBe('deploy-label');
        expect(root.getAttribute('aria-describedby')).toBe('deploy-help deploy-status');
        expect(root.getAttribute('aria-valuetext')).toBe('24 files uploaded');
    });

    it('adds color, size, and radius modifiers when requested', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        color: 'green',
                        radius: 'md',
                        size: 'lg',
                        value: 50,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress')!;

        expect([...root.classList]).toEqual([
            'rp-progress',
            'rp-progress--size-lg',
            'rp-progress--radius-md',
        ]);
        expect((root as HTMLElement).style.getPropertyValue('--_rp-progress-color')).toBe(
            'var(--rp-color-green-filled)',
        );
    });

    it('resolves final color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        progressColors.map((color) => h(Progress, { color, value: 50 })),
                    );
                },
            }),
        );

        await flush();

        const progressBars = [...container.querySelectorAll('.rp-progress')];

        expect(progressBars).toHaveLength(progressColors.length);
        for (const [index, color] of progressColors.entries()) {
            const root = progressBars[index] as HTMLElement;

            expect([...root.classList]).toEqual(['rp-progress']);
            expect(root.style.getPropertyValue('--_rp-progress-color')).toBe(
                `var(--rp-color-${color}-filled)`,
            );
        }
    });

    it('sets final color variables for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Progress, {
                        color: '#ff3366',
                        value: 50,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-progress') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-progress']);
        expect(root.style.getPropertyValue('--_rp-progress-color')).toBe('#ff3366');
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        progressSizes.map((size) => h(Progress, { size, value: 50 })),
                    );
                },
            }),
        );

        await flush();

        const progressBars = [...container.querySelectorAll('.rp-progress')];

        expect(progressBars).toHaveLength(progressSizes.length);
        for (const [index, size] of progressSizes.entries()) {
            expect([...progressBars[index].classList]).toEqual([
                'rp-progress',
                `rp-progress--size-${size}`,
            ]);
        }
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        progressRadiuses.map((radius) => h(Progress, { radius, value: 50 })),
                    );
                },
            }),
        );

        await flush();

        const progressBars = [...container.querySelectorAll('.rp-progress')];

        expect(progressBars).toHaveLength(progressRadiuses.length);
        for (const [index, radius] of progressRadiuses.entries()) {
            expect([...progressBars[index].classList]).toEqual([
                'rp-progress',
                `rp-progress--radius-${radius}`,
            ]);
        }
    });
});
