import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import IconSparkles from '~icons/lucide/sparkles';

import { click, flush, mountDom } from '../../../tests/utils/vue';
import Alert from './alert.vue';
import { alertColors, alertRadiuses, alertVariants } from './types';

describe('Alert', () => {
    it('renders title, description, body, and default alert semantics', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Alert,
                        {
                            title: 'Deployment queued',
                            description: 'The production rollout will start soon.',
                        },
                        {
                            default: () => h('span', { class: 'body-content' }, 'Review logs'),
                        },
                    );
                },
            }),
        );

        await flush();

        const alert = container.querySelector('.rp-alert') as HTMLElement;

        expect([...alert.classList]).toEqual(['rp-alert']);
        expect(alert.getAttribute('role')).toBe('alert');
        expect(container.querySelector('.rp-alert__icon svg')).toBeTruthy();
        expect(container.querySelector('.rp-alert__title')?.textContent?.trim()).toBe(
            'Deployment queued',
        );
        expect(container.querySelector('.rp-alert__description')?.textContent).toBe(
            'The production rollout will start soon.',
        );
        expect(container.querySelector('.rp-alert__body .body-content')?.textContent).toBe(
            'Review logs',
        );
    });

    it('renders custom title, icon, and action slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Alert, null, {
                        icon: () => h(IconSparkles, { class: 'custom-icon' }),
                        title: () => h('span', { class: 'custom-title' }, 'Custom title'),
                        default: () => 'Custom body',
                        action: () => h('button', { class: 'custom-action' }, 'Open'),
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-alert__icon .custom-icon')).toBeTruthy();
        expect(container.querySelector('.rp-alert__title .custom-title')?.textContent).toBe(
            'Custom title',
        );
        expect(container.querySelector('.rp-alert__body')?.textContent).toBe('Custom body');
        expect(container.querySelector('.rp-alert__action .custom-action')?.textContent).toBe(
            'Open',
        );
    });

    it('adds modifiers for each supported variant', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        alertVariants.map((variant) =>
                            h(Alert, { variant }, { default: () => variant }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const alerts = [...container.querySelectorAll('.rp-alert')];

        expect(alerts).toHaveLength(alertVariants.length);
        for (const [index, variant] of alertVariants.entries()) {
            expect([...alerts[index].classList]).toEqual(['rp-alert', `rp-alert--${variant}`]);
        }
    });

    it('adds color modifiers for preset colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        alertColors.map((color) => h(Alert, { color }, { default: () => color })),
                    );
                },
            }),
        );

        await flush();

        const alerts = [...container.querySelectorAll('.rp-alert')];

        expect(alerts).toHaveLength(alertColors.length);
        for (const [index, color] of alertColors.entries()) {
            const alert = alerts[index] as HTMLElement;

            expect([...alert.classList]).toEqual(['rp-alert', `rp-alert--color-${color}`]);
            expect(alert.style.getPropertyValue('--_rp-alert-custom-color')).toBe('');
        }
    });

    it('adds radius modifiers', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        alertRadiuses.map((radius) =>
                            h(Alert, { radius }, { default: () => radius }),
                        ),
                    );
                },
            }),
        );

        await flush();

        const alerts = [...container.querySelectorAll('.rp-alert')];

        expect(alerts).toHaveLength(alertRadiuses.length);
        for (const [index, radius] of alertRadiuses.entries()) {
            expect([...alerts[index].classList]).toEqual([
                'rp-alert',
                `rp-alert--radius-${radius}`,
            ]);
        }
    });

    it('uses CSS variables for custom colors', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Alert, { color: '#ff3366' }, { default: () => 'Custom' });
                },
            }),
        );

        await flush();

        const alert = container.querySelector('.rp-alert') as HTMLElement;

        expect([...alert.classList]).toEqual(['rp-alert']);
        expect(alert.style.getPropertyValue('--_rp-alert-custom-color')).toBe('#ff3366');
        expect(alert.style.getPropertyValue('--_rp-alert-custom-fg')).toBe('#ff3366');
        expect(alert.style.getPropertyValue('--_rp-alert-custom-on')).toBe(
            'var(--rp-color-on-primary)',
        );
    });

    it('can hide the icon and remove the role', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Alert,
                        {
                            role: 'none',
                            showIcon: false,
                        },
                        {
                            default: () => 'Plain alert',
                        },
                    );
                },
            }),
        );

        await flush();

        const alert = container.querySelector('.rp-alert') as HTMLElement;

        expect(alert.getAttribute('role')).toBeNull();
        expect(container.querySelector('.rp-alert__icon')).toBeNull();
    });

    it('dismisses uncontrolled alerts and emits close events', async () => {
        let emittedOpen: boolean | undefined;
        let closeCount = 0;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Alert,
                        {
                            closable: true,
                            closeLabel: 'Dismiss',
                            'onUpdate:open': (open: boolean) => {
                                emittedOpen = open;
                            },
                            onClose: () => {
                                closeCount += 1;
                            },
                        },
                        {
                            default: () => 'Dismiss me',
                        },
                    );
                },
            }),
        );

        await flush();

        const closeButton = container.querySelector('.rp-alert__close') as HTMLButtonElement;

        expect(closeButton.getAttribute('aria-label')).toBe('Dismiss');

        click(closeButton);
        await flush();

        expect(container.querySelector('.rp-alert')).toBeNull();
        expect(emittedOpen).toBe(false);
        expect(closeCount).toBe(1);
    });

    it('respects controlled open state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Alert,
                        {
                            open: false,
                        },
                        {
                            default: () => 'Hidden',
                        },
                    );
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-alert')).toBeNull();
    });
});
