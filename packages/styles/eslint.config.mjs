import {defineConfig} from "eslint/config";

import baseConfig from "../../eslint.config.mjs";

const config = defineConfig([...baseConfig]);

export default config;
