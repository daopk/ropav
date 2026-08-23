import path from "path";

import preset from "@heroui/standard/prettier/base.mjs";

/** @type {import("prettier").Config} */
const config = {
  ...preset,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindAttributes: ["className", "classNames"],
  tailwindFunctions: ["tv", "clsx", "cn"],
  tailwindStylesheet: path.resolve(
    import.meta.dirname,
    "./packages/storybook-vue/styles/globals.css",
  ),
};

export default config;
