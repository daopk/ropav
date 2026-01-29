import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite';
import { vaporInteropPlugin } from 'vue';
import '@fontsource-variable/inter';
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
};


setup((app) => {
  app.use(vaporInteropPlugin)
})

export default preview;