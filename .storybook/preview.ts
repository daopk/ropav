import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { vaporInteropPlugin } from 'vue';
import '../src/styles/base.scss';

const preview: Preview = {
  parameters: {
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
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
};

setup((app) => {
  app.use(vaporInteropPlugin)
})

export default preview;