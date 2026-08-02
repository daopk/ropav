import baseVueConfig from "@heroui/standard/eslint/vue.mjs";
import {defineConfig} from "eslint/config";

const config = defineConfig([
  ...baseVueConfig,
  {
    rules: {
      // Storybook config objects follow documented shapes — `globalTypes` entries read
      // name, description, defaultValue, toolbar — and mirror their React counterparts
      // key for key. Alphabetising them would only make both harder to compare.
      // `eslint/react.mjs` already disables this for `@heroui/storybook`.
      "sort-keys": "off",
      "sort-keys-fix/sort-keys-fix": "off",
    },
  },
  {
    ignores: ["storybook-static/**", "storybook-static"],
  },
]);

export default config;
