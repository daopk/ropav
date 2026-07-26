import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconArchive from '~icons/lucide/archive';
import IconCopy from '~icons/lucide/copy';
import IconEdit from '~icons/lucide/edit-3';
import IconTrash from '~icons/lucide/trash-2';
import Button from '../button/button.vue';
import IconButton from '../icon-button/icon-button.vue';
import ButtonGroup from './button-group.vue';

const meta = {
    title: 'Components/ButtonGroup',
    component: ButtonGroup as any,
    tags: ['autodocs'],
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
        attached: { control: 'boolean' },
        wrap: { control: 'boolean' },
        ariaLabel: { control: 'text' },
    },
    args: {
        orientation: 'horizontal',
        attached: false,
        wrap: false,
        ariaLabel: 'Document actions',
    },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = {
    render: (args) => ({
        components: { Button, ButtonGroup },
        setup: () => ({ args }),
        template: `
            <ButtonGroup v-bind="args">
                <Button variant="solid">Save</Button>
                <Button variant="outline">Preview</Button>
                <Button variant="ghost" color="red">Delete</Button>
            </ButtonGroup>
        `,
    }),
};

export const Attached: Story = {
    args: {
        attached: true,
    },
    render: (args) => ({
        components: { Button, ButtonGroup },
        setup: () => ({ args }),
        template: `
            <ButtonGroup v-bind="args">
                <Button variant="outline">Day</Button>
                <Button variant="outline">Week</Button>
                <Button variant="outline">Month</Button>
                <Button variant="outline">Year</Button>
            </ButtonGroup>
        `,
    }),
};

export const Vertical: Story = {
    args: {
        attached: true,
        orientation: 'vertical',
    },
    render: (args) => ({
        components: { Button, ButtonGroup },
        setup: () => ({ args }),
        template: `
            <ButtonGroup v-bind="args">
                <Button variant="outline">Duplicate</Button>
                <Button variant="outline">Archive</Button>
                <Button variant="outline" color="red">Delete</Button>
            </ButtonGroup>
        `,
    }),
};

export const IconActions: Story = {
    args: {
        attached: true,
        ariaLabel: 'Row actions',
    },
    render: (args) => ({
        components: {
            ButtonGroup,
            IconArchive,
            IconButton,
            IconCopy,
            IconEdit,
            IconTrash,
        },
        setup: () => ({ args }),
        template: `
            <ButtonGroup v-bind="args">
                <IconButton aria-label="Edit" variant="outline">
                    <IconEdit />
                </IconButton>
                <IconButton aria-label="Copy" variant="outline">
                    <IconCopy />
                </IconButton>
                <IconButton aria-label="Archive" variant="outline">
                    <IconArchive />
                </IconButton>
                <IconButton aria-label="Delete" variant="outline" color="red">
                    <IconTrash />
                </IconButton>
            </ButtonGroup>
        `,
    }),
};
