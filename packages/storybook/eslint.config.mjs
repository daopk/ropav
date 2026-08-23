import {defineConfig} from "eslint/config";

import {vueConfig} from "../../eslint.config.mjs";

const config = defineConfig([
  ...vueConfig,
  {
    rules: {
      // Storybook config objects follow documented shapes — `globalTypes` entries read
      // name, description, defaultValue, toolbar — in that order. Alphabetising them
      // would only make them harder to check against the docs.
      "sort-keys": "off",
      "sort-keys-fix/sort-keys-fix": "off",
    },
  },
  {
    ignores: ["storybook-static/**", "storybook-static"],
  },
]);

export default config;
