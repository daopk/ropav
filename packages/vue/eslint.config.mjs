import baseVueConfig from "@heroui/standard/eslint/vue.mjs";
import {defineConfig} from "eslint/config";

const config = defineConfig([...baseVueConfig]);

export default config;
