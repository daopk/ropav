import "@testing-library/jest-dom/vitest";

// No renderer plugin import here. `vitest-browser-vue` and `@testing-library/vue` both
// build on Vue Test Utils, which does not support Vapor, so browser tests mount through
// `renderVapor` from `@ropav/testing/helpers/vue` exactly like the jsdom ones.
