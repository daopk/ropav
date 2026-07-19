import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ref } from 'vue';
import Button from '../button/button.vue';
import ScrollArea from './scroll-area.vue';
import { scrollAreaScrollbars, scrollAreaTypes } from './types';

const people = [
    ['Ada Lovelace', 'Mathematician'],
    ['Alan Turing', 'Computer scientist'],
    ['Grace Hopper', 'Computer scientist'],
    ['Edsger Dijkstra', 'Computer scientist'],
    ['Margaret Hamilton', 'Software engineer'],
    ['Donald Knuth', 'Computer scientist'],
    ['Barbara Liskov', 'Computer scientist'],
    ['James Gosling', 'Software engineer'],
    ['Radia Perlman', 'Network engineer'],
    ['Ken Thompson', 'Computer scientist'],
] as const;

interface ScrollAreaInstance {
    viewport: HTMLElement;
    scrollTo: (options: ScrollToOptions) => void;
}

const meta = {
    title: 'Components/ScrollArea',
    component: ScrollArea as any,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: scrollAreaTypes,
        },
        scrollbars: {
            control: 'select',
            options: [...scrollAreaScrollbars, false],
        },
        scrollbarSize: { control: 'text' },
        scrollHideDelay: { control: 'number' },
        embedded: { control: 'boolean' },
    },
    args: {
        type: 'hover',
        scrollbars: 'both',
        scrollbarSize: 10,
        scrollHideDelay: 600,
        embedded: false,
    },
    render: (args) => ({
        components: { ScrollArea },
        setup: () => ({ args, people }),
        template: `
            <ScrollArea
                v-bind="args"
                aria-label="Notable people"
                style="width: min(360px, 100%); height: 260px; border: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-md);"
            >
                <div
                    v-for="([name, role], index) in people"
                    :key="name"
                    :style="{
                        padding: '14px 16px',
                        borderBottom: index < people.length - 1 ? '1px solid var(--rp-color-default-border)' : undefined,
                    }"
                >
                    <div style="font-weight: 600; color: var(--rp-color-text);">{{ name }}</div>
                    <div style="font-size: 14px; color: var(--rp-color-dimmed);">{{ role }}</div>
                </div>
            </ScrollArea>
        `,
    }),
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
    args: { scrollbars: 'x', type: 'always' },
    render: (args) => ({
        components: { ScrollArea },
        setup: () => ({ args }),
        template: `
            <ScrollArea
                v-bind="args"
                aria-label="Color palette"
                style="width: min(560px, 100%); height: 168px; border: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-md);"
            >
                <div style="display: flex; width: max-content; gap: 12px; padding: 16px 16px 22px;">
                    <div
                        v-for="color in ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red']"
                        :key="color"
                        :style="{
                            display: 'grid',
                            width: '104px',
                            height: '120px',
                            placeItems: 'end start',
                            padding: '12px',
                            color: 'white',
                            background: 'var(--rp-color-' + color + '-6)',
                            borderRadius: 'var(--rp-radius-sm)',
                            boxSizing: 'border-box',
                            fontWeight: 600,
                        }"
                    >
                        {{ color }}
                    </div>
                </div>
            </ScrollArea>
        `,
    }),
};

export const BothAxes: Story = {
    args: { type: 'always' },
    render: (args) => ({
        components: { ScrollArea },
        setup: () => ({ args }),
        template: `
            <ScrollArea
                v-bind="args"
                aria-label="Project metrics"
                style="width: min(520px, 100%); height: 240px; border: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-md);"
            >
                <table style="width: 760px; border-collapse: collapse; color: var(--rp-color-text);">
                    <thead>
                        <tr>
                            <th v-for="column in ['Project', 'Owner', 'Status', 'Progress', 'Updated']" :key="column" style="padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--rp-color-default-border);">{{ column }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in 12" :key="row">
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--rp-color-default-border);">Project {{ row }}</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--rp-color-default-border);">Team {{ (row % 4) + 1 }}</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--rp-color-default-border);">Active</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--rp-color-default-border);">{{ 30 + row * 5 }}%</td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid var(--rp-color-default-border);">Today</td>
                        </tr>
                    </tbody>
                </table>
            </ScrollArea>
        `,
    }),
};

