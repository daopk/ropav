import {renderInterop} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {defineComponent, h} from "vue";

import {
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertRoot,
  AlertTitle,
} from "@/components/alert";
import {useSurfaceContext} from "@/components/surface";

const SurfaceReader = defineComponent({
  name: "AlertSurfaceReader",
  setup: () => {
    const surface = useSurfaceContext();

    return () => h("span", {"data-surface": surface?.variant.value, "data-testid": "surface"});
  },
});

const render = (indicator?: () => unknown) =>
  renderInterop(AlertRoot, {
    props: {status: "warning"},
    slots: {
      default: () => [
        h(AlertIndicator, null, indicator ? {default: indicator} : undefined),
        h(AlertContent, null, {
          default: () => [
            h(AlertTitle, null, {default: () => "Storage almost full"}),
            h(AlertDescription, null, {default: () => "Delete unused files."}),
            h(SurfaceReader),
          ],
        }),
      ],
    },
  });

describe("Alert under a vdom host", () => {
  it("styles compound parts written in and forwarded from the host", () => {
    const {container, unmount} = render();

    expect(container.querySelector('[data-slot="alert-root"]')).toHaveClass(
      "alert",
      "alert--warning",
    );
    expect(container.querySelector('[data-slot="alert-indicator"]')).toHaveClass(
      "alert__indicator",
    );
    expect(container.querySelector('[data-slot="alert-title"]')).toHaveClass("alert__title");
    expect(container.querySelector('[data-slot="alert-description"]')).toHaveClass(
      "alert__description",
    );

    unmount();
  });

  it("publishes the alert's default surface to host content", () => {
    const {container, unmount} = render();

    expect(container.querySelector('[data-testid="surface"]')).toHaveAttribute(
      "data-surface",
      "default",
    );

    unmount();
  });

  it("keeps a custom indicator from the host and suppresses the fallback icon", () => {
    const {container, unmount} = render(() => h("span", {"data-testid": "custom"}, "!"));

    expect(container.querySelector('[data-testid="custom"]')).toHaveTextContent("!");
    expect(container.querySelector('[data-slot="alert-default-icon"]')).toBeNull();

    unmount();
  });
});
