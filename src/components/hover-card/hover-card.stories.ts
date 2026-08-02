import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import Button from '../button/button.vue';
import HoverCard from './hover-card.vue';
import { hoverCardPlacements } from './types';

const meta = {
    title: 'Components/Overlays/Hover Card',
    component: HoverCard as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: hoverCardPlacements,
        },
        open: { control: 'boolean' },
        disabled: { control: 'boolean' },
        openDelay: { control: 'number' },
        closeDelay: { control: 'number' },
        touchBehavior: {
            control: 'select',
            options: ['none', 'toggle'],
        },
        offset: { control: 'object' },
        flipOptions: { control: 'object' },
        autoUpdateOptions: { control: 'object' },
        target: { control: false },
    },
    args: {
        placement: 'bottom-start',
        openDelay: 700,
        closeDelay: 300,
        disabled: false,
        touchBehavior: 'none',
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { HoverCard },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 112px;">
                <HoverCard v-bind="args">
                    <template #default="{ triggerProps }">
                        <a
                            v-bind="triggerProps"
                            href="#ada-lovelace"
                            style="color: var(--rp-color-text); font-weight: var(--rp-font-weight-semibold);"
                        >
                            Ada Lovelace
                        </a>
                    </template>
                    <template #content>
                        <article style="display: grid; gap: 10px; width: 280px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span
                                    aria-hidden="true"
                                    style="display: grid; width: 42px; height: 42px; place-items: center; color: var(--rp-color-violet-contrast); background: var(--rp-color-violet-filled); border-radius: 999px; font-weight: var(--rp-font-weight-semibold);"
                                >
                                    AL
                                </span>
                                <div style="display: grid; gap: 2px;">
                                    <strong>Ada Lovelace</strong>
                                    <span style="color: var(--rp-color-dimmed); font-size: var(--rp-font-size-sm);">
                                        @ada
                                    </span>
                                </div>
                            </div>
                            <p style="margin: 0; color: var(--rp-color-dimmed);">
                                Mathematician and writer, known for her work on the Analytical Engine.
                            </p>
                        </article>
                    </template>
                </HoverCard>
            </div>
        `,
    }),
};

export const TeleportedStyles: Story = {
    tags: ['test'],
    args: {
        id: 'teleported-hover-card-styles',
        open: true,
        arrow: true,
    },
    render: (args) => ({
        components: { Button, HoverCard },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 112px;">
                <HoverCard v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Inspect styles</Button>
                    </template>
                    <template #content>
                        <div style="width: 240px;">Teleported hover card content</div>
                    </template>
                </HoverCard>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const content = storyDocument.querySelector<HTMLElement>('#teleported-hover-card-styles')!;
        const arrow = content.querySelector<HTMLElement>('.rp-hover-card__arrow')!;

        await waitFor(() => {
            expect(content).toBeVisible();
            expect(content.style.visibility).not.toBe('hidden');
        });

        const contentStyle = getComputedStyle(content);
        const arrowStyle = getComputedStyle(arrow);
        const arrowRect = arrow.getBoundingClientRect();

        expect(contentStyle.getPropertyValue('--_rp-hover-card-radius').trim()).not.toBe('');
        expect(contentStyle.getPropertyValue('--_rp-hover-card-arrow-size').trim()).not.toBe('');
        expect(Number.parseFloat(contentStyle.borderRadius)).toBeGreaterThan(0);
        expect(arrow.dataset.side).toBe('bottom');
        expect(arrowStyle.borderTopColor).toBe(contentStyle.borderTopColor);
        expect(arrowStyle.borderLeftColor).toBe(contentStyle.borderLeftColor);
        expect(arrowStyle.borderRightColor).toBe('rgba(0, 0, 0, 0)');
        expect(arrowStyle.borderBottomColor).toBe('rgba(0, 0, 0, 0)');
        expect(arrowRect.width).toBeGreaterThan(0);
        expect(arrowRect.height).toBeGreaterThan(0);
    },
};

export const RtlPlacement: Story = {
    tags: ['test'],
    args: {
        id: 'rtl-hover-card',
        open: true,
        placement: 'bottom-start',
        flip: false,
        shift: false,
    },
    render: (args) => ({
        components: { Button, HoverCard },
        setup: () => ({ args }),
        template: `
            <div
                dir="rtl"
                style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 112px;"
            >
                <HoverCard v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">RTL target</Button>
                    </template>
                    <template #content>
                        <div style="width: 180px;">محتوى بطاقة المعاينة</div>
                    </template>
                </HoverCard>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const root = canvasElement.querySelector<HTMLElement>('.rp-hover-card')!;
        const content = storyDocument.querySelector<HTMLElement>('#rtl-hover-card')!;

        await waitFor(() => {
            expect(content).toBeVisible();
            expect(content.style.visibility).not.toBe('hidden');
        });

        expect(getComputedStyle(content).direction).toBe('rtl');
        expect(
            Math.abs(content.getBoundingClientRect().right - root.getBoundingClientRect().right),
        ).toBeLessThanOrEqual(1);
    },
};

