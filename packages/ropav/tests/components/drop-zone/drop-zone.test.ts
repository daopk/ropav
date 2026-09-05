import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import {
  isDragRefused,
  isFileAccepted,
  parseAccept,
} from "@/components/drop-zone/drop-zone.accept";
import { DataTransferDragTypes } from "@/utils/dnd-data-transfer";

import Fixture from "./fixtures.vue";

const renderDropZone = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const zoneIn = (container: HTMLElement) =>
  container.querySelector('[data-slot="drop-zone"]') as HTMLElement;

const inputIn = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

/** A transfer carrying one file entry per mime type given. */
const fileTransfer = (mimeTypes: string[]): DataTransfer => {
  const dataTransfer = new DataTransfer();

  for (const [index, type] of mimeTypes.entries()) {
    dataTransfer.items.add(new File(["x"], `file-${index}`, { type }));
  }

  dataTransfer.effectAllowed = "all";

  return dataTransfer;
};

/**
 * A drag event over the zone.
 *
 * Dispatched rather than handed to the handler directly, so the listeners the template wired up
 * are the ones under test.
 */
const dispatchDrag = (node: HTMLElement, type: string, dataTransfer: DataTransfer) => {
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });

  node.dispatchEvent(event);

  return event;
};

/** Puts files on the input the way a picker would, then announces them. */
const pick = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, "files", { configurable: true, value: files });
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const unmounts: (() => void)[] = [];

afterEach(() => {
  while (unmounts.length) unmounts.pop()?.();
  document.body.innerHTML = "";
});

const mount = (props: Record<string, unknown> = {}) => {
  const rendered = renderDropZone(props);

  unmounts.push(rendered.unmount);

  return rendered;
};

