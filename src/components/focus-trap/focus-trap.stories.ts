import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import Button from '../button/button.vue';
import FocusTrap from './focus-trap.vue';
import type { FocusTrapProps } from './types';

const meta = {
    title: 'Components/FocusTrap',
    component: FocusTrap as any,
    tags: ['autodocs'],
    argTypes: {
        active: { control: false },
        paused: { control: false },
        as: { control: 'text' },
        options: { control: false },
    },
    args: {
        active: true,
        paused: false,
        as: 'div',
    },
} satisfies Meta<typeof FocusTrap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    tags: ['test'],
    render: (args) => ({
        components: { Button, FocusTrap },
        setup() {
            const storyArgs = args as FocusTrapProps;
            const active = ref(storyArgs.active ?? true);
            const paused = ref(storyArgs.paused ?? false);

            return { active, args, paused };
        },
        template: `
                <div style="display: grid; gap: 24px; padding: 48px;">
                    <p style="margin: 0;">Tab and Shift+Tab stay inside while the trap is active.</p>
                    <Button
                        style="justify-self: start;"
                        variant="outline"
                        :disabled="active"
                        @click="active = true"
                    >
                        Activate trap
                    </Button>
                    <FocusTrap
                        v-bind="args"
                        v-model:active="active"
                        v-model:paused="paused"
                        style="display: flex; gap: 8px;"
                    >
                        <Button>First action</Button>
                        <Button>Second action</Button>
                        <Button variant="outline" @click="paused = !paused">
                            {{ paused ? 'Resume trap' : 'Pause trap' }}
                        </Button>
                        <Button variant="outline" @click="active = false">Deactivate</Button>
                    </FocusTrap>
                </div>
            `,
    }),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const root = canvasElement.querySelector('.rp-focus-trap');
        const activate = canvas.getByRole('button', { name: 'Activate trap' });
        const first = canvas.getByRole('button', { name: 'First action' });
        const deactivate = canvas.getByRole('button', { name: 'Deactivate' });

        await waitFor(() => expect(first).toHaveFocus());
        expect(root).toHaveAttribute('data-active', 'true');
        expect(activate).toBeDisabled();

        await userEvent.tab({ shift: true });
        expect(deactivate).toHaveFocus();

        await userEvent.tab();
        expect(first).toHaveFocus();

        await userEvent.click(deactivate);
        await waitFor(() => expect(root).not.toHaveAttribute('data-active'));
        await waitFor(() => expect(activate).toBeEnabled());

        await userEvent.click(activate);
        await waitFor(() => expect(root).toHaveAttribute('data-active', 'true'));
        await waitFor(() => expect(first).toHaveFocus());
    },
};
