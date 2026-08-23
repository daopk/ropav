import {defineConfig} from "eslint/config";

import {vueConfig} from "../../eslint.config.mjs";

const config = defineConfig([...vueConfig]);

export default config;