describe("DropZone", () => {
  describe("structure", () => {
    it("renders every part with its data slot", () => {
      const { container } = mount();

      expect(zoneIn(container).tagName).toBe("DIV");
      expect(container.querySelector('[data-slot="drop-zone-trigger"]')?.tagName).toBe("SPAN");
    });

    it("renders the BEM classes of each part", () => {
      const { container } = mount();

      expect(zoneIn(container)).toHaveClass("rp-drop-zone");
      expect(container.querySelector('[data-slot="drop-zone-trigger"]')).toHaveClass(
        "rp-drop-zone__trigger",
      );
    });

    it("forwards arbitrary attributes and merges the caller's class", () => {
      const { container } = mount({ class: "custom" });

      expect(zoneIn(container)).toHaveAttribute("data-foo", "bar");
      expect(zoneIn(container)).toHaveClass("custom");
    });

    it("keeps the region out of the tab order, leaving the file input as the stop", () => {
      const { container } = mount();

      // The drag session focuses this element itself, so it has to be programmatically
      // focusable — but a keyboard reaches the component through the input inside.
      expect(zoneIn(container)).toHaveAttribute("tabindex", "-1");
      expect(inputIn(container)).not.toHaveAttribute("tabindex");
    });
  });

  describe("the native input", () => {
    it("carries accept, multiple and the accessible name", () => {
      const { container } = mount({
        accept: "image/png,.pdf",
        ariaLabel: "Upload",
        multiple: true,
      });
      const input = inputIn(container);

      expect(input).toHaveAttribute("accept", "image/png,.pdf");
      expect(input).toHaveAttribute("multiple");
      expect(input).toHaveAttribute("aria-label", "Upload");
    });

    it("is disabled with the zone", () => {
      const { container } = mount({ isDisabled: true });

      expect(inputIn(container)).toBeDisabled();
      expect(zoneIn(container)).toHaveAttribute("data-disabled", "true");
    });

    it("keeps the caller's description alongside the drag instructions", () => {
      const { container } = mount({ ariaDescribedby: "help" });

      expect(inputIn(container).getAttribute("aria-describedby")).toContain("help");
    });
  });

  describe("opening the picker", () => {
    it("clicks the input when the zone is pressed", () => {
      const { container } = mount();
      const click = vi.spyOn(inputIn(container), "click").mockImplementation(() => {});

      zoneIn(container).click();

      expect(click).toHaveBeenCalledOnce();
    });

    it("does nothing while disabled", () => {
      const { container } = mount({ isDisabled: true });
      const click = vi.spyOn(inputIn(container), "click").mockImplementation(() => {});

      zoneIn(container).click();

      expect(click).not.toHaveBeenCalled();
    });

    it("does not reopen when the input's own click bubbles back", () => {
      const { container } = mount();
      const input = inputIn(container);
      const click = vi.spyOn(input, "click").mockImplementation(() => {
        input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      zoneIn(container).click();

      expect(click).toHaveBeenCalledOnce();
    });
  });

  describe("what a pick emits", () => {
    it("announces the chosen files", () => {
      const onSelect = vi.fn();
      const { container } = mount({ multiple: true, onSelect });

      pick(inputIn(container), [new File(["a"], "a.png", { type: "image/png" })]);

      expect(onSelect).toHaveBeenCalledWith([expect.objectContaining({ name: "a.png" })]);
    });

    it("takes only the first file when multiple is not set", () => {
      const onSelect = vi.fn();
      const { container } = mount({ onSelect });

      pick(inputIn(container), [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ]);

      expect(onSelect.mock.calls[0]?.[0]).toHaveLength(1);
    });

    it("drops a file the accept list rules out", () => {
      const onSelect = vi.fn();
      const { container } = mount({ accept: "image/*", multiple: true, onSelect });

      pick(inputIn(container), [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.txt", { type: "text/plain" }),
      ]);

      expect(onSelect).toHaveBeenCalledWith([expect.objectContaining({ name: "a.png" })]);
    });

    it("stays silent when nothing survives the accept list", () => {
      const onSelect = vi.fn();
      const { container } = mount({ accept: "image/*", onSelect });

      pick(inputIn(container), [new File(["b"], "b.txt", { type: "text/plain" })]);

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("a drag over the zone", () => {
    it("lights up for a drag it would take", async () => {
      const { container, getByTestId } = mount();
      const node = zoneIn(container);

      dispatchDrag(node, "dragenter", fileTransfer(["image/png"]));
      await nextTick();

      expect(node).toHaveAttribute("data-drop-target", "true");
      expect(node).toHaveAttribute("data-status", "accept");
      expect(getByTestId("status")).toHaveTextContent("accept");
    });

    it("says no to a drag the accept list rules out", async () => {
      const { container } = mount({ accept: "image/*" });
      const node = zoneIn(container);

      dispatchDrag(node, "dragenter", fileTransfer(["text/plain"]));
      await nextTick();

      expect(node).toHaveAttribute("data-status", "reject");
    });

    it("stays undecided about a type it cannot judge yet", async () => {
      // An `.ext` token needs a file name, which a drag never advertises.
      const { container } = mount({ accept: ".pdf" });
      const node = zoneIn(container);

      dispatchDrag(node, "dragenter", fileTransfer(["text/plain"]));
      await nextTick();

      expect(node).toHaveAttribute("data-status", "accept");
    });

    it("goes back to idle when the drag leaves", async () => {
      const { container } = mount();
      const node = zoneIn(container);

      dispatchDrag(node, "dragenter", fileTransfer(["image/png"]));
      await nextTick();
      dispatchDrag(node, "dragleave", fileTransfer(["image/png"]));
      await nextTick();

      expect(node).toHaveAttribute("data-status", "idle");
      expect(node).not.toHaveAttribute("data-drop-target");
    });

    it("ignores a drag while disabled", async () => {
      const { container } = mount({ isDisabled: true });
      const node = zoneIn(container);

      dispatchDrag(node, "dragenter", fileTransfer(["image/png"]));
      await nextTick();

      expect(node).toHaveAttribute("data-status", "idle");
    });
  });
});

describe("the accept list", () => {
  it("splits, trims and lowercases the tokens", () => {
    expect(parseAccept(" image/PNG , .PDF ,")).toEqual(["image/png", ".pdf"]);
    expect(parseAccept(undefined)).toEqual([]);
  });

  describe("judging one file", () => {
    const png = new File(["x"], "shot.PNG", { type: "image/png" });

    it("accepts everything when the list is empty", () => {
      expect(isFileAccepted(png, [])).toBe(true);
    });

    it("matches a mime type exactly and by wildcard", () => {
      expect(isFileAccepted(png, ["image/png"])).toBe(true);
      expect(isFileAccepted(png, ["image/*"])).toBe(true);
      expect(isFileAccepted(png, ["text/*"])).toBe(false);
    });

    it("matches an extension against the name, whatever its case", () => {
      expect(isFileAccepted(png, [".png"])).toBe(true);
      expect(isFileAccepted(png, [".pdf"])).toBe(false);
    });
  });

  describe("judging a drag still in flight", () => {
    const typesOf = (mimeTypes: string[]) => {
      const dataTransfer = new DataTransfer();

      for (const type of mimeTypes) dataTransfer.items.add(new File(["x"], "f", { type }));

      return new DataTransferDragTypes(dataTransfer);
    };

    it("refuses nothing when the list is empty", () => {
      expect(isDragRefused(typesOf(["text/plain"]), [])).toBe(false);
    });

    it("refuses a drag whose every type is known and unwanted", () => {
      expect(isDragRefused(typesOf(["text/plain"]), ["image/*"])).toBe(true);
    });

    it("allows a drag carrying one wanted type among others", () => {
      expect(isDragRefused(typesOf(["text/plain", "image/png"]), ["image/*"])).toBe(false);
    });

    it("withholds judgement when the list needs a file name", () => {
      expect(isDragRefused(typesOf(["text/plain"]), [".pdf"])).toBe(false);
    });

    it("withholds judgement on a file the platform gave no type", () => {
      // Which is also how a directory arrives — the two are indistinguishable until the drop.
      expect(isDragRefused(typesOf([""]), ["image/*"])).toBe(false);
    });
  });
});
