import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';

const meta = {
    title: 'Contracts/Cascade layers',
    render: () => ({
        template: `
            <div>
                <div data-testid="declared-order" data-cascade-case="declared">declared</div>
                <div data-testid="reverse-load" data-cascade-case="reverse">reverse</div>
                <div data-testid="unlayered" data-cascade-case="unlayered">unlayered</div>
                <div data-testid="legacy" data-cascade-case="legacy">legacy</div>
                <div data-testid="dark-lazy" data-cascade-case="dark" data-theme="dark">dark</div>
            </div>
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadOrderMatrix: Story = {
    play: async ({ canvasElement }) => {
        const style = document.createElement('style');
        style.textContent = `
            @layer reset, ropav.tokens, ropav.components, app;
            @layer app { [data-cascade-case="declared"] { color: rgb(0, 128, 0); } }
            @layer ropav.components { [data-cascade-case="declared"] { color: rgb(0, 0, 255); } }
            @layer reset { [data-cascade-case="declared"] { color: rgb(255, 0, 0); } }

            @layer app { [data-cascade-case="reverse"] { color: rgb(0, 128, 0); } }
            @layer reset { [data-cascade-case="reverse"] { color: rgb(255, 0, 0); } }
            @layer ropav.components { [data-cascade-case="reverse"] { color: rgb(0, 0, 255); } }

            @layer ropav.components { [data-cascade-case="unlayered"] { color: rgb(0, 0, 255); } }
            [data-cascade-case="unlayered"] { color: rgb(128, 0, 128); }

            [data-cascade-case="legacy"] { color: rgb(255, 0, 0); }
            [data-cascade-case="legacy"] { color: rgb(0, 0, 255); }

            @layer ropav.tokens {
                [data-cascade-case="dark"] { --contract-color: rgb(255, 0, 0); }
                [data-cascade-case="dark"][data-theme="dark"] { --contract-color: rgb(0, 128, 0); }
            }
            @layer ropav.components {
                [data-cascade-case="dark"] { color: var(--contract-color); }
            }
        `;
        document.head.append(style);

        try {
            const canvas = within(canvasElement);
            await expect(canvas.getByTestId('declared-order')).toHaveStyle({
                color: 'rgb(0, 128, 0)',
            });
            await expect(canvas.getByTestId('reverse-load')).toHaveStyle({
                color: 'rgb(0, 128, 0)',
            });
            await expect(canvas.getByTestId('unlayered')).toHaveStyle({
                color: 'rgb(128, 0, 128)',
            });
            await expect(canvas.getByTestId('legacy')).toHaveStyle({
                color: 'rgb(0, 0, 255)',
            });
            await expect(canvas.getByTestId('dark-lazy')).toHaveStyle({
                color: 'rgb(0, 128, 0)',
            });
        } finally {
            style.remove();
        }
    },
};
