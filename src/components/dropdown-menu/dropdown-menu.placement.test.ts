import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { nestedItems } from '../../../tests/fixtures/dropdown-menu';
import { click, mountDom } from '../../../tests/utils/vue';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuSlotProps } from './types';

const floatingMocks = vi.hoisted(() => {
    const cleanup = vi.fn();
    return {
        cleanup,
        computePosition: vi.fn(),
        autoUpdate: vi.fn(
            (_reference: unknown, _floating: unknown, update: () => void | Promise<void>) => {
                void update();
                return cleanup;
            },
        ),
        offset: vi.fn((options: unknown) => ({ name: 'offset', options, fn: vi.fn() })),
        flip: vi.fn((options: unknown) => ({ name: 'flip', options, fn: vi.fn() })),
        shift: vi.fn((options: unknown) => ({ name: 'shift', options, fn: vi.fn() })),
        arrow: vi.fn((options: unknown) => ({ name: 'arrow', options, fn: vi.fn() })),
    };
});

vi.mock('@floating-ui/dom', () => ({
    arrow: floatingMocks.arrow,
    autoUpdate: floatingMocks.autoUpdate,
    computePosition: floatingMocks.computePosition,
    flip: floatingMocks.flip,
    offset: floatingMocks.offset,
    shift: floatingMocks.shift,
}));

describe('DropdownMenu placement attributes', () => {
    beforeEach(() => {
        for (const mock of Object.values(floatingMocks)) mock.mockClear();
        floatingMocks.computePosition.mockImplementation(
            async (
                _reference: unknown,
                _floating: unknown,
                options: { placement: string; strategy: string },
            ) => {
                const finalPlacement =
                    options.placement === 'bottom-start'
                        ? 'top-end'
                        : options.placement === 'left-start'
                          ? 'right-end'
                          : options.placement;

                return {
                    x: 12,
                    y: 34,
                    placement: finalPlacement,
                    strategy: options.strategy,
                    middlewareData: {},
                };
            },
        );
    });

    it('exposes the final aligned placement after root and submenu collisions', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'placement-menu',
                            items: nestedItems,
                            open: true,
                            placement: 'bottom-start',
                            teleport: false,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', triggerProps, 'Actions'),
                        },
                    );
                },
            }),
        );

        const content = container.querySelector('#placement-menu') as HTMLElement;
        await vi.waitFor(() => expect(content.dataset.placement).toBe('top-end'));
        expect(content.dataset.side).toBe('top');

        click(document.getElementById('placement-menu-item-1') as HTMLButtonElement);
        await nextTick();

        const submenu = document.getElementById('placement-menu-submenu-1') as HTMLElement;
        await vi.waitFor(() =>
            expect(
                floatingMocks.computePosition.mock.calls.map(([, , options]) => options.placement),
            ).toContain('left-start'),
        );
        await vi.waitFor(() => expect(submenu.dataset.placement).toBe('right-end'));
        expect(submenu.dataset.side).toBe('right');
    });
});
