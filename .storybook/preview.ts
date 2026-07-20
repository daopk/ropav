import type { Decorator, Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { vaporInteropPlugin } from 'vue';
import '../src/styles/base.scss';
import './preview.scss';

const defaultTheme = 'dark';

const withSynchronousThemeClass: Decorator = (story, { globals }) => {
    document.documentElement.classList.toggle('dark', (globals.theme || defaultTheme) === 'dark');

    return story();
};

const preview: Preview = {
    initialGlobals: {
        theme: defaultTheme,
    },
    parameters: {
        a11y: {
            test: 'todo',
        },
        backgrounds: {
            disable: true,
        },
        controls: {
            matchers: {
                color: /(^color$|(?:background|foreground|border|text)color$)/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        withSynchronousThemeClass,
        withThemeByClassName({
            themes: {
                light: '',
                dark: 'dark',
            },
            defaultTheme,
        }),
    ],
};

setup((app) => {
    app.use(vaporInteropPlugin);
});

export default preview;
