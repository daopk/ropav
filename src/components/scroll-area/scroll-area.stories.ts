import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
    },
    args: {
        type: 'hover',
        scrollbars: 'both',
        scrollbarSize: 10,
        scrollHideDelay: 600,
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
