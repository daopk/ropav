import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from './button.vue';

const colors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta = {
    title: 'Components/Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: [undefined, 'solid', 'ghost'],
        },
        color: {
            control: 'select',
            options: [undefined, ...colors],
        },
        size: {
            control: 'select',
            options: [undefined, ...sizes],
        },
        type: {
            control: 'select',
            options: ['button', 'submit', 'reset'],
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        disabled: false,
        loading: false,
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args }),
        template: `
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                <Button v-bind="args">Default</Button>
                <Button v-bind="args" variant="solid">Solid</Button>
                <Button v-bind="args" variant="ghost">Ghost</Button>
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

export const Colors: Story = {
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, colors }),
        template: `
            <div style="display: grid; gap: 16px;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <Button v-for="color in colors" :key="'outline-' + color" v-bind="args" :color="color">
                        {{ color }}
                    </Button>
                </div>
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <Button v-for="color in colors" :key="'solid-' + color" v-bind="args" variant="solid" :color="color">
                        {{ color }}
                    </Button>
                </div>
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
                    <Button v-for="color in colors" :key="'ghost-' + color" v-bind="args" variant="ghost" :color="color">
                        {{ color }}
                    </Button>
                </div>
            </div>
        `,
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
