import typescriptParser from "@typescript-eslint/parser";
import {defineConfig} from "eslint/config";
import storybookPlugin from "eslint-plugin-storybook";
import vuePlugin from "eslint-plugin-vue";
import globals from "globals";
import vueParser from "vue-eslint-parser";

import baseConfig from "./base.mjs";

const config = defineConfig([
  ...baseConfig,
  // eslint-plugin-vue flat config — brings in vue-eslint-parser for *.vue
  ...vuePlugin.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
    },
    plugins: {
      storybook: storybookPlugin,
    },
    rules: {
      // Storybook recommended rules
      ...storybookPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser: typescriptParser,
        sourceType: "module",
      },
    },
    rules: {
      // Object literals inside SFCs are not sorted (mirrors eslint/react.mjs)
      "sort-keys": "off",
      "sort-keys-fix/sort-keys-fix": "off",
      // Attribute ordering mirrors `react/jsx-sort-props` on the React side
      "vue/attributes-order": ["error", {alphabetical: true}],
      // Every SFC is authored as `<script setup lang="ts">`
      "vue/block-lang": ["error", {script: {lang: "ts"}}],
      "vue/component-api-style": ["error", ["script-setup"]],
      // Formatting rules that fight prettier
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      // Component files are named after the part they render (card.vue, chip.vue)
      "vue/multi-word-component-names": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },
]);

export default config;
