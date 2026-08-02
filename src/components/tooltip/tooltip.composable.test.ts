import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import { mountDom } from '../../../tests/utils/vue';
import type { TooltipProps } from './types';
import { useTooltip } from './useTooltip';

describe('Tooltip composable', () => {
    it('keeps state handlers testable without rendering the full component', async () => {
        const props = reactive<TooltipProps>({
            content: 'Composable help',
            id: 'composable-tooltip',
            placement: 'left',
            openDelay: 0,
            disabled: false,
        });
        let tooltip!: ReturnType<typeof useTooltip>;

        mountDom(
            defineComponent({
                setup() {
                    tooltip = useTooltip(props);
                    return () => h('div');
                },
            }),
        );

        expect(tooltip.triggerProps.value['aria-describedby']).toBe('composable-tooltip');
        expect(tooltip.rootClass.value).toEqual(['rp-tooltip', 'rp-tooltip--placement-left']);

        tooltip.openTooltip();
        await nextTick();
        expect(tooltip.isVisible.value).toBe(true);
        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-left',
            'rp-tooltip--open',
        ]);

        tooltip.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);

        tooltip.openTooltip();
        await nextTick();
        props.disabled = true;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);
        expect(tooltip.triggerProps.value['aria-describedby']).toBeUndefined();
    });

    it('keeps arrow disabled by default and enables it through the arrow prop', () => {
        const props = reactive<TooltipProps>({
            content: 'Arrow help',
            openDelay: 0,
        });
        let tooltip!: ReturnType<typeof useTooltip>;

        mountDom(
            defineComponent({
                setup() {
                    tooltip = useTooltip(props);
                    return () => h('div');
                },
            }),
        );

        expect(tooltip.rootClass.value).toEqual(['rp-tooltip', 'rp-tooltip--placement-top']);

        props.arrow = true;

        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--arrow',
        ]);
    });

    it('supports controlled visibility through the open prop', async () => {
        const props = reactive<TooltipProps>({
            content: 'Controlled help',
            open: false,
            openDelay: 0,
        });
        let tooltip!: ReturnType<typeof useTooltip>;

        mountDom(
            defineComponent({
                setup() {
                    tooltip = useTooltip(props);
                    return () => h('div');
                },
            }),
        );

        expect(tooltip.isVisible.value).toBe(false);

        props.open = true;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(true);
        expect(tooltip.rootClass.value).toEqual([
            'rp-tooltip',
            'rp-tooltip--placement-top',
            'rp-tooltip--open',
        ]);

        props.open = false;
        await nextTick();
        expect(tooltip.isVisible.value).toBe(false);
    });
});
