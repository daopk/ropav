import js from "@eslint/js";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import {defineConfig} from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import onlyWarnPlugin from "eslint-plugin-only-warn";
import prettierPlugin from "eslint-plugin-prettier";
import sortDestructureKeysPlugin from "eslint-plugin-sort-destructure-keys";
import sortKeysFixPlugin from "eslint-plugin-sort-keys-fix";
import storybookPlugin from "eslint-plugin-storybook";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import vuePlugin from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

/** Rules every file in the repo answers to, whatever it is. */
const baseConfig = defineConfig([
  // ESLint recommended rules
  js.configs.recommended,
  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,
  // Prettier config - disables conflicting ESLint rules
  {
    rules: {
      ...prettierConfig.rules,
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
      parser: typescriptParser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
      "only-warn": onlyWarnPlugin,
      prettier: prettierPlugin,
      "sort-destructure-keys": sortDestructureKeysPlugin,
      "sort-keys-fix": sortKeysFixPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/newline-after-import": ["error", {count: 1}],
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: [
            "type",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "unknown",
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              group: "type",
              pattern: "server-only",
              position: "before",
            },
            {
              group: "unknown",
              pattern: "**/*.+(css|sass|scss)",
              patternOptions: {dot: true, nocomment: true},
              position: "after",
            },
            {
              group: "unknown",
              pattern: "{.,..}/**/*.+(css|sass|scss)",
              patternOptions: {dot: true, nocomment: true},
              position: "after",
            },
            {
              group: "internal",
              pattern: "~env",
              position: "before",
            },
            {
              group: "internal",
              pattern: "@/**",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          warnOnUnassignedImports: true,
        },
      ],
      "no-console": "warn",
      "no-unused-vars": "off",
      "object-curly-spacing": ["error", "never"],
      "padding-line-between-statements": [
        "error",
        {blankLine: "always", next: "*", prev: "directive"},
        {blankLine: "any", next: "directive", prev: "directive"},
        {blankLine: "always", next: "*", prev: ["const", "let", "var"]},
        {blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"]},
        {blankLine: "always", next: "return", prev: "*"},
      ],
      "prettier/prettier": "error",
      "sort-destructure-keys/sort-destructure-keys": [
        "error",
        {
          caseSensitive: true,
        },
      ],
      "sort-imports": [
        "error",
        {
          allowSeparatedGroups: true,
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        },
      ],
      "sort-keys": [
        "error",
        "asc",
        {
          caseSensitive: true,
          minKeys: 2,
          natural: false,
        },
      ],
      "sort-keys-fix/sort-keys-fix": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      "import/resolver": {
        node: true,
        typescript: true,
      },
    },
  },
  // Disable type checking for config files (.*.js, .*.cjs, .*.mjs)
  {
    files: [".*.js", ".*.cjs", ".*.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: [
      "**/.temp/**",
      "**/.next/**",
      "**/.swc/**",
      "**/.turbo/**",
      "**/.cache/**",
      "**/.build/**",
      "**/.vercel/**",
      "**/.DS_Store",
      "**/dist/**",
      "**/build/**",
      "**/public/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.contentlayer/",
      "**/__snapshots__/**",
      "**/pnpm-lock.yaml",
      "**/.source/**",
      "**/next-env.d.ts",
      "!.vscode/**",
      "!scripts/**",
    ],
  },
]);

/**
 * `baseConfig` plus the SFC layer. The packages that hold `.vue` files import this from
 * here rather than re-deriving it, so the browser globals and the SFC rules stay in one
 * place; the repo root itself has no `.vue` file and so runs on `baseConfig` alone.
 */
export const vueConfig = defineConfig([
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
      // Object literals inside SFCs are not sorted
      "sort-keys": "off",
      "sort-keys-fix/sort-keys-fix": "off",
      // Attribute ordering, alphabetical like the import order above
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

const config = defineConfig([
  {
    ignores: [
      // Build outputs
      "**/.temp",
      "**/.next",
      "**/.swc",
      "**/.turbo",
      "**/.cache",
      "**/.build",
      "**/.vercel",
      "**/dist",
      "**/build",
      "**/storybook-static",
      "**/.rollup.cache",
      "**/.rollup.cache/**",
      // Dependencies
      "**/node_modules/",
      "**/public/*",
      // Generated files
      "pnpm-lock.yaml",
      "**/.contentlayer/",
      "**/.source/**",
      // Test coverage
      "**/coverage",
      "**/__snapshots__",
      // OS files
      "**/.DS_Store",
      // Exceptions - files we want to lint
      "!public/manifest.json",
      "!.vscode",
      "!scripts",
      "!.*.js",
      "!.*.cjs",
      "!.*.mjs",
      "!.*.ts",
      "!contentlayer.config.ts",
    ],
  },
  ...baseConfig,
]);

export default config;
