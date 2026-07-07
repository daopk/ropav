import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, keydown, mountDom } from '../../../tests/utils/vue';
import Tabs from './tabs.vue';
import TabsContent from './tabs-content.vue';
import TabsList from './tabs-list.vue';
import TabsTrigger from './tabs-trigger.vue';
import type { TabsPlacement, TabsTriggerAlign, TabsValue, TabsVariant } from './types';

function renderVerticalTabsPlacement(placement: TabsPlacement) {
    return h(
        Tabs,
        {
            defaultValue: 'overview',
            orientation: 'vertical',
            placement,
            ariaLabel: `${placement} sections`,
        },
        {
            default: () => [
                h(TabsList, null, () => [
                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                ]),
                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
            ],
        },
    );
}

describe('Tabs', () => {
    it('requires a Tabs provider for child components', () => {
        expect(() => {
            mountDom(
                defineComponent({
                    render() {
                        return h(TabsTrigger, { value: 'standalone' }, () => 'Standalone');
                    },
                }),
            );
        }).toThrow('[Ropav] <RpTabsTrigger> must be used inside its parent provider component.');

        expect(() => {
            mountDom(
                defineComponent({
                    render() {
                        return h(TabsContent, { value: 'standalone' }, () => 'Standalone panel');
                    },
                }),
            );
        }).toThrow('[Ropav] <RpTabsContent> must be used inside its parent provider component.');
    });

    it('renders uncontrolled tabs and switches selected panels', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            defaultValue: 'overview',
                            ariaLabel: 'Project sections',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(
                                        TabsTrigger,
                                        { id: 'overview-tab', value: 'overview' },
                                        () => 'Overview',
                                    ),
                                    h(
                                        TabsTrigger,
                                        { id: 'activity-tab', value: 'activity' },
                                        () => 'Activity',
                                    ),
                                ]),
                                h(
                                    TabsContent,
                                    { id: 'overview-panel', value: 'overview' },
                                    () => 'Overview panel',
                                ),
                                h(
                                    TabsContent,
                                    { id: 'activity-panel', value: 'activity' },
                                    () => 'Activity panel',
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-tabs') as HTMLElement;
        const list = container.querySelector('.rp-tabs-list') as HTMLElement;
        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );
        const overviewPanel = container.querySelector('#overview-panel') as HTMLElement;
        const activityPanel = container.querySelector('#activity-panel') as HTMLElement;

        expect([...root.classList]).toEqual([
            'rp-tabs',
            'rp-tabs--size-md',
            'rp-tabs--line',
            'rp-tabs--horizontal',
        ]);
        expect(root.getAttribute('data-size')).toBe('md');
        expect(root.getAttribute('data-variant')).toBe('line');
        expect(root.getAttribute('data-orientation')).toBe('horizontal');
        expect(root.getAttribute('aria-label')).toBe('Project sections');
        expect(list.getAttribute('role')).toBe('tablist');
        expect(list.getAttribute('data-variant')).toBe('line');
        expect(list.getAttribute('aria-orientation')).toBe('horizontal');
        expect(triggers[0].getAttribute('role')).toBe('tab');
        expect(triggers[0].getAttribute('data-variant')).toBe('line');
        expect(triggers[0].getAttribute('aria-selected')).toBe('true');
        expect(triggers[0].getAttribute('aria-controls')).toBe('overview-panel');
        expect(triggers[0].tabIndex).toBe(0);
        expect(triggers[1].getAttribute('aria-selected')).toBe('false');
        expect(triggers[1].tabIndex).toBe(-1);
        expect(overviewPanel.getAttribute('role')).toBe('tabpanel');
        expect(overviewPanel.getAttribute('aria-labelledby')).toBe('overview-tab');
        expect(overviewPanel.hidden).toBe(false);
        expect(activityPanel.hidden).toBe(true);

        click(triggers[1]);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith('activity');
        expect(triggers[0].getAttribute('aria-selected')).toBe('false');
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');
        expect(overviewPanel.hidden).toBe(true);
        expect(activityPanel.hidden).toBe(false);
    });

    it('supports controlled model values', async () => {
        const onUpdate = vi.fn();
        const state = reactive<{ value: TabsValue | null }>({ value: 'overview' });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            modelValue: state.value,
                            'onUpdate:modelValue': (value: TabsValue) => {
                                onUpdate(value);
                                state.value = value;
                            },
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(TabsTrigger, { value: 'settings' }, () => 'Settings'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'settings' }, () => 'Settings panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        click(triggers[1]);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith('settings');
        expect(triggers[0].getAttribute('aria-selected')).toBe('false');
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');
    });

    it('uses medium size by default and applies size to every trigger in the group', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', null, [
                        h(
                            Tabs,
                            { defaultValue: 'overview' },
                            {
                                default: () => [
                                    h(TabsList, null, () => [
                                        h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                        h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                    ]),
                                    h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                    h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                                ],
                            },
                        ),
                        h(
                            Tabs,
                            { defaultValue: 'overview', size: 'lg' },
                            {
                                default: () => [
                                    h(TabsList, null, () => [
                                        h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                        h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                    ]),
                                    h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                    h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                                ],
                            },
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        expect(triggers[0].classList.contains('rp-tabs-trigger--size-md')).toBe(true);
        expect(triggers[1].classList.contains('rp-tabs-trigger--size-md')).toBe(true);
        expect(triggers[2].classList.contains('rp-tabs-trigger--size-lg')).toBe(true);
        expect(triggers[3].classList.contains('rp-tabs-trigger--size-lg')).toBe(true);
    });

    it('applies tab variants across the root, list, and triggers', async () => {
        const variants: TabsVariant[] = ['line', 'pills', 'outline'];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        null,
                        variants.map((variant) =>
                            h(
                                Tabs,
                                { defaultValue: 'overview', variant },
                                {
                                    default: () => [
                                        h(TabsList, null, () => [
                                            h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                            h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                        ]),
                                        h(
                                            TabsContent,
                                            { value: 'overview' },
                                            () => 'Overview panel',
                                        ),
                                        h(
                                            TabsContent,
                                            { value: 'activity' },
                                            () => 'Activity panel',
                                        ),
                                    ],
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        await flush();

        const roots = Array.from(container.querySelectorAll<HTMLElement>('.rp-tabs'));
        const lists = Array.from(container.querySelectorAll<HTMLElement>('.rp-tabs-list'));
        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        variants.forEach((variant, index) => {
            expect(roots[index].classList.contains(`rp-tabs--${variant}`)).toBe(true);
            expect(roots[index].getAttribute('data-variant')).toBe(variant);
            expect(lists[index].classList.contains(`rp-tabs-list--${variant}`)).toBe(true);
            expect(lists[index].getAttribute('data-variant')).toBe(variant);

            const firstTrigger = triggers[index * 2];
            const secondTrigger = triggers[index * 2 + 1];
            expect(firstTrigger.classList.contains(`rp-tabs-trigger--${variant}`)).toBe(true);
            expect(firstTrigger.getAttribute('data-variant')).toBe(variant);
            expect(secondTrigger.classList.contains(`rp-tabs-trigger--${variant}`)).toBe(true);
            expect(secondTrigger.getAttribute('data-variant')).toBe(variant);
        });
    });

    it('supports left and right placements for vertical tabs', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', null, [
                        renderVerticalTabsPlacement('left'),
                        renderVerticalTabsPlacement('right'),
                    ]);
                },
            }),
        );

        await flush();

        const roots = Array.from(container.querySelectorAll<HTMLElement>('.rp-tabs'));
        const lists = Array.from(container.querySelectorAll<HTMLElement>('.rp-tabs-list'));
        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );
        const contents = Array.from(container.querySelectorAll<HTMLElement>('.rp-tabs-content'));

        expect([...roots[0].classList]).toEqual([
            'rp-tabs',
            'rp-tabs--size-md',
            'rp-tabs--line',
            'rp-tabs--vertical',
            'rp-tabs--placement-left',
        ]);
        expect([...roots[1].classList]).toEqual([
            'rp-tabs',
            'rp-tabs--size-md',
            'rp-tabs--line',
            'rp-tabs--vertical',
            'rp-tabs--placement-right',
        ]);
        expect(roots[0].getAttribute('data-placement')).toBe('left');
        expect(roots[1].getAttribute('data-placement')).toBe('right');
        expect(lists[0].classList.contains('rp-tabs-list--placement-left')).toBe(true);
        expect(lists[1].classList.contains('rp-tabs-list--placement-right')).toBe(true);
        expect(lists[0].getAttribute('data-placement')).toBe('left');
        expect(lists[1].getAttribute('data-placement')).toBe('right');
        expect(triggers[0].classList.contains('rp-tabs-trigger--placement-left')).toBe(true);
        expect(triggers[2].classList.contains('rp-tabs-trigger--placement-right')).toBe(true);
        expect(contents[0].classList.contains('rp-tabs-content--vertical')).toBe(true);
        expect(contents[2].classList.contains('rp-tabs-content--vertical')).toBe(true);
    });

    it('aligns trigger content at the group and trigger level', async () => {
        const align: TabsTriggerAlign = 'right';
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        { align, defaultValue: 'overview', orientation: 'vertical' },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(
                                        TabsTrigger,
                                        { align: 'center', value: 'activity' },
                                        () => 'Activity',
                                    ),
                                    h(
                                        TabsTrigger,
                                        { align: 'left', value: 'settings' },
                                        () => 'Settings',
                                    ),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                                h(TabsContent, { value: 'settings' }, () => 'Settings panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        expect(triggers[0].classList.contains('rp-tabs-trigger--align-right')).toBe(true);
        expect(triggers[0].getAttribute('data-align')).toBe('right');
        expect(triggers[1].classList.contains('rp-tabs-trigger--align-center')).toBe(true);
        expect(triggers[1].getAttribute('data-align')).toBe('center');
        expect(triggers[2].classList.contains('rp-tabs-trigger--align-left')).toBe(true);
        expect(triggers[2].getAttribute('data-align')).toBe('left');
    });

    it('selects the first enabled tab by default when uncontrolled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Tabs, null, {
                        default: () => [
                            h(TabsList, null, () => [
                                h(
                                    TabsTrigger,
                                    { value: 'overview', disabled: true },
                                    () => 'Overview',
                                ),
                                h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                            ]),
                            h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                            h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                        ],
                    });
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        expect(triggers[0].getAttribute('aria-selected')).toBe('false');
        expect(triggers[0].tabIndex).toBe(-1);
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');
        expect(triggers[1].tabIndex).toBe(0);
    });

    it('falls back to the first enabled tab when defaultValue is disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        { defaultValue: 'overview' },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(
                                        TabsTrigger,
                                        { value: 'overview', disabled: true },
                                        () => 'Overview',
                                    ),
                                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        expect(triggers[0].getAttribute('aria-selected')).toBe('false');
        expect(triggers[0].tabIndex).toBe(-1);
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');
        expect(triggers[1].tabIndex).toBe(0);
    });

    it('supports automatic keyboard activation', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            defaultValue: 'overview',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                    h(TabsTrigger, { value: 'settings' }, () => 'Settings'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                                h(TabsContent, { value: 'settings' }, () => 'Settings panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        triggers[0].focus();
        keydown(triggers[0], 'ArrowRight');
        await flush();

        expect(document.activeElement).toBe(triggers[1]);
        expect(onUpdate).toHaveBeenLastCalledWith('activity');
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');

        keydown(triggers[1], 'End');
        await flush();

        expect(document.activeElement).toBe(triggers[2]);
        expect(onUpdate).toHaveBeenLastCalledWith('settings');
        expect(triggers[2].getAttribute('aria-selected')).toBe('true');
    });

    it('supports manual keyboard activation', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            defaultValue: 'overview',
                            activationMode: 'manual',
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        triggers[0].focus();
        keydown(triggers[0], 'ArrowRight');
        await flush();

        expect(document.activeElement).toBe(triggers[1]);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(triggers[0].getAttribute('aria-selected')).toBe('true');

        keydown(triggers[1], 'Enter');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith('activity');
        expect(triggers[1].getAttribute('aria-selected')).toBe('true');
    });

    it('skips disabled triggers during keyboard navigation', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        { defaultValue: 'overview' },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(
                                        TabsTrigger,
                                        { value: 'activity', disabled: true },
                                        () => 'Activity',
                                    ),
                                    h(TabsTrigger, { value: 'settings' }, () => 'Settings'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                                h(TabsContent, { value: 'settings' }, () => 'Settings panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        triggers[0].focus();
        keydown(triggers[0], 'ArrowRight');
        await flush();

        expect(document.activeElement).toBe(triggers[2]);
        expect(triggers[2].getAttribute('aria-selected')).toBe('true');
    });

    it('does not select disabled groups or disabled triggers', async () => {
        const disabledGroupUpdate = vi.fn();
        const disabledTriggerUpdate = vi.fn();

        const disabledGroup = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            defaultValue: 'overview',
                            disabled: true,
                            'onUpdate:modelValue': disabledGroupUpdate,
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                            ],
                        },
                    );
                },
            }),
        );

        const disabledTrigger = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        {
                            defaultValue: 'overview',
                            'onUpdate:modelValue': disabledTriggerUpdate,
                        },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(
                                        TabsTrigger,
                                        { value: 'activity', disabled: true },
                                        () => 'Activity',
                                    ),
                                ]),
                                h(TabsContent, { value: 'overview' }, () => 'Overview panel'),
                                h(TabsContent, { value: 'activity' }, () => 'Activity panel'),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const disabledGroupTriggers = Array.from(
            disabledGroup.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );
        const disabledTriggerTriggers = Array.from(
            disabledTrigger.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        click(disabledGroupTriggers[1]);
        click(disabledTriggerTriggers[1]);
        await flush();

        expect(disabledGroupTriggers[1].disabled).toBe(true);
        expect(disabledTriggerTriggers[1].disabled).toBe(true);
        expect(disabledGroupUpdate).not.toHaveBeenCalled();
        expect(disabledTriggerUpdate).not.toHaveBeenCalled();
        expect(disabledGroupTriggers[0].getAttribute('aria-selected')).toBe('true');
        expect(disabledTriggerTriggers[0].getAttribute('aria-selected')).toBe('true');
    });

    it('can unmount inactive panels', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Tabs,
                        { defaultValue: 'overview', unmountOnExit: true },
                        {
                            default: () => [
                                h(TabsList, null, () => [
                                    h(TabsTrigger, { value: 'overview' }, () => 'Overview'),
                                    h(TabsTrigger, { value: 'activity' }, () => 'Activity'),
                                ]),
                                h(
                                    TabsContent,
                                    { id: 'overview-panel', value: 'overview' },
                                    () => 'Overview panel',
                                ),
                                h(
                                    TabsContent,
                                    { id: 'activity-panel', value: 'activity' },
                                    () => 'Activity panel',
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await flush();

        const triggers = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.rp-tabs-trigger'),
        );

        expect(container.querySelector('#overview-panel')).toBeTruthy();
        expect(container.querySelector('#activity-panel')).toBeNull();

        click(triggers[1]);
        await flush();

        expect(container.querySelector('#overview-panel')).toBeNull();
        expect(container.querySelector('#activity-panel')).toBeTruthy();
    });
});