export const Placements: Story = {
    tags: ['test'],
    args: {
        open: true,
        arrow: true,
    },
    render: (args) => ({
        components: { Button, HoverCard },
        setup: () => ({ args, placements: hoverCardPlacements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 1080px; place-content: center; padding: 200px 260px;">
                <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: 180px 260px;">
                    <HoverCard
                        v-for="placement in placements"
                        :key="placement"
                        v-bind="args"
                        :placement="placement"
                    >
                        <template #default="{ triggerProps }">
                            <Button v-bind="triggerProps" variant="outline">{{ placement }}</Button>
                        </template>
                        <template #content>
                            <div style="width: 180px;">Hover card on {{ placement }}</div>
                        </template>
                    </HoverCard>
                </div>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const contents = [
            ...storyDocument.querySelectorAll<HTMLElement>('.rp-hover-card__content'),
        ];

        expect(contents).toHaveLength(hoverCardPlacements.length);
        await waitFor(() => {
            for (const content of contents) expect(content).toBeVisible();
        });

        for (const content of contents) {
            const contentStyle = getComputedStyle(content);
            const arrow = content.querySelector<HTMLElement>('.rp-hover-card__arrow')!;
            const arrowStyle = getComputedStyle(arrow);
            const transparent = 'rgba(0, 0, 0, 0)';

            if (arrow.dataset.side === 'top') {
                expect(arrowStyle.borderTopColor).toBe(transparent);
                expect(arrowStyle.borderLeftColor).toBe(transparent);
                expect(arrowStyle.borderRightColor).toBe(contentStyle.borderRightColor);
                expect(arrowStyle.borderBottomColor).toBe(contentStyle.borderBottomColor);
            } else if (arrow.dataset.side === 'right') {
                expect(arrowStyle.borderTopColor).toBe(transparent);
                expect(arrowStyle.borderRightColor).toBe(transparent);
                expect(arrowStyle.borderBottomColor).toBe(contentStyle.borderBottomColor);
                expect(arrowStyle.borderLeftColor).toBe(contentStyle.borderLeftColor);
            } else if (arrow.dataset.side === 'bottom') {
                expect(arrowStyle.borderTopColor).toBe(contentStyle.borderTopColor);
                expect(arrowStyle.borderLeftColor).toBe(contentStyle.borderLeftColor);
                expect(arrowStyle.borderRightColor).toBe(transparent);
                expect(arrowStyle.borderBottomColor).toBe(transparent);
            } else {
                expect(arrow.dataset.side).toBe('left');
                expect(arrowStyle.borderTopColor).toBe(contentStyle.borderTopColor);
                expect(arrowStyle.borderRightColor).toBe(contentStyle.borderRightColor);
                expect(arrowStyle.borderBottomColor).toBe(transparent);
                expect(arrowStyle.borderLeftColor).toBe(transparent);
            }
        }
    },
};

export const ExternalTarget: Story = {
    render: (args) => ({
        components: { Button, HoverCard },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 112px;">
                <Button id="hover-card-target" variant="outline">External target</Button>
                <HoverCard v-bind="args" target="#hover-card-target">
                    <div style="width: 240px;">
                        This content is anchored to and controlled by an external target.
                    </div>
                </HoverCard>
            </div>
        `,
    }),
};
