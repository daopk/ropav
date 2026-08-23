import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";

import { useId } from "@/composables/use-id";

import UseIdHost from "../fixtures/use-id-host.vue";

const read = (container: HTMLElement, testId: string) =>
  container.querySelector(`[data-testid='${testId}']`)?.textContent;

describe("useId", () => {
  it("renders a non-empty id inside a vapor component", () => {
    const { container, unmount } = renderVapor(UseIdHost);

    expect(read(container, "first")).toBeTruthy();

    unmount();
  });

  it("returns a distinct id per call within one component", () => {
    const { container, unmount } = renderVapor(UseIdHost);

    expect(read(container, "first")).not.toBe(read(container, "second"));

    unmount();
  });

  it("prefers the caller-supplied override", () => {
    const { container, unmount } = renderVapor(UseIdHost, { props: { idOverride: "my-own-id" } });

    expect(read(container, "first")).toBe("my-own-id");
    // The second call has no override and keeps its generated id.
    expect(read(container, "second")).not.toBe("my-own-id");

    unmount();
  });

  it("falls back to a generated id when called outside a component", () => {
    // Vue logs its own warning here; the point is that the id is never empty.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const first = useId();
    const second = useId();

    expect(first.value).not.toBe("");
    expect(first.value).not.toBe(second.value);

    warn.mockRestore();
  });
});
