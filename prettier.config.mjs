import path from "path";

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: false,
  endOfLine: "auto",
  jsxSingleQuote: false,
  plugins: ["prettier-plugin-tailwindcss"],
  printWidth: 100,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  tailwindAttributes: ["className", "classNames"],
  tailwindFunctions: ["tv", "clsx", "cn"],
  tailwindStylesheet: path.resolve(import.meta.dirname, "./packages/storybook/styles/globals.css"),
  trailingComma: "all",
  useTabs: false,
};

export default config;
