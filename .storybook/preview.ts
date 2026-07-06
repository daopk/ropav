import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { vaporInteropPlugin } from 'vue';
import '../src/styles/base.scss';
import './preview.scss';

const defaultTheme = 'dark';

const preview: Preview = {
    initialGlobals: {
        theme: defaultTheme,
    },
    parameters: {
        backgrounds: {
            disable: true,
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        withThemeByClassName({
            themes: {
                light: '',
                dark: 'dark',
            },
            defaultTheme,
            parentSelector: 'html',
        }),
    ],
};

setup((app) => {
    app.use(vaporInteropPlugin);
});

export default preview;
