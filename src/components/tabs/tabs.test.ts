import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { click, flush, keydown, mountDom } from '../../../tests/utils/vue';
import TabPanel from './tab-panel.vue';
import Tabs from './tabs.vue';
import TabsList from './tabs-list.vue';
import TabsTrigger from './tabs-trigger.vue';

describe('Tabs', () => {
    it('supports arrow navigation with trigger and panel linkage', async () => {
        const container = mountDom(
            defineComponent({
                setup() {
                    const active = ref('one');
                    return () =>
                        h(
                            Tabs,
                            {
                                modelValue: active.value,
                                'onUpdate:modelValue': (value: string) => {
                                    active.value = value;
                                },
                            },
                            {
                                default: () => [
                                    h(TabsList, null, {
                                        default: () => [
                                            h(
                                                TabsTrigger,
                                                { value: 'one' },
                                                { default: () => 'One' },
                                            ),
                                            h(
                                                TabsTrigger,
                                                { value: 'disabled', disabled: true },
                                                { default: () => 'Disabled' },
                                            ),
                                            h(
                                                TabsTrigger,
                                                { value: 'two' },
                                                { default: () => 'Two' },
                                            ),
                                        ],
                                    }),
                                    h(TabPanel, { value: 'one' }, { default: () => 'One panel' }),
                                    h(TabPanel, { value: 'two' }, { default: () => 'Two panel' }),
                                ],
                            },
                        );
                },
            }),
        );

        await flush();

        const first = container.querySelector('[role="tab"]') as HTMLElement;
        const list = container.querySelector('[role="tablist"]')!;

        expect(first.getAttribute('aria-controls')).toBeTruthy();
        first.focus();
        keydown(list, 'ArrowRight');
        await flush();

        const selected = Array.from(container.querySelectorAll('[role="tab"]')).find(
            (tab) => tab.getAttribute('aria-selected') === 'true',
        );
        expect(selected?.textContent).toBe('Two');
        expect(container.querySelector('[role="tabpanel"]')?.textContent).toBe('Two panel');
    });

    it('keeps trigger buttons from submitting parent forms', async () => {
        const onSubmit = vi.fn((e: Event) => e.preventDefault());

        const container = mountDom(
            defineComponent({
                setup() {
                    const tab = ref('a');
                    return () =>
                        h('form', { onSubmit }, [
                            h(
                                Tabs,
                                {
                                    modelValue: tab.value,
                                    'onUpdate:modelValue': (value: string) => {
                                        tab.value = value;
                                    },
                                },
                                {
                                    default: () => [
                                        h(TabsList, null, {
                                            default: () => [
                                                h(
                                                    TabsTrigger,
                                                    { value: 'a' },
                                                    { default: () => 'A' },
                                                ),
                                                h(
                                                    TabsTrigger,
                                                    { value: 'b' },
                                                    { default: () => 'B' },
                                                ),
                                            ],
                                        }),
                                        h(TabPanel, { value: 'a' }, { default: () => 'A panel' }),
                                        h(TabPanel, { value: 'b' }, { default: () => 'B panel' }),
                                    ],
                                },
                            ),
                        ]);
                },
            }),
        );

        await flush();

        const buttons = Array.from(container.querySelectorAll('button'));
        for (const button of buttons) {
            expect(button.type).toBe('button');
            click(button);
            await nextTick();
        }

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
