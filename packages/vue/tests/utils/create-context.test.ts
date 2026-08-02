import {describe, expect, it, vi} from "vitest";

import ContextOptionalConsumer from "../fixtures/context-optional-consumer.vue";
import ContextProvider from "../fixtures/context-provider.vue";
import {renderVapor} from "../helpers";

describe("createContext", () => {
  it("exposes the provided value to a descendant", () => {
    const {container, unmount} = renderVapor(ContextProvider, {props: {greeting: "hello"}});

    expect(container.querySelector("[data-testid='greeting']")?.textContent).toBe("hello");

    unmount();
  });

  it("falls back to the default value when not strict", () => {
    const {container, unmount} = renderVapor(ContextOptionalConsumer);

    expect(container.querySelector("[data-testid='greeting']")?.textContent).toBe("fallback");

    unmount();
  });

  it("throws when a strict context has no provider above it", async () => {
    // The error surfaces through Vue's warn handler, so silence the noise it logs.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const {default: ContextConsumer} = await import("../fixtures/context-consumer.vue");

    expect(() => renderVapor(ContextConsumer)).toThrow(
      /`GreetingContext` was consumed outside of its provider component\./,
    );

    warn.mockRestore();
  });
});
