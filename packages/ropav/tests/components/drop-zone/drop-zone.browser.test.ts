import { renderVapor } from "@ropav/testing/helpers/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { parkPointer } from "../../harness/park-pointer";
import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

/**
 * The jsdom suite drives this zone with dispatched events, which proves the handlers run but not
 * that a real pointer or a real Tab reaches them: in vapor a re-render re-attaches every listener
 * that arrived through `v-bind`, and hovering the zone is itself a re-render. These cases go
 * through the browser's own input instead, and park the pointer first so the crossing onto the
 * zone actually happens. They also read the colours the stylesheet paints, which jsdom has no
 * cascade to answer for.
 *
 * Two things deliberately absent. The picker is never really opened — a file dialog would leave
 * the run waiting on the platform — so what is asserted is that the press reaches the input. And
 * a drop carrying real files is not reachable at all: a constructed `DataTransfer` reports
 * `webkitGetAsEntry() === null` for anything added to it, so `readFromDataTransfer` skips the
 * entry. That limit is pinned in `tests/utils/dnd-data-transfer.browser.test.ts`; the last case
 * here pins what this component does with the empty read that results.
 */
const renderDropZone = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const zoneIn = (container: HTMLElement) =>
  container.querySelector('[data-slot="drop-zone"]') as HTMLElement;

const inputIn = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

/**
 * A transfer carrying one file entry per mime type given.
 *
 * `effectAllowed` is shadowed rather than assigned: outside a real `dragstart` the setter is
 * ignored and the property stays `"none"`, which every allowed operation is then masked down to,
 * so the zone would refuse a drag the test means to be legitimate. jsdom's polyfill lets the
 * assignment through, which is why only the browser suite needs this.
 */
const fileTransfer = (mimeTypes: string[]): DataTransfer => {
  const dataTransfer = new DataTransfer();

  for (const [index, type] of mimeTypes.entries()) {
    dataTransfer.items.add(new File(["x"], `file-${index}`, { type }));
  }

  Object.defineProperty(dataTransfer, "effectAllowed", { configurable: true, value: "all" });

  return dataTransfer;
};

const dispatchDrag = (node: HTMLElement, type: string, dataTransfer: DataTransfer) =>
  node.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));

const borderOf = (node: HTMLElement) => getComputedStyle(node).borderTopColor;

describe("DropZone (browser)", () => {
  beforeEach(parkPointer);

  it("reaches the file input from a press by the pointer itself", async () => {
    const { container, unmount } = renderDropZone();
    const click = vi.spyOn(inputIn(container), "click").mockImplementation(() => {});

    await userEvent.click(zoneIn(container));

    expect(click).toHaveBeenCalledOnce();
    unmount();
  });

  it("puts a disabled zone out of the pointer's reach entirely", () => {
    const { container, unmount } = renderDropZone({ isDisabled: true });

    // The press never arrives rather than arriving and being turned away, so there is nothing
    // for a click case to assert here — this is the rule that makes one unnecessary.
    expect(getComputedStyle(zoneIn(container)).pointerEvents).toBe("none");
    expect(inputIn(container)).toBeDisabled();
    unmount();
  });

  it("shows the ring for the input a keyboard lands on", async () => {
    const { container, unmount } = renderDropZone();
    const zone = zoneIn(container);

    expect(zone).not.toHaveAttribute("data-focus-visible");

    await userEvent.tab();
    await nextTick();

    expect(inputIn(container)).toHaveFocus();
    expect(zone).toHaveAttribute("data-focus-visible", "true");
    unmount();
  });

  it("drops the ring again once focus leaves", async () => {
    const { container, unmount } = renderDropZone();
    const zone = zoneIn(container);

    await userEvent.tab();
    await nextTick();
    inputIn(container).blur();
    await nextTick();

    expect(zone).not.toHaveAttribute("data-focus-visible");
    unmount();
  });

  it("hovers from the pointer crossing onto it", async () => {
    const { container, unmount } = renderDropZone();
    const zone = zoneIn(container);

    await userEvent.hover(zone);
    await nextTick();

    expect(zone).toHaveAttribute("data-hovered", "true");
    unmount();
  });

  describe("the colours the three states settle on", () => {
    it("moves the edge off its resting colour for a drag it would take", async () => {
      const { container, unmount } = renderDropZone();
      const zone = zoneIn(container);
      const resting = borderOf(zone);

      dispatchDrag(zone, "dragenter", fileTransfer(["image/png"]));
      await nextTick();
      await settled(zone);

      expect(zone).toHaveAttribute("data-status", "accept");
      expect(borderOf(zone)).not.toBe(resting);
      unmount();
    });

    it("settles a refusal on a colour of its own, not the accepting one", async () => {
      const accepting = renderDropZone();
      const refusing = renderDropZone({ accept: "image/*" });
      const acceptingZone = zoneIn(accepting.container);
      const refusingZone = zoneIn(refusing.container);

      dispatchDrag(acceptingZone, "dragenter", fileTransfer(["image/png"]));
      dispatchDrag(refusingZone, "dragenter", fileTransfer(["text/plain"]));
      await nextTick();
      await settled(acceptingZone);
      await settled(refusingZone);

      expect(refusingZone).toHaveAttribute("data-status", "reject");
      expect(borderOf(refusingZone)).not.toBe(borderOf(acceptingZone));
      accepting.unmount();
      refusing.unmount();
    });
  });

  it("stays silent for a drop whose files the platform never backed", async () => {
    const onSelect = vi.fn();
    const { container, unmount } = renderDropZone({ onSelect });
    const zone = zoneIn(container);
    const transfer = fileTransfer(["image/png"]);

    dispatchDrag(zone, "dragenter", transfer);
    dispatchDrag(zone, "drop", transfer);
    await nextTick();

    expect(onSelect).not.toHaveBeenCalled();
    unmount();
  });
});
