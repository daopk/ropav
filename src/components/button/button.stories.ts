import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconArrowRight from '~icons/lucide/arrow-right';
import IconPlus from '~icons/lucide/plus';
import Button from './button.vue';
import './button.stories.scss';

const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;
const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const variants = ['solid', 'subtle', 'surface', 'outline', 'ghost', 'plain'] as const;

const meta = {
    title: 'Components/Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
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
        autoContrast: false,
        disabled: false,
        loading: false,
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, variants }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args">Default</Button>
                <Button v-for="variant in variants" :key="variant" v-bind="args" :variant="variant">
                    {{ variant }}
                </Button>
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, sizes }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-for="size in sizes" :key="size" v-bind="args" :size="size">
                    {{ size }}
                </Button>
            </div>
        `,
    }),
};

export const Slots: Story = {
    render: (args) => ({
        components: { Button, IconArrowRight, IconPlus },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args">
                    <template #left>
                        <IconPlus aria-hidden="true" />
                    </template>
                    Create
                </Button>
                <Button v-bind="args">
                    Continue
                    <template #right>
                        <IconArrowRight aria-hidden="true" />
                    </template>
                </Button>
                <Button v-bind="args">
                    <template #left>
                        <IconPlus aria-hidden="true" />
                    </template>
                    Add option
                    <template #right>
                        <IconArrowRight aria-hidden="true" />
                    </template>
                </Button>
            </div>
        `,
    }),
};

export const Radii: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, radii }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-for="radius in radii" :key="radius" v-bind="args" :radius="radius">
                    {{ radius }}
                </Button>
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, colors, variants }),
        template: `
            <div style="display: grid; gap: 16px;">
                <div v-for="variant in variants" :key="variant" style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <Button v-for="color in colors" :key="variant + '-' + color" v-bind="args" :variant="variant" :color="color">
                        {{ color }}
                    </Button>
                </div>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        variant: 'solid',
    },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: '<Button v-bind="args">Custom color</Button>',
    }),
};

export const States: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args" loading>Loading</Button>
                <Button v-bind="args" disabled>Disabled</Button>
            </div>
        `,
    }),
};

export const LoadingSlot: Story = {
    args: {
        color: 'blue',
        loading: true,
        variant: 'solid',
    },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div class="rp-button-story-row">
                <Button v-bind="args">
                    Saving
                    <template #loading>
                        <span class="rp-button-story-dots">
                            <span />
                            <span />
                            <span />
                        </span>
                    </template>
                </Button>
                <Button v-bind="args" variant="outline">
                    Syncing
                    <template #loading>
                        <span class="rp-button-story-dots">
                            <span />
                            <span />
                            <span />
                        </span>
                    </template>
                </Button>
            </div>
        `,
    }),
};
