import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Avatar from './avatar.vue';

const meta = {
    title: 'Components/Avatar',
    component: Avatar as any,
    tags: ['autodocs'],
    argTypes: {
        src: { control: 'text' },
        alt: { control: 'text' },
        name: { control: 'text' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        shape: {
            control: 'select',
            options: ['circle', 'square'],
        },
    },
    args: {
        size: 'md',
        shape: 'circle',
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
    args: {
        src: 'https://i.pravatar.cc/150?img=12',
        alt: 'User avatar',
    },
};

export const WithInitials: Story = {
    args: {
        name: 'John Doe',
    },
};

export const SingleName: Story = {
    args: {
        name: 'Alice',
    },
};

export const Fallback: Story = {
    args: {},
};

export const Sizes: Story = {
    render: () => ({
        components: { Avatar },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Avatar size="sm" name="S" />
                <Avatar size="md" name="M D" />
                <Avatar size="lg" name="Large" />
            </div>
        `,
    }),
};

export const Shapes: Story = {
    render: () => ({
        components: { Avatar },
        template: `
            <div style="display: flex; gap: 12px; align-items: center;">
                <Avatar shape="circle" name="Circle" src="https://i.pravatar.cc/150?img=5" />
                <Avatar shape="square" name="Square" src="https://i.pravatar.cc/150?img=5" />
            </div>
        `,
    }),
};

export const BrokenImage: Story = {
    args: {
        src: 'https://broken-url.example/nope.jpg',
        name: 'Fallback User',
    },
};
