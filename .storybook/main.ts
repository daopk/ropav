import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-themes',
        '@storybook/addon-vitest',
        'storybook-addon-pseudo-states',
    ],
    framework: '@storybook/vue3-vite',
    viteFinal: async (viteConfig) => ({
        ...viteConfig,
        plugins: viteConfig.plugins?.filter(
            (plugin) =>
                !plugin ||
                typeof plugin !== 'object' ||
                !('name' in plugin) ||
                plugin.name !== 'unplugin-dts',
        ),
    }),
};
export default config;
