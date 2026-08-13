import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { vaporInteropPlugin } from 'vue';
import '../src/styles/base.scss';
import './preview.scss';

const defaultTheme = 'dark';

const preview: Preview = {
    initialGlobals: {
        theme: defaultTheme,
        a11y: {
            manual: true,
        },
    },
    parameters: {
        a11y: {
            test: 'error',
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
        options: {
            storySort: {
                method: 'alphabetical',
                locales: 'en-US',
                order: [
                    'Foundations',
                    'Components',
                    [
                        'Actions',
                        'Data Display',
                        'Feedback',
                        'Forms',
                        'Layout',
                        'Navigation',
                        'Overlays',
                    ],
                    'Utilities',
                    'Contracts',
                ],
            },
        },
    },
    decorators: [
        withThemeByDataAttribute({
            attributeName: 'data-scheme',
            themes: {
                light: 'light',
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
