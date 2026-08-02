import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconBold from '~icons/lucide/bold';
import IconItalic from '~icons/lucide/italic';
import IconRedo from '~icons/lucide/redo-2';
import IconUnderline from '~icons/lucide/underline';
import IconUndo from '~icons/lucide/undo-2';
import { ref } from 'vue';
import Button from '../button/button.vue';
import ButtonGroup from '../button-group/button-group.vue';
import IconButton from '../icon-button/icon-button.vue';
import Toolbar from './toolbar.vue';

const meta = {
    title: 'Components/Actions/Toolbar',
    component: Toolbar as any,
    tags: ['autodocs'],
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
        ariaLabel: { control: 'text' },
    },
    args: {
        orientation: 'horizontal',
        ariaLabel: 'Text formatting',
    },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Formatting: Story = {
    render: (args) => ({
        components: {
            ButtonGroup,
            IconBold,
            IconButton,
            IconItalic,
            IconRedo,
            IconUnderline,
            IconUndo,
            Toolbar,
        },
        setup() {
            const bold = ref(false);
            const italic = ref(false);
            const underline = ref(false);
            return { args, bold, italic, underline };
        },
        template: `
            <Toolbar v-bind="args">
                <ButtonGroup attached aria-label="History">
                    <IconButton aria-label="Undo" variant="outline">
                        <IconUndo />
                    </IconButton>
                    <IconButton aria-label="Redo" variant="outline" disabled>
                        <IconRedo />
                    </IconButton>
                </ButtonGroup>

                <ButtonGroup attached aria-label="Inline formatting">
                    <IconButton
                        aria-label="Bold"
                        variant="outline"
                        :aria-pressed="bold"
                        @click="bold = !bold"
                    >
                        <IconBold />
                    </IconButton>
                    <IconButton
                        aria-label="Italic"
                        variant="outline"
                        :aria-pressed="italic"
                        @click="italic = !italic"
                    >
                        <IconItalic />
                    </IconButton>
                    <IconButton
                        aria-label="Underline"
                        variant="outline"
                        :aria-pressed="underline"
                        @click="underline = !underline"
                    >
                        <IconUnderline />
                    </IconButton>
                </ButtonGroup>
            </Toolbar>
        `,
    }),
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
        ariaLabel: 'Document actions',
    },
    render: (args) => ({
        components: { Button, Toolbar },
        setup: () => ({ args }),
        template: `
            <Toolbar v-bind="args" style="width: 10rem;">
                <Button variant="outline">Save</Button>
                <Button variant="outline">Preview</Button>
                <Button variant="outline">Publish</Button>
            </Toolbar>
        `,
    }),
};
