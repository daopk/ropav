import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";

import TeleportHost from "./teleport-host.vue";

/**
 * Every overlay renders its content outside the tree it was declared in, which puts it
 * outside the container `renderVapor` mounts into. These cover the seam itself, so a suite
 * that cannot find an overlay knows the harness is not the reason.
 */
describe("renderVapor", () => {
  it("does not reach teleported content through the container queries", () => {
    const {container, queryByRole, unmount} = renderVapor(TeleportHost, {props: {isOpen: true}});

    expect(container.querySelector('[data-slot="host"]')).not.toBeNull();
    expect(queryByRole("dialog")).toBeNull();

    unmount();
  });

  it("reaches teleported content through the document-wide queries", () => {
    const {screen, unmount} = renderVapor(TeleportHost, {props: {isOpen: true}});

    expect(screen.getByRole("dialog")).toHaveTextContent("Overlay content");

    unmount();
  });

  it("removes teleported content on unmount", () => {
    const {screen, unmount} = renderVapor(TeleportHost, {props: {isOpen: true}});

    expect(screen.queryByRole("dialog")).not.toBeNull();

    unmount();

    // Leaked overlay content would be found by the next suite's document-wide query, which
    // is the kind of cross-test bleed that only shows up as an unrelated failure later.
    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull();
  });

  it("exposes the element the document-wide queries are scoped to", () => {
    const {baseElement, unmount} = renderVapor(TeleportHost);

    expect(baseElement).toBe(document.body);

    unmount();
  });
});
