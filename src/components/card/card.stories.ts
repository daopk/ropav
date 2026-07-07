import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import Button from '../button/button.vue';
import Card from './card.vue';

const paddings = ['none', 'sm', 'md', 'lg'] as const;
const radii = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
const layers = ['base', 'surface', 'raised'] as const;

const borderExamples = [
    { label: 'border on', border: true },
    { label: 'border off', border: false },
];

const headerBorderExamples = [
    { label: 'header border off', headerBorder: false },
    { label: 'header border on', headerBorder: true },
];

const footerBorderExamples = [
    { label: 'footer border off', footerBorder: false },
    { label: 'footer border on', footerBorder: true },
];

const radiusExamples: Array<{ label: string; radius?: (typeof radii)[number] }> = [
    { label: 'none', radius: 'none' },
    { label: 'xs', radius: 'xs' },
    { label: 'sm (default)', radius: 'sm' },
    { label: 'md', radius: 'md' },
    { label: 'lg', radius: 'lg' },
    { label: 'xl', radius: 'xl' },
];

const paddingExamples: Array<{ label: string; padding?: (typeof paddings)[number] }> = [
    { label: 'none', padding: 'none' },
    { label: 'sm', padding: 'sm' },
    { label: 'md (default)', padding: 'md' },
    { label: 'lg', padding: 'lg' },
];

const meta = {
    title: 'Components/Card',
    component: Card as any,
    tags: ['autodocs'],
    argTypes: {
        layer: {
            control: 'select',
            options: [undefined, ...layers],
        },
        padding: {
            control: 'select',
            options: [undefined, ...paddings],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        border: { control: 'boolean' },
        headerBorder: { control: 'boolean' },
        footerBorder: { control: 'boolean' },
        title: { control: 'text' },
        description: { control: 'text' },
        bodyClass: { control: 'text' },
    },
    args: {
        border: true,
        headerBorder: false,
        footerBorder: false,
        title: 'Project health',
        description: 'Last updated just now',
        bodyClass: '',
    },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({ args }),
        template: `
            <Card v-bind="args" style="max-width: 360px;">
                <div style="display: grid; gap: 8px;">
                    <strong>92% complete</strong>
                    <span style="color: var(--rp-color-text-secondary);">All critical tasks are on track for the next milestone.</span>
                </div>
            </Card>
        `,
    }),
};

export const Layers: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({ args, layers }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <Card
                    v-for="layer in layers"
                    :key="layer"
                    v-bind="args"
                    :layer="layer"
                    :title="layer"
                    description="Surface layer"
                >
                    <span>Card content</span>
                </Card>
            </div>
        `,
    }),
};

export const Border: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({
            borderArgs: computed(() => ({
                ...args,
                title: '',
                description: '',
            })),
            borderExamples,
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <Card
                    v-for="example in borderExamples"
                    :key="example.label"
                    v-bind="borderArgs"
                    :border="example.border"
                    style="min-height: 120px;"
                >
                    <div style="display: grid; height: 100%; place-items: center; color: var(--rp-color-text); font-weight: var(--rp-font-weight-semibold);">
                        {{ example.label }}
                    </div>
                </Card>
            </div>
        `,
    }),
};

export const HeaderBorder: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({
            headerBorderExamples,
            headerBorderArgs: (example: (typeof headerBorderExamples)[number]) => ({
                ...args,
                headerBorder: example.headerBorder,
                title: example.label,
                description: 'Optional header divider',
            }),
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                <Card
                    v-for="example in headerBorderExamples"
                    :key="example.label"
                    v-bind="headerBorderArgs(example)"
                    style="min-height: 160px;"
                >
                    <span>Card content</span>
                </Card>
            </div>
        `,
    }),
};

export const FooterBorder: Story = {
    render: (args) => ({
        components: { Button, Card },
        setup: () => ({
            footerBorderExamples,
            footerBorderArgs: (example: (typeof footerBorderExamples)[number]) => ({
                ...args,
                footerBorder: example.footerBorder,
                title: example.label,
                description: 'Optional footer divider',
            }),
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                <Card
                    v-for="example in footerBorderExamples"
                    :key="example.label"
                    v-bind="footerBorderArgs(example)"
                    style="min-height: 160px;"
                >
                    <span>Card content</span>

                    <template #footer>
                        <Button type="button" size="sm" variant="outline">Review</Button>
                    </template>
                </Card>
            </div>
        `,
    }),
};

export const HeaderSlot: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({ args }),
        template: `
            <Card v-bind="args" style="max-width: 380px;">
                <template #header>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <div style="display: grid; gap: 4px;">
                            <strong style="color: var(--rp-color-text); font-size: var(--rp-font-size-lg); line-height: var(--rp-line-height-tight);">
                                Deployment
                            </strong>
                            <span style="color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm);">
                                Production status
                            </span>
                        </div>
                        <span style="color: var(--rp-color-success-fg); font-weight: var(--rp-font-weight-semibold);">
                            Live
                        </span>
                    </div>
                </template>

                <span>All services are healthy and responding normally.</span>
            </Card>
        `,
    }),
};

export const FooterSlot: Story = {
    render: (args) => ({
        components: { Button, Card },
        setup: () => ({ args }),
        template: `
            <Card v-bind="args" style="max-width: 380px;">
                <span>All services are healthy and responding normally.</span>

                <template #footer>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <Button type="button" size="sm" variant="ghost">Cancel</Button>
                        <Button type="button" size="sm" variant="solid" color="primary">Deploy</Button>
                    </div>
                </template>
            </Card>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({
            radiusArgs: computed(() => ({
                ...args,
                title: '',
                description: '',
            })),
            radiusExamples,
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <Card
                    v-for="example in radiusExamples"
                    :key="example.label"
                    v-bind="radiusArgs"
                    :radius="example.radius"
                    style="min-height: 120px;"
                >
                    <div style="display: grid; height: 100%; place-items: center; color: var(--rp-color-text); font-weight: var(--rp-font-weight-semibold);">
                        {{ example.label }}
                    </div>
                </Card>
            </div>
        `,
    }),
};

export const Padding: Story = {
    render: (args) => ({
        components: { Card },
        setup: () => ({
            paddingArgs: computed(() => ({
                ...args,
                title: '',
                description: '',
            })),
            paddingExamples,
        }),
        template: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                <Card
                    v-for="example in paddingExamples"
                    :key="example.label"
                    v-bind="paddingArgs"
                    :padding="example.padding"
                    style="min-height: 160px;"
                >
                    <div style="display: grid; height: 100%; min-height: 96px; place-items: center; background: var(--rp-color-primary-subtle-bg); color: var(--rp-color-primary-fg); font-weight: var(--rp-font-weight-semibold);">
                        {{ example.label }}
                    </div>
                </Card>
            </div>
        `,
    }),
};
