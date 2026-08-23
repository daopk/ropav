// The stylesheet this package ships, compiled by `@tailwindcss/vite`, so browser tests
// assert against what a consumer installs - `@ropav/styles` plus the rules carried here
// on top of it. Without it a collapsed panel would only look collapsed because of
// `hidden`, and axe would judge contrast on unstyled markup.
import "@/styles.css";
