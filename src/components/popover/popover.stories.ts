import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import Button from '../button/button.vue';
import Popover from './popover.vue';
import { popoverPlacements, type PopoverPlacement } from './types';

function expectPlacementGeometry(
    placement: PopoverPlacement,
    anchorRect: DOMRect,
    contentRect: DOMRect,
) {
    const collisionTolerance = 8.5;
    const [side, alignment = 'center'] = placement.split('-');

    if (side === 'top') expect(contentRect.bottom).toBeLessThan(anchorRect.top);
    if (side === 'right') expect(contentRect.left).toBeGreaterThan(anchorRect.right);
    if (side === 'bottom') expect(contentRect.top).toBeGreaterThan(anchorRect.bottom);
    if (side === 'left') expect(contentRect.right).toBeLessThan(anchorRect.left);

    const isVerticalSide = side === 'top' || side === 'bottom';
    const anchorStart = isVerticalSide ? anchorRect.left : anchorRect.top;
    const contentStart = isVerticalSide ? contentRect.left : contentRect.top;
    const anchorEnd = isVerticalSide ? anchorRect.right : anchorRect.bottom;
    const contentEnd = isVerticalSide ? contentRect.right : contentRect.bottom;
    const anchorCenter = (anchorStart + anchorEnd) / 2;
    const contentCenter = (contentStart + contentEnd) / 2;

    if (alignment === 'start') {
        expect(Math.abs(contentStart - anchorStart), `${placement} start alignment`).toBeLessThan(
            collisionTolerance,
        );
    } else if (alignment === 'end') {
        expect(Math.abs(contentEnd - anchorEnd), `${placement} end alignment`).toBeLessThan(
            collisionTolerance,
        );
    } else {
        expect(
            Math.abs(contentCenter - anchorCenter),
            `${placement} center alignment (${contentCenter} vs ${anchorCenter})`,
        ).toBeLessThan(collisionTolerance);
    }
}

const meta = {
    title: 'Components/Popover',
    component: Popover as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: popoverPlacements,
        },
        open: { control: 'boolean' },
        disabled: { control: 'boolean' },
        offset: { control: 'object' },
        closeOnOutsideClick: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
        trapFocus: { control: 'boolean' },
        returnFocus: { control: 'boolean' },
        target: { control: false },
        initialFocus: { control: false },
        focusTrapOptions: { control: false },
    },
    args: {
        placement: 'bottom',
        disabled: false,
        closeOnOutsideClick: true,
        closeOnEscape: true,
        trapFocus: false,
        returnFocus: true,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    args: {
        ariaLabel: 'Project status',
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Popover v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Project status</Button>
                    </template>
                    <template #content="{ close }">
                        <div style="display: grid; gap: 12px; width: 220px;">
                            <div style="display: grid; gap: 4px;">
                                <strong>Project status</strong>
                                <span style="color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                                    Review is complete and ready for release.
                                </span>
                            </div>
                            <Button size="sm" @click="close">Done</Button>
                        </div>
                    </template>
                </Popover>
            </div>
        `,
    }),
};

export const TrappedFocus: Story = {
    args: {
        ariaLabel: 'Trapped actions',
        trapFocus: true,
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Popover v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Open actions</Button>
                    </template>
                    <template #content="{ close }">
                        <div style="display: grid; gap: 8px; width: 220px;">
                            <Button size="sm" variant="ghost">First action</Button>
                            <Button size="sm" variant="ghost">Second action</Button>
                            <Button size="sm" @click="close">Done</Button>
                        </div>
                    </template>
                </Popover>
            </div>
        `,
    }),
};

export const Placements: Story = {
    tags: ['test'],
    args: {
        open: true,
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args, placements: popoverPlacements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 1000px; place-content: center; padding: 180px 240px;">
                <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: 180px 240px;">
                    <Popover
                        v-for="placement in placements"
                        :key="placement"
                        v-bind="args"
                        :placement="placement"
                        :aria-label="'Popover on ' + placement"
                    >
                        <template #default="{ triggerProps }">
                            <Button v-bind="triggerProps" variant="outline">{{ placement }}</Button>
                        </template>
                        <template #content>
                            <div style="width: 180px;">
                                Popover on {{ placement }}
                            </div>
                        </template>
                    </Popover>
                </div>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const roots = [...canvasElement.querySelectorAll<HTMLElement>('.rp-popover')];
        const contents = [...storyDocument.querySelectorAll<HTMLElement>('.rp-popover__content')];

        expect(roots).toHaveLength(popoverPlacements.length);
        expect(contents).toHaveLength(popoverPlacements.length);
        await waitFor(() => {
            for (const content of contents) {
                expect(content).toBeVisible();
                expect(content.style.visibility).not.toBe('hidden');
            }
        });

        for (const placement of popoverPlacements) {
            const root = roots.find((current) => current.textContent?.trim() === placement)!;
            const content = contents.find(
                (current) => current.textContent?.trim() === `Popover on ${placement}`,
            )!;
            const actualPlacement = content.dataset.placement as PopoverPlacement;

            expectPlacementGeometry(
                actualPlacement,
                root.getBoundingClientRect(),
                content.getBoundingClientRect(),
            );
        }
    },
};

export const Offset: Story = {
    args: {
        placement: 'right',
        ariaLabel: 'Offset details',
        offset: {
            mainAxis: 24,
            crossAxis: 16,
        },
        open: true,
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Popover v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Offset</Button>
                    </template>
                    <template #content>
                        <div style="width: 180px;">Aligned with custom axis offsets.</div>
                    </template>
                </Popover>
            </div>
        `,
    }),
};

export const Target: Story = {
    args: {
        ariaLabel: 'External target details',
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Button id="popover-target-button" variant="outline">External target</Button>
                <Popover v-bind="args" target="#popover-target-button">
                    <div style="display: grid; gap: 8px; width: 220px;">
                        <strong>External target</strong>
                        <span style="color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                            This panel is anchored by selector.
                        </span>
                    </div>
                </Popover>
            </div>
        `,
    }),
};

export const TargetPlacements: Story = {
    tags: ['test'],
    args: {
        open: true,
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args, placements: popoverPlacements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 1000px; place-content: center; padding: 180px 240px;">
                <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: 180px 240px;">
                    <div v-for="placement in placements" :key="placement">
                        <Button :id="'popover-target-' + placement" variant="outline">
                            {{ placement }}
                        </Button>
                        <Popover
                            v-bind="args"
                            :data-placement="placement"
                            :placement="placement"
                            :target="'#popover-target-' + placement"
                            :aria-label="'Target popover on ' + placement"
                        >
                            <div style="width: 120px;">{{ placement }}</div>
                        </Popover>
                    </div>
                </div>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const roots = [...canvasElement.querySelectorAll<HTMLElement>('.rp-popover')];
        const contents = [...storyDocument.querySelectorAll<HTMLElement>('.rp-popover__content')];

        expect(roots).toHaveLength(popoverPlacements.length);
        expect(contents).toHaveLength(popoverPlacements.length);
        await waitFor(() => {
            for (const content of contents) {
                expect(content).toBeVisible();
                expect(content.style.visibility).not.toBe('hidden');
            }
        });

        for (const placement of popoverPlacements) {
            const target = canvasElement.querySelector<HTMLElement>(
                `#popover-target-${placement}`,
            )!;
            const content = contents.find((current) => current.textContent?.trim() === placement)!;
            const actualPlacement = content.dataset.placement as PopoverPlacement;

            expectPlacementGeometry(
                actualPlacement,
                target.getBoundingClientRect(),
                content.getBoundingClientRect(),
            );
        }
    },
};
