import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconPlus from '~icons/lucide/plus';
import IconRefreshCw from '~icons/lucide/refresh-cw';
import IconSearch from '~icons/lucide/search';
import IconSettings from '~icons/lucide/settings';
import IconTrash from '~icons/lucide/trash-2';
import IconButton from './icon-button.vue';

const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;
const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

const meta = {
    title: 'Components/IconButton',
    component: IconButton as any,
    tags: ['autodocs'],
    argTypes: {
        ariaLabel: { control: 'text' },
        variant: {
            control: 'select',
            options: [undefined, ...variants],
        },
        color: {
            control: 'text',
        },
        autoContrast: { control: 'boolean' },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        radius: {
            control: 'select',
            options: [undefined, ...radii],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        ariaLabel: 'Search',
        autoContrast: false,
        disabled: false,
        loading: false,
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
    render: (args) => ({
        components: { IconButton, IconSearch },
        setup: () => ({ args, variants }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <IconButton v-bind="args" aria-label="Default">
                    <IconSearch aria-hidden="true" />
                </IconButton>
                <IconButton v-for="variant in variants" :key="variant" v-bind="args" :aria-label="variant" :variant="variant">
                    <IconSearch aria-hidden="true" />
                </IconButton>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { IconButton, IconSearch },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <IconButton v-for="size in sizes" :key="size" v-bind="args" :aria-label="size" :size="size">
                    <IconSearch aria-hidden="true" />
                </IconButton>
            </div>
        `,
    }),
};

export const Icons: Story = {
    render: (args) => ({
        components: { IconButton, IconPlus, IconSearch, IconSettings, IconTrash },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <IconButton v-bind="args" aria-label="Create">
                    <IconPlus aria-hidden="true" />
                </IconButton>
                <IconButton v-bind="args" aria-label="Search">
                    <IconSearch aria-hidden="true" />
                </IconButton>
                <IconButton v-bind="args" aria-label="Settings">
                    <IconSettings aria-hidden="true" />
                </IconButton>
                <IconButton v-bind="args" aria-label="Delete" color="red">
                    <IconTrash aria-hidden="true" />
                </IconButton>
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { IconButton, IconSearch },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <IconButton v-for="radius in radii" :key="radius" v-bind="args" :aria-label="radius" :radius="radius">
                    <IconSearch aria-hidden="true" />
                </IconButton>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { IconButton, IconSearch },
        setup: () => ({ args, colors, variants }),
        template: `
            <div style="display: grid; gap: 16px;">
                <div v-for="variant in variants" :key="variant" style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <IconButton v-for="color in colors" :key="variant + '-' + color" v-bind="args" :aria-label="color" :variant="variant" :color="color">
                        <IconSearch aria-hidden="true" />
                    </IconButton>
                </div>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        ariaLabel: 'Search',
        color: '#ff3366',
        variant: 'solid',
    },
    render: (args) => ({
        components: { IconButton, IconSearch },
        setup: () => ({ args }),
        template: `
            <IconButton v-bind="args">
                <IconSearch aria-hidden="true" />
            </IconButton>
        `,
    }),
};

export const States: Story = {
    render: (args) => ({
        components: { IconButton, IconRefreshCw, IconSearch },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <IconButton v-bind="args" aria-label="Loading" loading>
                    <IconRefreshCw aria-hidden="true" />
                </IconButton>
                <IconButton v-bind="args" aria-label="Disabled" disabled>
                    <IconSearch aria-hidden="true" />
                </IconButton>
            </div>
        `,
    }),
};