export const ProgrammaticScrolling: Story = {
    tags: ['test'],
    args: { scrollbars: 'y', type: 'always' },
    render: (args) => ({
        components: { Button, ScrollArea },
        setup() {
            const scrollAreaRef = ref<ScrollAreaInstance | null>(null);
            const positionY = ref(0);

            const scrollTo = (top: number) => {
                scrollAreaRef.value?.scrollTo({ top, behavior: 'smooth' });
            };
            const scrollToBottom = () => {
                const viewport = scrollAreaRef.value?.viewport;
                if (!viewport) return;

                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            };
            const onPositionChange = (position: { y: number }) => {
                positionY.value = Math.round(position.y);
            };

            return {
                args,
                onPositionChange,
                positionY,
                scrollAreaRef,
                scrollTo,
                scrollToBottom,
            };
        },
        template: `
            <div style="display: grid; gap: 16px; width: min(420px, 100%);">
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="scroll-top"
                        @click="scrollTo(0)"
                    >
                        Top
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="scroll-middle"
                        @click="scrollTo(440)"
                    >
                        Middle
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="scroll-bottom"
                        @click="scrollToBottom"
                    >
                        Bottom via viewport
                    </Button>
                    <span
                        data-testid="scroll-position"
                        aria-live="polite"
                        style="margin-inline-start: auto; color: var(--rp-color-dimmed); font-size: 14px; font-variant-numeric: tabular-nums;"
                    >
                        y: {{ positionY }}px
                    </span>
                </div>

                <ScrollArea
                    ref="scrollAreaRef"
                    v-bind="args"
                    aria-label="Programmatically controlled list"
                    style="height: 220px; border: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-md);"
                    @scroll-position-change="onPositionChange"
                >
                    <div
                        v-for="item in 24"
                        :key="item"
                        :style="{
                            boxSizing: 'border-box',
                            height: '52px',
                            padding: '15px 16px',
                            color: 'var(--rp-color-text)',
                            borderBottom: item < 24 ? '1px solid var(--rp-color-default-border)' : undefined,
                        }"
                    >
                        Item {{ item }}
                    </div>
                </ScrollArea>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const viewport = canvasElement.querySelector<HTMLElement>('.rp-scroll-area__viewport')!;
        const position = canvasElement.querySelector<HTMLElement>(
            '[data-testid="scroll-position"]',
        )!;
        const topButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="scroll-top"]',
        )!;
        const middleButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="scroll-middle"]',
        )!;
        const bottomButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="scroll-bottom"]',
        )!;

        await userEvent.click(middleButton);
        await waitFor(() => expect(viewport.scrollTop).toBe(440));
        await waitFor(() => expect(position).toHaveTextContent('y: 440px'));

        await userEvent.click(bottomButton);
        await waitFor(() =>
            expect(viewport.scrollTop).toBe(viewport.scrollHeight - viewport.clientHeight),
        );

        await userEvent.click(topButton);
        await waitFor(() => expect(viewport.scrollTop).toBe(0));
        await waitFor(() => expect(position).toHaveTextContent('y: 0px'));
        topButton.blur();
    },
};

export const Sizing: Story = {
    tags: ['test'],
    args: { scrollbars: 'y', type: 'auto' },
    render: (args) => ({
        components: { Button, ScrollArea },
        setup() {
            const itemCount = ref(3);
            const addItem = () => {
                itemCount.value = Math.min(12, itemCount.value + 1);
            };
            const removeItem = () => {
                itemCount.value = Math.max(1, itemCount.value - 1);
            };

            return { addItem, args, itemCount, removeItem };
        },
        template: `
            <div style="display: grid; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="remove-item"
                        :disabled="itemCount <= 1"
                        @click="removeItem"
                    >
                        Remove item
                    </Button>
                    <span
                        data-testid="item-count"
                        aria-live="polite"
                        style="min-width: 4.5rem; color: var(--rp-color-text); text-align: center; font-variant-numeric: tabular-nums;"
                    >
                        {{ itemCount }} items
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid="add-item"
                        :disabled="itemCount >= 12"
                        @click="addItem"
                    >
                        Add item
                    </Button>
                </div>

                <div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 24px;">
                    <div>
                        <div style="margin-bottom: 6px; color: var(--rp-color-text); font-weight: 600;">Auto height, max-height: 140px</div>
                        <ScrollArea
                            v-bind="args"
                            data-testid="auto-max-height"
                            aria-label="Auto-height activity list capped at 140 pixels"
                            style="width: 300px; max-height: 140px; outline: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-sm);"
                        >
                            <div v-for="item in itemCount" :key="item" style="box-sizing: border-box; height: 40px; padding: 10px 12px; color: var(--rp-color-text);">
                                Item {{ item }}
                            </div>
                        </ScrollArea>
                    </div>

                    <div>
                        <div style="margin-bottom: 6px; color: var(--rp-color-text); font-weight: 600;">Fixed height: 160px</div>
                        <ScrollArea
                            v-bind="args"
                            data-testid="fixed-height"
                            aria-label="Fixed-height activity list"
                            style="width: 300px; height: 160px; outline: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-sm);"
                        >
                            <div v-for="item in itemCount" :key="item" style="box-sizing: border-box; height: 40px; padding: 10px 12px; color: var(--rp-color-text);">
                                Item {{ item }}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const adaptiveRoot = canvasElement.querySelector<HTMLElement>(
            '[data-testid="auto-max-height"]',
        )!;
        const adaptiveViewport = adaptiveRoot.querySelector<HTMLElement>(
            '.rp-scroll-area__viewport',
        )!;
        const fixedRoot = canvasElement.querySelector<HTMLElement>('[data-testid="fixed-height"]')!;
        const fixedViewport = fixedRoot.querySelector<HTMLElement>('.rp-scroll-area__viewport')!;

        await waitFor(() => expect(adaptiveRoot.clientHeight).toBe(120));
        expect(adaptiveViewport.clientHeight).toBe(120);
        expect(adaptiveViewport.scrollHeight).toBe(120);
        expect(adaptiveRoot).not.toHaveAttribute('data-overflow-y');
        expect(fixedRoot.clientHeight).toBe(160);
        expect(fixedViewport.clientHeight).toBe(160);
        expect(fixedViewport.scrollHeight).toBe(160);
        expect(fixedRoot).not.toHaveAttribute('data-overflow-y');

        const addButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="add-item"]',
        )!;
        const removeButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="remove-item"]',
        )!;
        await userEvent.click(addButton);
        await userEvent.click(addButton);

        await waitFor(() => expect(adaptiveRoot).toHaveAttribute('data-overflow-y'));
        expect(adaptiveRoot.clientHeight).toBe(140);
        expect(adaptiveViewport.clientHeight).toBe(140);
        expect(adaptiveViewport.scrollHeight).toBe(200);
        await waitFor(() => expect(fixedRoot).toHaveAttribute('data-overflow-y'));
        expect(fixedRoot.clientHeight).toBe(160);
        expect(fixedViewport.clientHeight).toBe(160);
        expect(fixedViewport.scrollHeight).toBe(200);

        await userEvent.click(removeButton);
        await userEvent.click(removeButton);
        await waitFor(() => expect(adaptiveRoot.clientHeight).toBe(120));
        await waitFor(() => expect(adaptiveRoot).not.toHaveAttribute('data-overflow-y'));
        await waitFor(() => expect(fixedRoot).not.toHaveAttribute('data-overflow-y'));
        removeButton.blur();
    },
};

export const VisibilityTypes: Story = {
    render: (args) => ({
        components: { ScrollArea },
        setup: () => ({ args, types: scrollAreaTypes }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; width: min(800px, 100%);">
                <div v-for="visibilityType in types" :key="visibilityType">
                    <div style="margin-bottom: 6px; color: var(--rp-color-text); font-weight: 600;">{{ visibilityType }}</div>
                    <ScrollArea
                        v-bind="args"
                        :type="visibilityType"
                        scrollbars="y"
                        style="height: 140px; border: 1px solid var(--rp-color-default-border); border-radius: var(--rp-radius-sm);"
                    >
                        <div v-for="item in 8" :key="item" style="padding: 10px 12px; color: var(--rp-color-text);">
                            Item {{ item }}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        `,
    }),
};
