import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-themes', '@storybook/addon-vitest'],
    framework: '@storybook/vue3-vite',
};
export default config;
