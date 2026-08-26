// Augments `vitest/browser` with the provider-specific shapes - notably `CDPSession`, which is
// an empty interface until a provider fills it in, leaving `cdp().send` untyped.
/// <reference types="@vitest/browser-playwright" />
