import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountDom } from '../../../tests/utils/vue';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from '../dropdown-menu/dropdown-menu-primitives';
import Popover from '../popover/popover.vue';
import Tooltip from '../tooltip/tooltip.vue';
import type { PopoverSlotProps } from '../popover/types';
import type { TooltipSlotProps } from '../tooltip/types';

const floatingMocks = vi.hoisted(() => {
    const cleanup = vi.fn();
    return {
        cleanup,
        computePosition: vi.fn(),
        autoUpdate: vi.fn(
            (
                _reference: unknown,
                _floating: unknown,
                update: () => void | Promise<void>,
                _options?: { animationFrame?: boolean },
            ) => {
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

function expectAdvancedOptions(id: string, padding: number) {
    const computeCall = floatingMocks.computePosition.mock.calls.find(
        ([, floating]) => (floating as HTMLElement).id === id,
    );
    const flipMiddleware = computeCall?.[2].middleware.find(
        (middleware: { name: string }) => middleware.name === 'flip',
    );
    const autoUpdateCall = floatingMocks.autoUpdate.mock.calls.find(
        ([, floating]) => (floating as HTMLElement).id === id,
    );

    expect(flipMiddleware?.options).toEqual({
        padding,
        fallbackStrategy: 'initialPlacement',
    });
    expect(autoUpdateCall?.[3]).toEqual({ animationFrame: true });
}

describe('floating component positioning options', () => {
    beforeEach(() => {
        for (const mock of Object.values(floatingMocks)) mock.mockClear();
        floatingMocks.computePosition.mockImplementation(
            async (
                _reference: unknown,
                _floating: unknown,
                options: { placement: string; strategy: string },
            ) => ({
                x: 12,
                y: 34,
                placement: options.placement,
                strategy: options.strategy,
                middlewareData: {},
            }),
        );
    });

    it('forwards advanced options from popover and tooltip', async () => {
        mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(
                            Popover,
                            {
                                id: 'advanced-popover',
                                open: true,
                                teleport: false,
                                collisionPadding: 11,
                                flipOptions: { fallbackStrategy: 'initialPlacement' },
                                autoUpdateOptions: { animationFrame: true },
                            },
                            {
                                default: ({ triggerProps }: PopoverSlotProps) =>
                                    h('button', triggerProps, 'Popover target'),
                                content: () => 'Popover content',
                            },
                        ),
                        h(
                            Tooltip,
                            {
                                id: 'advanced-tooltip',
                                content: 'Tooltip content',
                                open: true,
                                teleport: false,
                                collisionPadding: 12,
                                flipOptions: { fallbackStrategy: 'initialPlacement' },
                                autoUpdateOptions: { animationFrame: true },
                            },
                            {
                                default: ({ triggerProps }: TooltipSlotProps) =>
                                    h('button', triggerProps, 'Tooltip target'),
                            },
                        ),
                    ]);
                },
            }),
        );

        await vi.waitFor(() => {
            for (const id of ['advanced-popover', 'advanced-tooltip']) {
                expect(
                    floatingMocks.computePosition.mock.calls.some(
                        ([, floating]) => (floating as HTMLElement).id === id,
                    ),
                ).toBe(true);
            }
        });
        expectAdvancedOptions('advanced-popover', 11);
        expectAdvancedOptions('advanced-tooltip', 12);
    });

    it('forwards advanced options from dropdown content primitives', async () => {
        mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenuRoot,
                        { defaultOpen: true, modal: false },
                        {
                            default: () => [
                                h(DropdownMenuTrigger, null, () => 'Actions'),
                                h(
                                    DropdownMenuContent,
                                    {
                                        id: 'advanced-dropdown-content',
                                        collisionPadding: 13,
                                        flipOptions: {
                                            fallbackStrategy: 'initialPlacement',
                                        },
                                        autoUpdateOptions: { animationFrame: true },
                                    },
                                    () => h(DropdownMenuItem, null, () => 'Action'),
                                ),
                            ],
                        },
                    );
                },
            }),
        );

        await vi.waitFor(() =>
            expect(
                floatingMocks.computePosition.mock.calls.some(
                    ([, floating]) => (floating as HTMLElement).id === 'advanced-dropdown-content',
                ),
            ).toBe(true),
        );
        expectAdvancedOptions('advanced-dropdown-content', 13);
    });
});
